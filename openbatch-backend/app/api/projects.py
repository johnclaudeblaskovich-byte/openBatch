"""Project REST endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Body

router = APIRouter(prefix="/api/projects", tags=["projects"])

# Required top-level keys of a `.bpd` document.
_REQUIRED_KEYS = ["project"]


@router.post("/validate")
def validate_project(body: dict = Body(...)) -> dict:
    """Stub validation: check the required top-level keys are present."""
    errors = [f"Missing required key: {k}" for k in _REQUIRED_KEYS if k not in body]
    return {"valid": len(errors) == 0, "errors": errors}
