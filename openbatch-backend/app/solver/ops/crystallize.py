"""Crystallize solver — moves a separation percentage of named components into a solid phase.

A material can be partly dissolved and partly crystalline at once, so the solid portion is stored
under a phase-suffixed key (``"<mat>::solid"``) while keeping ``ComponentMass.material_id`` intact
for balance/reporting. The dissolved remainder stays under the plain material id.
"""

from __future__ import annotations

from ..base import OperationResult, OperationSolver
from ..registry import register
from ..state import ComponentMass, PhaseType, SimulationContext


def _solid_key(mat_id: str) -> str:
    return f"{mat_id}::solid"


@register("Crystallize")
class CrystallizeSolver(OperationSolver):
    def validate(self, op: dict, ctx: SimulationContext) -> list[str]:
        errors: list[str] = []
        if not op.get("equipmentId"):
            errors.append("Crystallize: equipmentId is required")
        return errors

    def solve(self, op: dict, ctx: SimulationContext) -> OperationResult:
        equip_id = op["equipmentId"]
        vessel = ctx.vessels[equip_id]
        warnings: list[str] = []

        separations = op.get("separations") or op.get("crystalSeparations") or []
        for sep in separations:
            mat_id = sep["materialId"]
            pct = sep.get("separationPct", 0) / 100.0
            comp = vessel.components.get(mat_id)
            if comp is None:
                warnings.append(f"component not present: {mat_id}")
                continue
            solid_mass = comp.mass_kg * pct
            removed = vessel.remove_component(mat_id, solid_mass)
            existing = vessel.components.get(_solid_key(mat_id))
            if existing is not None:
                existing.mass_kg += removed
            else:
                vessel.components[_solid_key(mat_id)] = ComponentMass(
                    mat_id, removed, PhaseType.SOLID
                )

        if op.get("targetTemperatureC") is not None:
            vessel.temperature_c = op["targetTemperatureC"]

        equipment_ids = [equip_id]
        if op.get("condenserEquipmentId"):
            equipment_ids.append(op["condenserEquipmentId"])

        return OperationResult(
            operation_id=op["id"],
            duration_min=op.get("crystallizationTimeMin", 0.0),
            equipment_ids=equipment_ids,
            warnings=warnings,
        )
