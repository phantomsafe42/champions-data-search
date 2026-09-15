import crypto from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { assertNoForbiddenPublicAssetReferences } from "./asset_publication_policy.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const commonGitDirectory = execFileSync("git", ["-C", projectRoot, "rev-parse", "--path-format=absolute", "--git-common-dir"], {
  encoding: "utf8",
  windowsHide: true,
}).trim();
const primaryProjectRoot = path.dirname(commonGitDirectory);
const workspaceRoot = path.resolve(primaryProjectRoot, "..", "..");
const datasetRepository = path.join(workspaceRoot, "Datasets");
const assetRepository = path.join(datasetRepository, "Pokemon Assets");

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

function verifyAssetTag(lock) {
  const local = git(assetRepository, ["rev-parse", `${lock.release.tag}^{commit}`], { allowFailure: true });
  if (local.status === 0) {
    if (local.stdout.trim() !== lock.release.tagCommit) throw new Error("Pokemon Assets release tag does not match its lock");
    return "local-tag";
  }
  const rows = git(assetRepository, ["ls-remote", "--tags", "origin", `refs/tags/${lock.release.tag}`, `refs/tags/${lock.release.tag}^{}`]).stdout
    .split(/\r?\n/u).filter(Boolean);
  const peeled = rows.find(row => row.endsWith(`refs/tags/${lock.release.tag}^{}`)) || rows[0];
  if (peeled?.split(/\s+/u)[0] !== lock.release.tagCommit) throw new Error("Remote Pokemon Assets release tag does not match its lock");
  return "remote-tag";
}

function assetFileAtCommit(commit, descriptor, label) {
  const sourcePath = normalizeRelative(descriptor.path || descriptor.sourcePath, `${label} path`);
  const bytes = git(assetRepository, ["show", `${commit}:${sourcePath}`], { buffer: true }).stdout;
  if (bytes.length !== descriptor.bytes || sha256(bytes) !== String(descriptor.sha256).toUpperCase()) {
    throw new Error(`${label} does not match its pinned Pokemon Assets commit`);
  }
  return bytes;
}

function producerAssetFile(lock, descriptor, label) {
  return assetFileAtCommit(lock.source.commit, descriptor, label);
}

function expectedAssetProvenance(lock, projectionName, projection) {
  const published = projectionName === "published";
  return Buffer.from(`${JSON.stringify({
    schemaVersion: 3,
    generated: true,
    projection: projectionName,
    mode: projection.mode,
    sourceRepository: lock.source.repository,
    sourceCommit: lock.source.commit,
    sourcePath: projection.client.sourcePath,
    sourceSha256: projection.client.sha256,
    generatedPath: projection.client.generatedPath,
    releaseVersion: lock.release.version,
    releaseTag: lock.release.tag,
    releaseTagCommit: lock.release.tagCommit,
    releaseIndexSha256: lock.release.rootIndex.sha256,
    releaseManifestSha256: lock.release.manifest.sha256,
    releaseCreditsSha256: lock.release.credits.sha256,
    ...(published ? {
      gatewayOrigin: projection.origin,
      assetRoute: projection.assetRoute,
      gatewayConfigurationSha256: lock.gatewayConfiguration.configuration.sha256,
      wranglerConfigurationSha256: lock.gatewayConfiguration.wrangler.sha256,
      workerVersion: lock.gatewayConfiguration.workerVersion,
      workerDeployment: lock.gatewayConfiguration.workerDeployment,
    } : { releaseBase: projection.releaseBase }),
  }, null, 2)}\n`);
}

function verifyAssetProjection(lock, projectionName, projection) {
  const sourceBytes = producerAssetFile(lock, projection.client, `${projectionName} asset client`);
  const generatedPath = path.join(projectRoot, normalizeRelative(projection.client.generatedPath, `${projectionName} generated path`));
  const provenancePath = path.join(projectRoot, normalizeRelative(projection.client.provenancePath, `${projectionName} provenance path`));
  if (!fs.existsSync(generatedPath) || !fs.readFileSync(generatedPath).equals(sourceBytes)) {
    throw new Error(`${projectionName} generated asset client differs from its pinned producer file`);
  }
  if (!fs.existsSync(provenancePath) || !fs.readFileSync(provenancePath).equals(expectedAssetProvenance(lock, projectionName, projection))) {
    throw new Error(`${projectionName} generated asset client provenance differs from asset-lock.json`);
  }
  return { mode: projection.mode, client: projection.client.generatedPath, sha256: projection.client.sha256 };
}

function verifyAssets() {
  const lock = readJson(path.join(projectRoot, "asset-lock.json"));
  if (lock.schemaVersion !== "champions-database-asset-gateway-lock/v1") throw new Error("Unsupported Champions asset gateway lock");
  if (!/^[0-9a-f]{40}$/u.test(lock.source.commit) || lock.source.visibility !== "private") throw new Error("Pokemon Assets source identity is invalid");
  const tagSource = verifyAssetTag(lock);
  const indexBytes = producerAssetFile(lock, lock.release.rootIndex, "Pokemon Assets root index");
  const manifestBytes = producerAssetFile(lock, lock.release.manifest, "Pokemon Assets manifest");
  const creditsBytes = producerAssetFile(lock, lock.release.credits, "Pokemon Assets credits");
  assetFileAtCommit(lock.release.tagCommit, lock.release.rootIndex, "Tagged Pokemon Assets root index");
  assetFileAtCommit(lock.release.tagCommit, lock.release.manifest, "Tagged Pokemon Assets manifest");
  assetFileAtCommit(lock.release.tagCommit, lock.release.credits, "Tagged Pokemon Assets credits");
  const gatewayConfigBytes = producerAssetFile(lock, lock.gatewayConfiguration.configuration, "Pokemon Assets gateway configuration");
  producerAssetFile(lock, lock.gatewayConfiguration.wrangler, "Pokemon Assets Wrangler configuration");

  const index = JSON.parse(indexBytes.toString("utf8"));
  const gatewayConfig = JSON.parse(gatewayConfigBytes.toString("utf8"));
  if (index.releaseVersion !== lock.release.version
    || `release/${index.manifest.path}` !== lock.release.manifest.path
    || String(index.manifest.sha256).toUpperCase() !== String(lock.release.manifest.sha256).toUpperCase()
    || `release/${index.credits.path}` !== lock.release.credits.path
    || String(index.credits.sha256).toUpperCase() !== String(lock.release.credits.sha256).toUpperCase()) {
    throw new Error("Pokemon Assets release descriptors do not match the Champions lock");
  }
  if (sha256(manifestBytes) !== String(index.manifest.sha256).toUpperCase()
    || sha256(creditsBytes) !== String(index.credits.sha256).toUpperCase()) {
    throw new Error("Pokemon Assets release payloads do not match the root index");
  }
  const requiredProfiles = new Set(lock.release.profiles);
  for (const profile of index.profiles || []) requiredProfiles.delete(profile.profileId);
  if (requiredProfiles.size) throw new Error(`Pokemon Assets profiles are unavailable: ${[...requiredProfiles].join(", ")}`);

  const exposure = lock.gatewayConfiguration.exposurePolicy;
  if (gatewayConfig.contract !== lock.gatewayConfiguration.contract
    || gatewayConfig.publicOrigin !== lock.publishedProjection.origin
    || gatewayConfig.releaseVersion !== lock.release.version
    || gatewayConfig.routes?.asset !== lock.publishedProjection.assetRoute
    || gatewayConfig.routes?.credits !== lock.publishedProjection.creditsRoute
    || gatewayConfig.rootIndexSha256 !== lock.release.rootIndex.sha256
    || gatewayConfig.creditsSha256 !== lock.release.credits.sha256
    || gatewayConfig.completionPlanSha256 !== lock.gatewayConfiguration.privateCompletionPlanSha256
    || exposure.typedSingleAssetResponses !== true
    || exposure.creditsContract !== true
    || ["rawObjectPaths", "releaseIndexes", "releaseManifest", "releasePlan", "bucketListing", "browserCredentials"].some(key => exposure[key] !== false)
    || Object.entries(exposure).some(([key, value]) => gatewayConfig.exposurePolicy?.[key] !== value)) {
    throw new Error("Pokemon Assets gateway configuration differs from the Champions lock");
  }

  const local = verifyAssetProjection(lock, "local", lock.localProjection);
  const published = verifyAssetProjection(lock, "published", lock.publishedProjection);
  const html = fs.readFileSync(path.join(projectRoot, "index.html"), "utf8");
  const app = fs.readFileSync(path.join(projectRoot, "app.js"), "utf8");
  const gatewayClient = fs.readFileSync(path.join(projectRoot, lock.publishedProjection.client.generatedPath), "utf8");
  assertNoForbiddenPublicAssetReferences({ html, app, gatewayClient });
  if (Object.hasOwn(lock, "hostedProjection")) throw new Error("The obsolete PLC hostedProjection lock is forbidden");
  if (!html.includes(`<meta name="pokemon-asset-gateway-origin" content="${lock.publishedProjection.origin}">`)
    || !html.includes(`<meta name="pokemon-asset-release-version" content="${lock.release.version}">`)
    || !html.includes(`src="${lock.localProjection.client.generatedPath}`)
    || !html.includes(`src="${lock.publishedProjection.client.generatedPath}`)) {
    throw new Error("Champions index.html asset client configuration differs from its lock");
  }
  if (!app.includes(`const LOCAL_POKEMON_ASSET_RELEASE_BASE = "${lock.localProjection.releaseBase}"`)
    || !app.includes("globalThis.PokemonAssets?.createResolver?.")
    || !app.includes("globalThis.PokemonAssetGateway?.createClient?.")
    || app.includes("fallbackSpriteTypes")
    || !/function withAssetVersion\(path\)[\s\S]*?\^https\?:\\\/\\\//u.test(app)) {
    throw new Error("Champions application asset routing does not satisfy the local/published contract");
  }

  return {
    sourceCommit: lock.source.commit,
    tagSource,
    release: lock.release.version,
    local,
    published: { ...published, origin: lock.publishedProjection.origin, route: lock.publishedProjection.assetRoute },
    workerVersion: lock.gatewayConfiguration.workerVersion,
    workerDeployment: lock.gatewayConfiguration.workerDeployment,
  };
}

const dataset = verifyDataset();
const assets = verifyAssets();
console.log(JSON.stringify({ status: "consumer-locks-valid", dataset, assets }, null, 2));
