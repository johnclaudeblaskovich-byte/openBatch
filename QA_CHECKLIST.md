# OpenBatch — MVP QA Checklist

Manual verification of each MVP capability against the spec. Run the backend
(`uvicorn app.main:app --port 8000`) and frontend (`npm run dev`, port 5173), then walk each row.

## Hierarchy CRUD
- [ ] **Add process / step / unit procedure** — Explorer tree adds nodes; selecting a step opens the Recipe view.
- [ ] **Add operation** — Recipe toolbar → "+ Operation" → pick a type → row appears in the correct unit procedure.
- [ ] **Edit operation** — double-click a row opens the Operation dialog; Save persists changes; incomplete required fields block Save with inline messages.
- [ ] **Reorder / delete** — Move Up / Move Down / Delete act on the selected operation; unit procedures deletable.

## 18 Tier-1 operations
- [ ] Each operation type (Charge, Transfer, PressureTransfer, React, YieldReact, Crystallize, Distill, Filter, WashCake, FilterDry, Centrifuge, Dry, Heat, Cool, Mix, Age, Extract, Decant, Concentrate, Ferment) can be created and edited with its own Main/Model tabs.
- [ ] Operation status dot colors match the design tokens.

## Simulation & JIT scheduling
- [ ] **Simulate Current Step** (Run menu) shows progress in the status bar, then results.
- [ ] Two unit procedures sharing equipment serialize; independent ones overlap in the Gantt.

## Reports
- [ ] **Gantt** — bars per equipment row, batch-time marker, tooltips, click selects the operation.
- [ ] **Stream table** — one row per stream, per-material kg + fraction columns.
- [ ] **Material balance** — per-operation in/out/accumulation/discrepancy; >0.1% rows flagged.
- [ ] **Equipment contents** — per-equipment snapshots with fill %, overfill flagged.
- [ ] **Warnings** — Implicit-Rules violations grouped by operation; warning (amber) vs error (red) colors; tab badge shows count.

## Production plan & campaign
- [ ] Create a plan, add entries (process/step/#batches), reorder, delete.
- [ ] Run a campaign; results show per-batch schedule and totals; empty plan shows "No entries yet".

## Scale-up (5 modes)
- [ ] Scale-Up dialog: MaxBatchCurrentEquipment, MaxBatchSpecificEquipment, TargetBatchSize, MultipleOfCurrent, ReturnToOriginal.
- [ ] Preview shows factor + predicted output; Apply scales charges (and transfers), not other ops.
- [ ] ReturnToOriginal restores the original amounts (round-trip).

## Equipment replacement
- [ ] Replace Equipment dialog lists equipment used in the step; replacement filtered to same class; overfill warning when the new unit is too small; Apply reassigns references.

## .bpd I/O
- [ ] **Save (.bpd)** downloads `{projectName}.bpd` with top-level keys exactly `fileVersion, appVersion, createdAt, project`.
- [ ] **Open (.bpd)** restores the full project (tree, facilities, materials, reactions, plans).
- [ ] A malformed / wrong-version file shows a clear error and does not corrupt the loaded project.
- [ ] Backend `POST /project/validate` rejects dangling material/equipment references, listing the offending ids.

## Text recipe & exports
- [ ] Recipe view "Text Recipe" toggle renders numbered mono text with a Copy button.
- [ ] Stream / balance / contents tabs offer Export ▾ → CSV and XLSX; downloaded files open cleanly.
- [ ] "Report / Print" opens the full-page Step Report; browser Print shows only the report content.

## Empty / loading / error states
- [ ] No project loaded → main editor shows an empty state.
- [ ] No step selected → Recipe and Results panels show a prompt, not a blank/crash.
- [ ] During solve → results panel shows a loading skeleton; status bar shows progress.
- [ ] Kill the backend mid-solve → results panel shows a red error banner; retry after restart recovers.

## Consistency sweep
- [ ] Design tokens (colors/fonts) applied throughout; no hard-coded off-palette colors.
- [ ] No mass-balance / scheduling / scale-up math in the frontend — all values come from the backend.
- [ ] `OperationType` string values match between the frontend union and backend `OPERATION_SOLVERS` keys.
