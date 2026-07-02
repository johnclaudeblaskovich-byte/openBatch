#!/usr/bin/env bash
# Convenience runner mirroring the Makefile targets, for environments without `make`.
# Usage: ./dev.sh [frontend|backend|test|install]
set -euo pipefail

cmd="${1:-help}"

case "$cmd" in
  frontend)
    cd frontend && npm run dev
    ;;
  backend)
    cd openbatch-backend && uvicorn app.main:app --reload --port 8000
    ;;
  test)
    (cd frontend && npm run test)
    (cd openbatch-backend && pytest)
    ;;
  install)
    (cd frontend && npm install)
    (cd openbatch-backend && pip install -r requirements.txt)
    ;;
  *)
    echo "Usage: ./dev.sh [frontend|backend|test|install]"
    exit 1
    ;;
esac
