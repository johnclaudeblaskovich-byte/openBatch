"""Filter solver — shortcut solid/liquid separation into a cake and a mother-liquor stream."""

from __future__ import annotations

from ..base import OperationResult, OperationSolver
from ..registry import register
from ..state import PhaseType, SimulationContext, VesselContents
from ..util import ensure_vessel

_EPS = 1e-9


def solid_liquid_separate(
    source: VesselContents,
    cake: VesselContents,
    mother_liquor: VesselContents,
    *,
    transfer_pct: float,
    solids_retained: float,
    cake_moisture: float,
) -> None:
    """Split ``transfer_pct`` of the source: solids retained in the cake (rest to mother liquor),
    liquids held at ``cake_moisture`` fraction in the cake when solids are present (rest to mother
    liquor). Iterates by dict key so phase-suffixed solid entries are handled correctly.
    """
    snapshot = [(key, c.material_id, c.mass_kg, c.phase) for key, c in source.components.items()]
    processed_solid_total = sum(
        mass * transfer_pct for _, _, mass, ph in snapshot if ph is PhaseType.SOLID
    )

    for key, mat_id, mass, phase in snapshot:
        processed = mass * transfer_pct
        if processed <= 0:
            continue
        comp = source.components[key]
        comp.mass_kg -= processed
        if comp.mass_kg < _EPS:
            del source.components[key]

        if phase is PhaseType.SOLID:
            cake.add_component(mat_id, processed * solids_retained, PhaseType.SOLID)
            to_ml = processed * (1.0 - solids_retained)
            if to_ml > 0:
                mother_liquor.add_component(mat_id, to_ml, phase)
        elif processed_solid_total > 0:
            cake.add_component(mat_id, processed * cake_moisture, phase)
            mother_liquor.add_component(mat_id, processed * (1.0 - cake_moisture), phase)
        else:
            mother_liquor.add_component(mat_id, processed, phase)


@register("Filter")
class FilterSolver(OperationSolver):
    def validate(self, op: dict, ctx: SimulationContext) -> list[str]:
        errors: list[str] = []
        src = op.get("fromEquipmentId") or op.get("equipmentId")
        if not src:
            errors.append("Filter: a source equipment (fromEquipmentId) is required")
        return errors

    def solve(self, op: dict, ctx: SimulationContext) -> OperationResult:
        source_id = op.get("fromEquipmentId") or op["equipmentId"]
        cake_id = op.get("filterEquipmentId") or op.get("equipmentId") or source_id
        ml_id = op.get("motherLiquorEquipmentId")

        source = ensure_vessel(ctx, source_id)
        cake = ensure_vessel(ctx, cake_id)
        mother_liquor = ensure_vessel(ctx, ml_id) if ml_id else VesselContents("__ml__")

        solid_liquid_separate(
            source,
            cake,
            mother_liquor,
            transfer_pct=op.get("transferPct", 100) / 100.0,
            solids_retained=op.get("filterSolidsPct", 100) / 100.0,
            cake_moisture=op.get("cakeMoisturePct", 0) / 100.0,
        )

        # Dedupe (preserve order): in-place filtration can make cake_id == source_id.
        equipment_ids: list[str] = []
        for eid in (source_id, cake_id, ml_id):
            if eid and eid not in equipment_ids:
                equipment_ids.append(eid)
        duration = op.get("filtrationTimeMin", 30) + op.get("slurryTransferTimeMin", 0)
        return OperationResult(
            operation_id=op["id"], duration_min=duration, equipment_ids=equipment_ids
        )
