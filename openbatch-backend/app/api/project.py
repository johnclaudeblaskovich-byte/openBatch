"""Project validation & normalization endpoints.

Gives the server a single schema authority over `.bpd` payloads before simulation:
  * POST /project/validate  → {valid, errors[]} (Pydantic shape + referential integrity)
  * POST /project/normalize → the project with documented defaults applied / units normalized

The validate path never mutates its input; normalize works on a deep copy.
"""

from __future__ import annotations

import copy
from typing import Any

from fastapi import APIRouter, Body
from pydantic import ValidationError

from app.schemas import Project

router = APIRouter(prefix="/project", tags=["project"])

# Documented default charge rate (kg/min) when neither rate nor time is supplied.
DEFAULT_CHARGE_RATE_KG_PER_MIN = 100.0
DEFAULT_WORKING_VOLUME_FRACTION = 0.8


def _extract_project(body: dict) -> dict:
    """Accept either a bare project or a full .bpd wrapper ({..., project})."""
    if isinstance(body, dict) and isinstance(body.get("project"), dict):
        return body["project"]
    return body


def _iter_operations(project: dict):
    """Yield (unit_procedure, operation) pairs across every process/step/UP."""
    for proc in project.get("processes", []):
        for step in proc.get("steps", []):
            for up in step.get("unitProcedures", []):
                for op in up.get("operations", []):
                    yield step, up, op


def check_referential_integrity(project: dict) -> list[str]:
    """Return an error per dangling equipment/material/reaction reference (empty = clean)."""
    equipment_ids = {
        u["id"]
        for f in project.get("facilities", [])
        for u in f.get("equipmentUnits", [])
        if "id" in u
    }
    facility_ids = {f["id"] for f in project.get("facilities", []) if "id" in f}
    material_ids = {m["id"] for m in project.get("materials", []) if "id" in m}
    reaction_ids = {r["id"] for r in project.get("reactions", []) if "id" in r}

    errors: list[str] = []

    def check_equip(ref: Any, where: str) -> None:
        if isinstance(ref, str) and ref and ref not in equipment_ids:
            errors.append(f"{where}: unknown equipmentId '{ref}'")

    def check_material(ref: Any, where: str) -> None:
        if isinstance(ref, str) and ref and ref not in material_ids:
            errors.append(f"{where}: unknown materialId '{ref}'")

    def check_reaction(ref: Any, where: str) -> None:
        if isinstance(ref, str) and ref and ref not in reaction_ids:
            errors.append(f"{where}: unknown reactionDataSetId '{ref}'")

    for step, up, op in _iter_operations(project):
        if isinstance(step.get("facilityId"), str) and step["facilityId"] not in facility_ids:
            # Report once per offending step reference.
            msg = f"step '{step.get('id')}': unknown facilityId '{step['facilityId']}'"
            if msg not in errors:
                errors.append(msg)
        if up.get("primaryEquipmentId"):
            msg = f"unit procedure '{up.get('id')}'"
            check_equip(up["primaryEquipmentId"], msg)

        where = f"operation '{op.get('id')}' ({op.get('type')})"
        for key, val in op.items():
            if key == "reactionDataSetId":
                check_reaction(val, where)
            elif key == "materialId" or key.endswith("MaterialId"):
                check_material(val, where)
            elif key == "equipmentId" or key.endswith("EquipmentId"):
                check_equip(val, where)
        # Charge materials.
        for mat in op.get("materials", []) or []:
            if isinstance(mat, dict):
                check_material(mat.get("materialId"), where)
        # Feeds (continuous / inventory).
        for feed in (op.get("continuousFeeds") or op.get("feeds") or []):
            if isinstance(feed, dict):
                check_material(feed.get("materialId"), where)
                check_equip(feed.get("sourceEquipmentId"), where)

    return errors


@router.post("/validate")
def validate_project(body: dict = Body(...)) -> dict:
    """Validate a project's shape (Pydantic) and referential integrity. Does not mutate input."""
    project = _extract_project(body)
    errors: list[str] = []
    try:
        Project.model_validate(project)
    except ValidationError as exc:
        for err in exc.errors():
            loc = ".".join(str(p) for p in err["loc"])
            errors.append(f"{loc}: {err['msg']}")
    # Referential integrity only makes sense if the basic shape parsed.
    if not errors:
        errors.extend(check_referential_integrity(project))
    return {"valid": len(errors) == 0, "errors": errors}


def _normalize_project(project: dict) -> dict:
    """Apply documented defaults on a deep copy; never overrides user-specified values."""
    out = copy.deepcopy(project)

    for facility in out.get("facilities", []):
        for unit in facility.get("equipmentUnits", []):
            if unit.get("workingVolumeFraction") is None and unit.get("maxFillVolume") is None:
                unit["workingVolumeFraction"] = DEFAULT_WORKING_VOLUME_FRACTION

    for _step, _up, op in _iter_operations(out):
        op.setdefault("isEnabled", True)
        if op.get("type") == "Charge":
            if op.get("chargeRateKgPerMin") is None and op.get("chargeTimeMin") is None:
                op["chargeRateKgPerMin"] = DEFAULT_CHARGE_RATE_KG_PER_MIN

    return out


@router.post("/normalize")
def normalize_project(body: dict = Body(...)) -> dict:
    """Return the project with defaults applied (charge rate, working-volume fraction, isEnabled)."""
    project = _extract_project(body)
    return {"project": _normalize_project(project)}
