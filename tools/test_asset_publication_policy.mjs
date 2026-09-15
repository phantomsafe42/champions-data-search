import assert from "node:assert/strict";
import { assertNoForbiddenPublicAssetReferences, forbiddenPublicAssetReferences } from "./asset_publication_policy.mjs";

const validRuntime = {
  html: '<meta name="pokemon-asset-gateway-origin" content="https://assets.phantomsafe.tv">',
  app: 'const localBase = "/Datasets/Pokemon%20Assets/release";',
  gatewayClient: 'new URL("/v1/releases/0.7.0-dev.2/asset", "https://assets.phantomsafe.tv")',
};
assert.doesNotThrow(() => assertNoForbiddenPublicAssetReferences(validRuntime));

const invalidReferences = [
  "https://raw.githubusercontent.com/phantomsafe42/pokemon-line-calculator/commit/public-assets",
  "https://assets.phantomsafe.tv/releases/0.7.0-dev.2/index.json",
  "https://bucket.example.r2.dev/releases/0.7.0-dev.2/assets/pixel.png",
  "https://account.r2.cloudflarestorage.com/bucket/releases/0.7.0-dev.2/assets/pixel.png",
  "https://assets.phantomsafe.tv/v1/releases/0.7.0-dev.2/asset?path=releases/0.7.0-dev.2/assets/pixel.png",
  "/Datasets/Pokemon%20Assets/release/index.json",
  "/Datasets/Pokemon%20Assets/release/_meta/release-plan.json",
];

for (const reference of invalidReferences) {
  assert.throws(
    () => assertNoForbiddenPublicAssetReferences({ app: reference }),
    /forbidden in the Champions public runtime/u,
    reference
  );
}

console.log(JSON.stringify({
  status: "asset-publication-policy-valid",
  rules: forbiddenPublicAssetReferences.length,
  negativeCases: invalidReferences.length,
}, null, 2));
