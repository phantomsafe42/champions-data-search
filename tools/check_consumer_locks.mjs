import crypto from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const commonGitDirectory = execFileSync("git", ["-C", projectRoot, "rev-parse", "--path-format=absolute", "--git-common-dir"], {
  encoding: "utf8",
  windowsHide: true,
}).trim();
const primaryProjectRoot = path.dirname(commonGitDirectory);
const workspaceRoot = path.resolve(primaryProjectRoot, "..", "..");
const datasetRepository = path.join(workspaceRoot, "Datasets");
const assetRepository = path.join(datasetRepository, "Pokemon Assets");
const plcRepository = path.join(workspaceRoot, "Web Tools", "Pokemon Line Calculator");

const sha256 = bytes => crypto.createHash("sha256").update(bytes).digest("hex").toUpperCase();
const readJson = file => JSON.parse(fs.readFileSync(file, "utf8"));

function normalizeRelative(value, label = "path") {
  const normalized = String(value).replaceAll("\\", "/").replace(/^\.\//u, "");
  if (!normalized || normalized.startsWith("/") || normalized.split("/").includes("..")) {
    throw new Error(`Unsafe ${label}: ${value}`);
  }
  return normalized;
}

function git(repository, args, { buffer = false, allowFailure = false } = {}) {
  const result = spawnSync("git", ["-C", repository, ...args], {
    encoding: buffer ? null : "utf8",
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (!allowFailure && result.status !== 0) throw new Error(String(result.stderr || result.stdout).trim());
  return result;
}

function verifyTag(lock) {
  const local = git(datasetRepository, ["rev-parse", `${lock.tag}^{commit}`], { allowFailure: true });
  if (local.status === 0) {
    const commit = local.stdout.trim();
    if (commit !== lock.commit) throw new Error(`Dataset tag ${lock.tag} resolves to ${commit}, not ${lock.commit}`);
    return "local-tag";
  }
  const rows = git(datasetRepository, ["ls-remote", "--tags", "origin", `refs/tags/${lock.tag}`, `refs/tags/${lock.tag}^{}`]).stdout
    .split(/\r?\n/u).filter(Boolean);
  const peeled = rows.find(row => row.endsWith(`refs/tags/${lock.tag}^{}`)) || rows[0];
  if (peeled?.split(/\s+/u)[0] !== lock.commit) throw new Error(`Remote Dataset tag ${lock.tag} does not match its lock`);
  return "remote-tag";
}

function artifactCandidates(lock) {
  const candidates = [];
  if (process.env.CHAMPIONS_DATASET_ARTIFACT) candidates.push(path.resolve(process.env.CHAMPIONS_DATASET_ARTIFACT));
  const rows = git(datasetRepository, ["worktree", "list", "--porcelain"]).stdout.split(/\r?\n/u);
  for (const row of rows) if (row.startsWith("worktree ")) candidates.push(path.join(row.slice(9), "release-artifacts", lock.tag, lock.artifact.name));
  candidates.push(path.join(datasetRepository, "release-artifacts", lock.tag, lock.artifact.name));
  return [...new Set(candidates.map(candidate => path.resolve(candidate)))];
}

function downloadArtifact(lock) {
  const cacheRoot = path.join(projectRoot, ".codex-tmp", "dataset-release-artifacts", lock.tag);
  fs.mkdirSync(cacheRoot, { recursive: true });
  const target = path.join(cacheRoot, lock.artifact.name);
  const result = spawnSync("gh", ["release", "download", lock.tag, "--repo", lock.repository, "--pattern", lock.artifact.name, "--dir", cacheRoot, "--clobber"], {
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.status !== 0 || !fs.existsSync(target)) throw new Error(`Dataset artifact is unavailable: ${String(result.stderr || result.stdout).trim()}`);
  return target;
}

function listFiles(root) {
  if (!fs.existsSync(root)) return [];
  const files = [];
  const visit = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) files.push(normalizeRelative(path.relative(root, absolute)));
      else throw new Error(`Unsupported consumer file: ${absolute}`);
    }
  };
  visit(root);
  return files.sort();
}

function extractArchive(archive, expectedPrefix) {
  const tar = process.platform === "win32" ? "tar.exe" : "tar";
  const listing = spawnSync(tar, ["-tf", archive], { encoding: "utf8", windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
  if (listing.status !== 0) throw new Error(`Unable to inspect archive: ${String(listing.stderr || listing.stdout).trim()}`);
  const entries = listing.stdout.split(/\r?\n/u).filter(Boolean).map(entry => normalizeRelative(entry, "archive path"));
  if (new Set(entries).size !== entries.length || entries.some(entry => !entry.startsWith(`${expectedPrefix}/`))) {
    throw new Error(`Archive is not an exact ${expectedPrefix} projection`);
  }
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "champions-lock-"));
  const extracted = spawnSync(tar, ["-xf", archive, "-C", temporaryRoot], { encoding: "utf8", windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
  if (extracted.status !== 0) {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
    throw new Error(`Unable to extract archive: ${String(extracted.stderr || extracted.stdout).trim()}`);
  }
  return { temporaryRoot, entries };
}

function compareTrees(expectedRoot, actualRoot, label) {
  const expected = listFiles(expectedRoot);
  const actual = listFiles(actualRoot);
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  const missing = expected.filter(file => !actualSet.has(file));
  const extras = actual.filter(file => !expectedSet.has(file));
  const changed = expected.filter(file => actualSet.has(file) && !fs.readFileSync(path.join(expectedRoot, file)).equals(fs.readFileSync(path.join(actualRoot, file))));
  if (missing.length || extras.length || changed.length) {
    throw new Error(`${label} differs from its lock (missing: ${missing.join(", ") || "none"}; extras: ${extras.join(", ") || "none"}; changed: ${changed.join(", ") || "none"})`);
  }
  return expected.length;
}

function verifyDataset() {
  const lock = readJson(path.join(projectRoot, "dataset-lock.json"));
  if (lock.schemaVersion !== "champions-database-dataset-lock/v1" || lock.profile !== "champions-database") throw new Error("Unsupported Champions Dataset lock");
  const tagSource = verifyTag(lock);
  const artifact = artifactCandidates(lock).find(candidate => fs.existsSync(candidate)) || downloadArtifact(lock);
  if (sha256(fs.readFileSync(artifact)) !== String(lock.artifact.sha256).toUpperCase()) throw new Error("Champions Dataset artifact digest mismatch");
  const extracted = extractArchive(artifact, "dataset");
  try {
    return { tagSource, artifact, files: compareTrees(path.join(extracted.temporaryRoot, "dataset"), path.join(projectRoot, "dataset"), "Champions Dataset projection") };
  } finally {
    fs.rmSync(extracted.temporaryRoot, { recursive: true, force: true });
  }
}

function materializeTree(repository, commit, treePath, prefix) {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), `${prefix}-`));
  const archive = path.join(temporaryRoot, "tree.tar");
  const archived = git(repository, ["archive", "--format=tar", "-o", archive, commit, treePath], { allowFailure: true });
  if (archived.status !== 0) {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
    throw new Error(`Unable to materialize ${treePath} at ${commit}: ${String(archived.stderr || archived.stdout).trim()}`);
  }
  const tar = process.platform === "win32" ? "tar.exe" : "tar";
  const extracted = spawnSync(tar, ["-xf", archive, "-C", temporaryRoot], { encoding: "utf8", windowsHide: true });
  if (extracted.status !== 0) {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
    throw new Error(`Unable to extract ${treePath}`);
  }
  return temporaryRoot;
}

function verifyAssets() {
  const lock = readJson(path.join(projectRoot, "asset-lock.json"));
  if (lock.schemaVersion !== "champions-database-asset-lock/v1") throw new Error("Unsupported Champions asset lock");
  const resolverBytes = git(assetRepository, ["show", `${lock.source.commit}:consumer/pokemon_asset_resolver.global.js`], { buffer: true }).stdout;
  const indexBytes = git(assetRepository, ["show", `${lock.source.commit}:release/index.json`], { buffer: true }).stdout;
  if (sha256(resolverBytes) !== String(lock.source.resolverSha256).toUpperCase()) throw new Error("Asset resolver does not match its locked commit");
  if (sha256(indexBytes) !== String(lock.source.indexSha256).toUpperCase()) throw new Error("Assets index does not match its locked commit");
  const index = JSON.parse(indexBytes.toString("utf8"));
  const manifestBytes = git(assetRepository, ["show", `${lock.source.commit}:release/${index.manifest.path}`], { buffer: true }).stdout;
  if (sha256(manifestBytes) !== String(lock.source.manifestSha256).toUpperCase()) throw new Error("Assets manifest does not match its locked commit");
  if (index.releaseVersion !== lock.source.releaseVersion) throw new Error("Assets release version does not match its lock");
  const generatedResolver = path.join(projectRoot, "generated", "pokemon_asset_resolver.global.js");
  const generatedProvenance = readJson(path.join(projectRoot, "generated", "pokemon_asset_resolver.provenance.json"));
  if (!fs.readFileSync(generatedResolver).equals(resolverBytes)) throw new Error("Champions asset resolver differs from its locked commit");
  if (generatedProvenance.schemaVersion !== 2
    || generatedProvenance.sourceCommit !== lock.source.commit
    || generatedProvenance.sourceSha256.toUpperCase() !== lock.source.resolverSha256.toUpperCase()
    || generatedProvenance.releaseIndexSha256.toUpperCase() !== lock.source.indexSha256.toUpperCase()
    || generatedProvenance.releaseManifestSha256.toUpperCase() !== lock.source.manifestSha256.toUpperCase()) {
    throw new Error("Champions asset resolver provenance differs from asset-lock.json");
  }
  const hostedRoot = materializeTree(plcRepository, lock.hostedProjection.commit, lock.hostedProjection.path, "champions-assets");
  try {
    const projectionRoot = path.join(hostedRoot, lock.hostedProjection.path);
    const projection = readJson(path.join(projectionRoot, "projection.json"));
    if (projection.sourceRelease !== lock.source.releaseVersion
      || String(projection.sourceIndexSha256).toUpperCase() !== String(lock.source.indexSha256).toUpperCase()
      || String(projection.sourceManifestSha256).toUpperCase() !== String(lock.source.manifestSha256).toUpperCase()) {
      throw new Error("Hosted asset projection provenance does not match the Champions asset lock");
    }
    const actual = listFiles(projectionRoot);
    const expected = new Set(["projection.json", ...(projection.files || []).map(file => normalizeRelative(file.path))]);
    const extras = actual.filter(file => !expected.has(file));
    const missing = [...expected].filter(file => !actual.includes(file));
    if (extras.length || missing.length) throw new Error(`Hosted asset inventory mismatch (missing: ${missing.join(", ") || "none"}; extras: ${extras.join(", ") || "none"})`);
    for (const file of projection.files || []) {
      const bytes = fs.readFileSync(path.join(projectionRoot, normalizeRelative(file.path)));
      if (bytes.length !== file.bytes || sha256(bytes) !== String(file.sha256).toUpperCase()) throw new Error(`Hosted asset digest mismatch: ${file.path}`);
    }
    const html = fs.readFileSync(path.join(projectRoot, "index.html"), "utf8");
    if (!html.includes(lock.hostedProjection.releaseBase)) throw new Error("Champions index.html does not use the locked immutable asset URL");
    return { commit: lock.hostedProjection.commit, files: actual.length, profiles: lock.profiles };
  } finally {
    fs.rmSync(hostedRoot, { recursive: true, force: true });
  }
}

const dataset = verifyDataset();
const assets = verifyAssets();
console.log(JSON.stringify({ status: "consumer-locks-valid", dataset, assets }, null, 2));
