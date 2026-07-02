"""Concentrate solver — removes a fraction of the liquid phase (e.g. by evaporation)."""

from __future__ import annotations

from ..base import OperationResult, OperationSolver
from ..registry import register
from ..state import PhaseType, SimulationContext
from ..util import ensure_vessel


@register("Concentrate")
class ConcentrateSolver(OperationSolver):
    def validate(self, op: dict, ctx: SimulationContext) -> list[str]:
        errors: list[str] = []
        if not op.get("equipmentId"):
            errors.append("Concentrate: equipmentId is required")
        return errors

    def solve(self, op: dict, ctx: SimulationContext) -> OperationResult:
        equip_id = op["equipmentId"]
        vessel = ctx.vessels[equip_id]
        fraction = op.get("removalPct", 0) / 100.0

        condenser_id = op.get("condenserEquipmentId")
        condenser = ensure_vessel(ctx, condenser_id) if condenser_id else None
        streams: list[dict] = []

        snapshot = [
            (c.material_id, c.mass_kg, c.phase)
            for c in vessel.components.values()
            if c.phase is PhaseType.LIQUID
        ]
        for mat_id, mass_kg, phase in snapshot:
            removed = mass_kg * fraction
            if removed <= 0:
                continue
            vessel.remove_component(mat_id, removed)
            if condenser is not None:
                condenser.add_component(mat_id, removed, phase)
            else:
                streams.append({"type": "vent", "materialId": mat_id, "massKg": removed})

        equipment_ids = [equip_id]
        if condenser_id:
            equipment_ids.append(condenser_id)
        return OperationResult(
            operation_id=op["id"],
            duration_min=op.get("operationTimeMin", 0.0),
            equipment_ids=equipment_ids,
            output_streams=streams,
        )
