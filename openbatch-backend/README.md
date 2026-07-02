# OpenBatch Backend

FastAPI service that runs all OpenBatch simulation / mass-balance / scheduling / scale-up math.

## Requirements

- Python 3.11

## Setup

```bash
cd openbatch-backend
python -m venv .venv
# Windows (PowerShell):  .venv\Scripts\Activate.ps1
# Windows (Git Bash):    source .venv/Scripts/activate
# macOS/Linux:           source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

Then check the health endpoint:

```bash
curl http://localhost:8000/api/health
# {"status":"ok","service":"openbatch","version":"1.0"}
```

## Test

```bash
pytest
```
