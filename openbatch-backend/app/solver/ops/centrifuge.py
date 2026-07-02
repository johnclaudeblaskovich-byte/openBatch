"""Centrifuge solver — solid/liquid separation by spinning; cake stays in the centrifuge vessel."""

from __future__ import annotations

from ..base import OperationResult, OperationSolver
from ..registry import register
from ..state import PhaseType, SimulationContext, VesselContents
from ..util import ensure_vessel

_EPS = 1e-9


@register("Centrifuge")
class CentrifugeSolver(OperationSolver):
    def validate(self, op: dict, ctx: SimulationContext) -> list[str]:
        errors: list[str] = []
        if not op.get("equipmentId") and not op.get("fromEquipmentId"):
            errors.append("Centrifuge: equipmentId is required")
        return errors

    def solve(self, op: dict, ctx: SimulationContext) -> OperationResult:
        equip_id = op.get("equipmentId") or op["fromEquipmentId"]
        vessel = ensure_vessel(ctx, equip_id)
        ml_id = op.get("motherLiquorEquipmentId")
        mother_liquor = ensure_vessel(ctx, ml_id) if ml_id else VesselContents("__ml__")

        transfer_pct = op.get("transferPct", 100) / 100.0
        solids_retained = op.get("filterSolidsPct", 100) / 100.0
        cake_moisture = op.get("cakeMoisturePct", 0) / 100.0

        snapshot = [(key, c.material_id, c.mass_kg, c.phase) for key, c in vessel.components.items()]
        solids_present = any(ph is PhaseType.SOLID for _, _, _, ph in snapshot)

        for key, mat_id, mass, phase in snapshot:
            processed = mass * transfer_pct
            if processed <= 0:
                continue
            if phase is PhaseType.SOLID:
                to_ml = processed * (1.0 - solids_retained)
            elif solids_present:
                to_ml = processed * (1.0 - cake_moisture)
            else:
                to_ml = processed
            if to_ml <= 0:
                continue
            comp = vessel.components[key]
            comp.mass_kg -= to_ml
            if comp.mass_kg < _EPS:
                del vessel.components[key]
            mother_liquor.add_component(mat_id, to_ml, phase)

        equipment_ids = [equip_id]
        if ml_id:
            equipment_ids.append(ml_id)
        return OperationResult(
            operation_id=op["id"],
            duration_min=op.get("centrifugeTimeMin", 0.0),
            equipment_ids=equipment_ids,
        )
