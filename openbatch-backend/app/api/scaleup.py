"""Scale-Up REST endpoints — preview a factor (no mutation) or apply it (returns scaled Step)."""

from __future__ import annotations

from fastapi import APIRouter, Body, HTTPException
from pydantic import BaseModel

from app.solver.engine import build_context
from app.solver.scaleup import apply_scale_factor, compute_scale_factor
from app.solver.util import compute_current_output

router = APIRouter(prefix="/scaleup", tags=["scaleup"])


class ScaleUpRequest(BaseModel):
    project: dict
    stepId: str
    mode: str
    params: dict = {}


def _find_step(project: dict, step_id: str) -> dict | None:
    for proc in project.get("processes", []):
        for step in proc.get("steps", []):
            if step.get("id") == step_id:
                return step
    return None


@router.post("/preview")
def preview(req: ScaleUpRequest = Body(...)) -> dict:
    step = _find_step(req.project, req.stepId)
    if step is None:
        raise HTTPException(status_code=404, detail=f"unknown step {req.stepId}")
    ctx = build_context(req.project, step)
    factor = compute_scale_factor(req.mode, req.params, step, ctx)
    predicted = compute_current_output(step, ctx) * factor
    return {"factor": factor, "predictedOutputKg": predicted}


@router.post("/apply")
def apply(req: ScaleUpRequest = Body(...)) -> dict:
    step = _find_step(req.project, req.stepId)
    if step is None:
        raise HTTPException(status_code=404, detail=f"unknown step {req.stepId}")
    ctx = build_context(req.project, step)
    factor = compute_scale_factor(req.mode, req.params, step, ctx)
    scaled = apply_scale_factor(factor, step)
    return {"factor": factor, "scaledStep": scaled}
