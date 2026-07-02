"""Filter-dryer solver — filtration, up to three washes, and drying in a single vessel."""

from __future__ import annotations

from ..base import OperationResult, OperationSolver
from ..convert import convert_to_kg
from ..registry import register
from ..state import PhaseType, SimulationContext, VesselContents
from ..util import ensure_vessel
from .filter import solid_liquid_separate
from .wash_cake import _displace_liquids

_EPS = 1e-9


@register("FilterDry")
class FilterDrySolver(OperationSolver):
    def validate(self, op: dict, ctx: SimulationContext) -> list[str]:
        errors: list[str] = []
        if not op.get("filterDryerEquipmentId"):
            errors.append("FilterDry: filterDryerEquipmentId is required")
        return errors

    def solve(self, op: dict, ctx: SimulationContext) -> OperationResult:
        fd_id = op["filterDryerEquipmentId"]
        fd = ensure_vessel(ctx, fd_id)
        source_id = op.get("fromEquipmentId")
        ml_id = op.get("motherLiquorEquipmentId")
        spent_id = op.get("spentWashEquipmentId")
        condenser_id = op.get("condenserEquipmentId") or op.get("evaporatedSolventEquipmentId")

        equipment_ids = [fd_id]
        for eid in (source_id, ml_id, spent_id, condenser_id):
            if eid and eid not in equipment_ids:
                equipment_ids.append(eid)

        # (1) Filtration: slurry from source -> cake in the filter-dryer, mother liquor out.
        if source_id:
            source = ensure_vessel(ctx, source_id)
            mother_liquor = ensure_vessel(ctx, ml_id) if ml_id else VesselContents("__ml__")
            solid_liquid_separate(
                source,
                fd,
                mother_liquor,
                transfer_pct=op.get("transferPct", 100) / 100.0,
                solids_retained=op.get("filterSolidsPct", 100) / 100.0,
                cake_moisture=op.get("cakeMoisturePctAfterFiltration", 0) / 100.0,
            )

        # (2) Washes (<= 3).
        spent = ensure_vessel(ctx, spent_id) if spent_id else VesselContents("__spent__")
        wash_time_total = 0.0
        for wash in (op.get("washes") or [])[:3]:
            solvent_id = wash["solventMaterialId"]
            solvent_mat = ctx.materials_db.get(solvent_id, {})
            per_wash = convert_to_kg(
                wash.get("amountPerWash", 0), wash.get("amountUnit", "kg"), solvent_mat
            )
            n = int(wash.get("numberOfWashes", 1))
            wash_type = wash.get("washType", "Displacement")
            for _ in range(n):
                fd.add_component(solvent_id, per_wash, PhaseType.LIQUID)
                if wash_type == "Slurry":
                    _displace_liquids(fd, spent, per_wash)
                else:
                    _displace_liquids(fd, spent, per_wash, exclude_material=solvent_id)
            wash_time_total += wash.get("washTimeMin", 0) * n

        # (3) Drying to final moisture.
        solid_mass = sum(c.mass_kg for c in fd.components.values() if c.phase is PhaseType.SOLID)
        liquids = [
            (key, c.material_id, c.mass_kg, c.phase)
            for key, c in fd.components.items()
            if c.phase is PhaseType.LIQUID
        ]
        current_liquid = sum(m for _, _, m, _ in liquids)
        target_residual = op.get("finalMoisturePct", 0) / 100.0 * solid_mass
        to_remove = max(0.0, current_liquid - target_residual)
        condenser = ensure_vessel(ctx, condenser_id) if condenser_id else None
        streams: list[dict] = []
        if current_liquid > 0 and to_remove > 0:
            for key, mat_id, mass, phase in liquids:
                removal = mass / current_liquid * to_remove
                comp = fd.components[key]
                comp.mass_kg -= removal
                if comp.mass_kg < _EPS:
                    del fd.components[key]
                if condenser is not None:
                    condenser.add_component(mat_id, removal, phase)
                else:
                    streams.append({"type": "evaporated", "materialId": mat_id, "massKg": removal})

        if op.get("dryingTemperatureC") is not None:
            fd.temperature_c = op["dryingTemperatureC"]
        if op.get("dryingPressureKPa") is not None:
            fd.pressure_kpa = op["dryingPressureKPa"]

        duration = (
            op.get("filtrationTimeMin", 30)
            + op.get("slurryTransferTimeMin", 0)
            + wash_time_total
            + op.get("dryingTimeMin", 0)
        )
        return OperationResult(
            operation_id=op["id"],
            duration_min=duration,
            equipment_ids=equipment_ids,
            output_streams=streams,
        )
