# Champions Database Working Guide

This repository is a first-party nested project inside Streaming Tools. Read `MAINTENANCE.md` and `SETTLED_HISTORY.md` before edits. Preserve all existing user changes.

## Ownership and shared data

This repository owns the static interface: `index.html`, `app.js`, `styles.css`, `box_data.json`, screenshots, local visual assets, and the generated `dataset/` compatibility snapshot. Authoritative Champions datasets and maintenance scripts live in `../../Datasets/Champions`.

When a task changes data or a data contract, read `../../AGENTS.md`, `../../Datasets/AGENTS.md`, `../../Datasets/DATASET_CONTRACT.md`, and `../../Datasets/RELEASE_CONTRACT.md`. Fix the authoritative dataset/builder, regenerate this repository's `dataset/` directory through the Dataset-owned `champions-database` export profile, and validate this consumer. Never hand-edit the generated snapshot.

The stable workspace route is `http://127.0.0.1:8000/Web%20Tools/Champions%20Database/index.html`. The repository must also remain independently servable because the exported Dataset snapshot is part of its standalone contract. Do not replace or reconfigure the shared server as part of an interface-only task.

## Safety and validation

- Preserve browser-storage contracts for Setlist, Box, teams, imports, and exports unless migration is explicitly in scope.
- Do not silently erase stored configurations or change Showdown serialization without round-trip tests.
- Keep GitHub Pages assets path-relative.
- This repository has no package-defined build/test command. Use focused source/data checks plus project-provided or headless rendering at approximately 390px and 1280px, keyboard/focus checks, overflow checks, and console-error inspection.
- Follow the shared practical visual style, but preserve established behavior and existing user edits.
- Do not publish, commit, or push without explicit authorization.

Record future verified accepted changes in `SETTLED_HISTORY.md` with data-source compatibility, storage/serialization behavior, responsive validation, limitations, and supersession.
