"""Charge solver — adds material into a vessel. Establishes the validate/solve pattern."""

from __future__ import annotations

from ..base import OperationResult, OperationSolver
from ..convert import convert_to_kg
from ..registry import register
from ..state import SimulationContext
from ..util import ensure_vessel

_DEFAULT_CHARGE_RATE = 100.0  # kg/min


def _project_equipment_ids(project: dict) -> set[str]:
    ids: set[str] = set()
    for facility in project.get("facilities", []):
        for unit in facility.get("equipmentUnits", []):
            if unit.get("id"):
                ids.add(unit["id"])
    return ids


def compute_charge_time(op: dict, ctx: SimulationContext) -> float:
    """Total charged kg ÷ charge rate (op rate, else project default, else 100 kg/min)."""
    total_kg = 0.0
    for mat in op.get("materials", []):
        material = ctx.materials_db.get(mat["materialId"], {})
        total_kg += convert_to_kg(mat["amount"], mat["amountUnit"], material)
    rate = op.get("chargeRateKgPerMin") or ctx.project.get(
        "defaultChargeRateKgPerMin", _DEFAULT_CHARGE_RATE
    )
    return total_kg / rate if rate else 0.0


@register("Charge")
class ChargeSolver(OperationSolver):
    def validate(self, op: dict, ctx: SimulationContext) -> list[str]:
        errors: list[str] = []
        equip_id = op.get("equipmentId")
        if not equip_id:
            errors.append("Charge: equipmentId is required")
        else:
            known = _project_equipment_ids(ctx.project)
            if known and equip_id not in known:
                errors.append(f"Charge: unknown equipment {equip_id}")
        for mat in op.get("materials", []):
            mat_id = mat.get("materialId")
            if mat_id not in ctx.materials_db:
                errors.append(f"Charge: unknown material {mat_id}")
            if mat.get("amount", 0) < 0:
                errors.append(f"Charge: negative amount for {mat_id}")
        return errors

    def solve(self, op: dict, ctx: SimulationContext) -> OperationResult:
        equip_id = op["equipmentId"]
        ensure_vessel(ctx, equip_id)
        for mat in op["materials"]:
            mat_id = mat["materialId"]
            material = ctx.materials_db[mat_id]
            mass_kg = convert_to_kg(mat["amount"], mat["amountUnit"], material)
            ctx.vessels[equip_id].add_component(
                mat_id, mass_kg, material.get("defaultPhase", "Liquid")
            )
        duration = op.get("chargeTimeMin") or compute_charge_time(op, ctx)
        return OperationResult(
            operation_id=op["id"], duration_min=duration, equipment_ids=[equip_id]
        )
