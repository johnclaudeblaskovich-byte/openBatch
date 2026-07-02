"""Decant solver — simple settled-layer split (no partition modeling)."""

from __future__ import annotations

from ..base import OperationResult, OperationSolver
from ..registry import register
from ..state import SimulationContext
from ..util import ensure_vessel
from .extract import route_layers


@register("Decant")
class DecantSolver(OperationSolver):
    def validate(self, op: dict, ctx: SimulationContext) -> list[str]:
        errors: list[str] = []
        if not op.get("equipmentId"):
            errors.append("Decant: equipmentId is required")
        return errors

    def solve(self, op: dict, ctx: SimulationContext) -> OperationResult:
        equip_id = op["equipmentId"]
        vessel = ensure_vessel(ctx, equip_id)
        top_id = op.get("topLayerEquipmentId")
        top_vessel = ensure_vessel(ctx, top_id) if top_id else None

        # Unlisted components default to remaining in place (bottom).
        route_layers(vessel, top_vessel, op.get("separations", []), "Bottom")

        equipment_ids = [equip_id]
        if top_id:
            equipment_ids.append(top_id)
        return OperationResult(
            operation_id=op["id"],
            duration_min=op.get("decantTimeMin", 0.0),
            equipment_ids=equipment_ids,
        )
