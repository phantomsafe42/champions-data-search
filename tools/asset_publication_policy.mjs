export const forbiddenPublicAssetReferences = Object.freeze([
  Object.freeze({ label: "PLC asset projection", pattern: /pokemon-line-calculator|public-assets/iu }),
  Object.freeze({ label: "raw GitHub asset origin", pattern: /raw\.githubusercontent\.com|githubusercontent\.com/iu }),
  Object.freeze({ label: "raw R2 asset origin", pattern: /(?:r2\.dev|cloudflarestorage\.com)/iu }),
  Object.freeze({ label: "raw asset release base", pattern: /https:\/\/assets\.phantomsafe\.tv\/releases(?:\/|["'])/iu }),
  Object.freeze({ label: "raw asset selector field", pattern: /https:\/\/assets\.phantomsafe\.tv\/v1\/releases\/[^?\s"']+\/asset\?[^\s"']*(?:path|key|url|prefix|filename)=/iu }),
  Object.freeze({ label: "direct asset metadata request", pattern: /Pokemon%20Assets\/release\/(?:index|asset-index|manifest|credits)\.json|Pokemon%20Assets\/release\/_meta\//iu }),
]);

export function assertNoForbiddenPublicAssetReferences({ html = "", app = "", gatewayClient = "" } = {}) {
  const publicRuntime = `${html}\n${app}\n${gatewayClient}`;
  for (const { label, pattern } of forbiddenPublicAssetReferences) {
    if (pattern.test(publicRuntime)) throw new Error(`${label} is forbidden in the Champions public runtime`);
  }
}
