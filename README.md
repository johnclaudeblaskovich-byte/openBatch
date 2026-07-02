# OpenBatch

A web-based clone of Aspen Batch Process Developer (ABPD): a recipe-oriented batch-process
modeling & simulation tool for process engineers in pharma, biotech, specialty & agricultural
chemicals. Users define process recipes as a hierarchy of unit procedures and operations,
simulate mass/energy balances, schedule equipment occupancy, and report results.

The repository is a monorepo with two side-by-side applications:

- `frontend/` — React 18 + TypeScript + Vite single-page app (the desktop-style UI).
- `openbatch-backend/` — FastAPI + Python 3.11 service.

> **All simulation runs in the backend.** Mass-balance, scheduling, and scale-up math live in
> `openbatch-backend/app/solver/`. The frontend is authoritative for user-entered data only;
> simulation results are read-only in the frontend store.

## Prerequisites

- Node.js 20+
- Python 3.11

## Frontend (port 5173)

```bash
cd frontend
npm install
npm run dev        # start Vite dev server at http://localhost:5173
npm run build      # type-check (tsc -b) + production build
npm run lint       # ESLint
npm run test       # Vitest
```

The Vite dev server proxies `/api` and `/ws` to the backend at `http://localhost:8000`.

## Backend (port 8000)

```bash
cd openbatch-backend
python -m venv .venv
# Windows (PowerShell):  .venv\Scripts\Activate.ps1
# Windows (Git Bash):    source .venv/Scripts/activate
# macOS/Linux:           source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
pytest             # run backend tests
```

Health check: `curl http://localhost:8000/api/health` → `{"status":"ok","service":"openbatch","version":"1.0"}`

## Makefile shortcuts

```bash
make frontend      # start the Vite dev server (port 5173)
make backend       # start the Uvicorn dev server (port 8000)
make test          # run frontend (Vitest) + backend (pytest) tests
```

> On Windows, `make` may need to be installed (e.g. via Chocolatey or Git for Windows). The raw
> commands above are the canonical path and always work.

## File format — `.bpd`

A project saves to a single JSON file shaped
`{ "fileVersion": "1.0.0", "appVersion": "OpenBatch 1.0", "createdAt": ISO8601, "project": { …full Project object… } }`.
The entire project (facilities, materials, reactions, processes, production plans) serializes to
this one file — no binary, no zip.
