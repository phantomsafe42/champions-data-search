# Champions Database Settled History

### September 11, 2026 — Champions 1.2 public release integration

- Published the Dataset-owned Champions 1.2 Regulation M-C compatibility
  snapshot from Dataset release `v0.1.9`, pinned by `dataset-lock.json` to commit
  `b8dd569ffcf7f0fe12821fb62e0271862dca1380` and the independently verified
  Champions release artifact.
- Replaced repository-owned Pokémon sprite copies and direct third-party image
  hosts with identity queries resolved through Pokemon Assets `0.5.0-dev.1`.
  `asset-lock.json` pins the private authority at commit
  `86d01088927edd72257b290b24aab6600d4b3b99` and the immutable public projection
  hosted by PLC commit `8bf1085cd682688df54ae612272e99f7cc500edb`.
- Dataset export write/check, JavaScript syntax, JSON parsing, and a standalone
  public-profile Chromium smoke passed. The browser rendered all 289 cards and
  all 289 card sprites plus the title sprite, loaded 509 moves and 216
  abilities, preserved tab focus/selection, had no console, network, or HTTP
  errors, and had no horizontal overflow at approximately 390px and 1280px.

### September 9, 2026 — Dataset consumer export and standalone restoration

- Superseded the earlier direct `../../Datasets/Champions` runtime dependency.
  Champions Database now reads the Dataset-owned `champions-database` export
  from its local `dataset/` directory, preserving a self-contained public and
  offline repository without creating another data authority.
- Materialized the six reviewed Champions 1.2 payload files and their generated
  export manifest. Dataset export write/check and the generic multi-profile
  export test passed with source-tree SHA-256
  `5B1115DBEA18C657EC1F2350CD400D043DD2CFC77D13C1751986A61015CBF018`.
- A repository-only headless Chromium smoke loaded all five runtime JSON files
  with HTTP 200 and rendered 289 species cards, 509 moves, and 216 abilities at
  390px and 1280px with no runtime JavaScript errors. The workspace route and
  generated manifest also returned HTTP 200. No service was restarted and
  nothing was committed, tagged, or published; the next Dataset release lock
  remains a publication gate.

### September 9, 2026 — Pokemon Champions 1.2 Regulation M-C dataset adoption

- Adopted the Dataset-owned, pinned Pokémon Showdown M-C projection without
  creating a local data copy. The app now consumes 293 explicit source form
  identities and displays 289 cards; Gourgeist sizes and female Basculegion
  remain embedded form choices for compatibility with existing saved Box
  records, while distinct Rotom, Lycanroc, Meowstic, gender, regional, and
  cosmetic identities remain independently searchable.
- Preserved the established `championsDatabase.*` storage namespace and legacy
  migration behavior. Male Meowstic retains `meowstic-m`; all previously
  emitted Mega and transforming-form IDs remain resolvable.
- `node --check app.js` passed. The existing static server served the M-C
  dataset and renamed app route with HTTP 200, and a headless Chromium smoke
  loaded 289 species cards, 509 moves, and 216 abilities with no detected
  runtime JavaScript errors. No service was restarted and nothing was
  published.

### September 9, 2026 — Local repository folder renamed to Champions Database

- Renamed the first-party repository folder from `Web Tools/Champions Move Finder`
  to `Web Tools/Champions Database`; the new local route is
  `/Web%20Tools/Champions%20Database/index.html`.
- Updated the maintained workspace map, Web Tools guidance, Champions Dataset
  validator and documentation, Pokemon Assets resolver-sync target, and the six
  Overlay move-category icon references. Historical backups and audit snapshots
  retain the former path as history.
- The primary browser-storage namespace is now `championsDatabase.*`. Existing
  `championsDataSearch.*` and `championsMoveFinder.*` values are copied into the
  new keys and removed only after the new values are written, preserving saved
  Setlist, Box, team, and seed-import state. All pre-existing uncommitted
  Champions work remains intact. The remote repository, publication state, and
  Champions 1.2 data were not changed.
- Validation passed for all 313 Champions sprite queries, all four generated
  asset-resolver projections, both legacy browser-storage migrations, the live
  renamed app route, and a shared move-category icon request. No service or OBS
  restart was performed.

No component patch-note entries were present to migrate during the August 23, 2026 instruction restructure. Current feature behavior is documented in `README.md`.

Add future accepted changes here after source/data checks, storage or Showdown round-trip validation when applicable, responsive rendering, accessibility checks, and console-error review. Do not claim deployment unless it was explicitly performed.
