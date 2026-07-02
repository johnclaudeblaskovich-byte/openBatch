"""Shared helpers used across operation solvers."""

from __future__ import annotations

from .convert import convert_to_kg
from .state import SimulationContext, VesselContents


def get_equipment_ids(op: dict) -> list[str]:
    """Return every equipment id an operation touches, scanning ``*EquipmentId(s)`` fields."""
    ids: list[str] = []

    def add(value: str) -> None:
        if value and value not in ids:
            ids.append(value)

    for key, value in op.items():
        lower = key.lower()
        if key == "equipmentId" or lower.endswith("equipmentid"):
            if isinstance(value, str):
                add(value)
        elif lower.endswith("equipmentids") and isinstance(value, list):
            for v in value:
                if isinstance(v, str):
                    add(v)
    return ids


def get_key_coeff(rxn: dict) -> float:
    """Stoichiometric coefficient of the reaction's key component (default 1.0)."""
    key_id = rxn.get("keyComponentId")
    for r in rxn.get("reactants", []):
        if r.get("materialId") == key_id:
            return float(r.get("stoichiometricCoeff", 1.0))
    return 1.0


def ensure_vessel(ctx: SimulationContext, equip_id: str) -> VesselContents:
    """Return the vessel for ``equip_id``, creating an empty one if needed."""
    vessel = ctx.vessels.get(equip_id)
    if vessel is None:
        vessel = VesselContents(equipment_id=equip_id)
        ctx.vessels[equip_id] = vessel
    return vessel


def get_equipment(equip_id: str, ctx: SimulationContext) -> dict | None:
    """Look up an equipment unit dict by id across the project's facilities."""
    for facility in ctx.project.get("facilities", []):
        for unit in facility.get("equipmentUnits", []):
            if unit.get("id") == equip_id:
                return unit
    return None


def compute_batch_volume(up: dict, ctx: SimulationContext) -> float:
    """Total charged volume (m³) in a unit procedure = Σ charged mass / density."""
    volume = 0.0
    for op in up.get("operations", []):
        if op.get("type") != "Charge":
            continue
        for mat in op.get("materials", []):
            material = ctx.materials_db.get(mat["materialId"], {})
            mass = convert_to_kg(mat["amount"], mat["amountUnit"], material)
            density = material.get("density") or 1000.0
            volume += mass / density
    return volume


def compute_current_output(step: dict, ctx: SimulationContext) -> float:
    """Current batch output (kg) — total charged mass across the step (batch-size proxy)."""
    total = 0.0
    for up in step.get("unitProcedures", []):
        for op in up.get("operations", []):
            if op.get("type") != "Charge":
                continue
            for mat in op.get("materials", []):
                material = ctx.materials_db.get(mat["materialId"], {})
                total += convert_to_kg(mat["amount"], mat["amountUnit"], material)
    return total
