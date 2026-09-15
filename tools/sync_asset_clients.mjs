import crypto from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const commonGitDirectory = execFileSync("git", ["-C", projectRoot, "rev-parse", "--path-format=absolute", "--git-common-dir"], {
  encoding: "utf8",
  windowsHide: true,
}).trim();
const primaryProjectRoot = path.dirname(commonGitDirectory);
const workspaceRoot = path.resolve(primaryProjectRoot, "..", "..");
const assetRepository = path.join(workspaceRoot, "Datasets", "Pokemon Assets");
const lock = JSON.parse(fs.readFileSync(path.join(projectRoot, "asset-lock.json"), "utf8"));
const checkOnly = process.argv.includes("--check");
const writeMode = process.argv.includes("--write");

if (checkOnly === writeMode) throw new Error("Choose exactly one asset-client sync mode: --check or --write");
if (lock.schemaVersion !== "champions-database-asset-gateway-lock/v1") throw new Error("Unsupported Champions asset gateway lock");

const sha256 = bytes => crypto.createHash("sha256").update(bytes).digest("hex");

function producerFile(relativePath) {
  const result = spawnSync("git", ["-C", assetRepository, "show", `${lock.source.commit}:${relativePath}`], {
    encoding: null,
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(String(result.stderr || result.stdout).trim());
  return result.stdout;
}

function expectedProvenance(projectionName, projection) {
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

const projections = [
  ["local", lock.localProjection],
  ["published", lock.publishedProjection],
];
const completed = [];

for (const [projectionName, projection] of projections) {
  const sourceBytes = producerFile(projection.client.sourcePath);
  if (sourceBytes.length !== projection.client.bytes || sha256(sourceBytes) !== projection.client.sha256) {
    throw new Error(`${projectionName} asset client does not match its pinned producer identity`);
  }
  const target = path.join(projectRoot, projection.client.generatedPath);
  const provenanceTarget = path.join(projectRoot, projection.client.provenancePath);
  const provenance = expectedProvenance(projectionName, projection);
  if (checkOnly) {
    if (!fs.existsSync(target) || !fs.readFileSync(target).equals(sourceBytes)) throw new Error(`${projectionName} generated asset client is stale`);
    if (!fs.existsSync(provenanceTarget) || !fs.readFileSync(provenanceTarget).equals(provenance)) throw new Error(`${projectionName} asset client provenance is stale`);
  } else {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, sourceBytes);
    fs.writeFileSync(provenanceTarget, provenance);
  }
  completed.push({ projection: projectionName, source: projection.client.sourcePath, generated: projection.client.generatedPath, sha256: projection.client.sha256 });
}

console.log(JSON.stringify({
  status: checkOnly ? "asset-clients-current" : "asset-clients-synced",
  sourceCommit: lock.source.commit,
  releaseVersion: lock.release.version,
  clients: completed,
}, null, 2));
