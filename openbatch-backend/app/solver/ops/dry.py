"""Dry solver — removes residual liquid from a solid down to a target moisture by evaporation."""

from __future__ import annotations

from ..base import OperationResult, OperationSolver
from ..registry import register
from ..state import PhaseType, SimulationContext
from ..util import ensure_vessel

_EPS = 1e-9


@register("Dry")
class DrySolver(OperationSolver):
    def validate(self, op: dict, ctx: SimulationContext) -> list[str]:
        errors: list[str] = []
        if not op.get("equipmentId"):
            errors.append("Dry: equipmentId is required")
        return errors

    def solve(self, op: dict, ctx: SimulationContext) -> OperationResult:
        equip_id = op["equipmentId"]
        vessel = ensure_vessel(ctx, equip_id)

        solid_mass = sum(c.mass_kg for c in vessel.components.values() if c.phase is PhaseType.SOLID)
        liquids = [
            (key, c.material_id, c.mass_kg, c.phase)
            for key, c in vessel.components.items()
            if c.phase is PhaseType.LIQUID
        ]
        current_liquid = sum(m for _, _, m, _ in liquids)
        target_residual = op.get("finalMoisturePct", 0) / 100.0 * solid_mass
        to_remove = max(0.0, current_liquid - target_residual)

        sink_id = op.get("evaporatedSolventEquipmentId") or op.get("condenserEquipmentId")
        sink = ensure_vessel(ctx, sink_id) if sink_id else None
        streams: list[dict] = []

        if current_liquid > 0 and to_remove > 0:
            for key, mat_id, mass, phase in liquids:
                removal = mass / current_liquid * to_remove
                comp = vessel.components[key]
                comp.mass_kg -= removal
                if comp.mass_kg < _EPS:
                    del vessel.components[key]
                if sink is not None:
                    sink.add_component(mat_id, removal, phase)
                else:
                    streams.append({"type": "evaporated", "materialId": mat_id, "massKg": removal})

        if op.get("dryingTemperatureC") is not None:
            vessel.temperature_c = op["dryingTemperatureC"]
        if op.get("dryingPressureKPa") is not None:
            vessel.pressure_kpa = op["dryingPressureKPa"]

        if op.get("dryingTimeMin") is not None:
            duration = op["dryingTimeMin"]
        elif op.get("dryingRateKgPerMin"):
            duration = to_remove / op["dryingRateKgPerMin"]
        else:
            duration = 0.0

        equipment_ids = [equip_id]
        if sink_id:
            equipment_ids.append(sink_id)
        return OperationResult(
            operation_id=op["id"],
            duration_min=duration,
            equipment_ids=equipment_ids,
            output_streams=streams,
        )
