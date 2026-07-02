"""Extract solver — liquid-liquid partition of components between a top and bottom layer."""

from __future__ import annotations

from ..base import OperationResult, OperationSolver
from ..registry import register
from ..state import SimulationContext, VesselContents
from ..util import ensure_vessel

_EPS = 1e-9


def route_layers(
    vessel: VesselContents,
    top_vessel: VesselContents | None,
    separations: list[dict],
    unspecified_goes_to: str,
) -> None:
    """Route each component's top-layer fraction to ``top_vessel`` (bottom stays in ``vessel``).

    Listed components use their ``goesTo``/``pct``; unlisted follow ``unspecified_goes_to``. With
    no top vessel, layers are conceptual and nothing physically moves.
    """
    by_material = {s["materialId"]: s for s in separations}
    for key, comp in list(vessel.components.items()):
        spec = by_material.get(comp.material_id)
        if spec is not None:
            frac = spec["pct"] / 100.0
            top_frac = frac if spec["goesTo"] == "Top" else 1.0 - frac
        else:
            top_frac = 1.0 if unspecified_goes_to == "Top" else 0.0
        top_mass = comp.mass_kg * top_frac
        if top_mass <= 0 or top_vessel is None:
            continue
        mat_id, phase = comp.material_id, comp.phase
        comp.mass_kg -= top_mass
        if comp.mass_kg < _EPS:
            del vessel.components[key]
        top_vessel.add_component(mat_id, top_mass, phase)


@register("Extract")
class ExtractSolver(OperationSolver):
    def validate(self, op: dict, ctx: SimulationContext) -> list[str]:
        errors: list[str] = []
        if not op.get("equipmentId"):
            errors.append("Extract: equipmentId is required")
        return errors

    def solve(self, op: dict, ctx: SimulationContext) -> OperationResult:
        equip_id = op["equipmentId"]
        vessel = ensure_vessel(ctx, equip_id)
        top_id = op.get("topLayerEquipmentId")
        top_vessel = ensure_vessel(ctx, top_id) if top_id else None

        route_layers(
            vessel,
            top_vessel,
            op.get("separations", []),
            op.get("unspecifiedGoesTo", "Bottom"),
        )

        equipment_ids = [equip_id]
        if top_id:
            equipment_ids.append(top_id)
        if op.get("condenserEquipmentId"):
            equipment_ids.append(op["condenserEquipmentId"])
        return OperationResult(
            operation_id=op["id"],
            duration_min=op.get("extractionTimeMin", 0.0),
            equipment_ids=equipment_ids,
        )
