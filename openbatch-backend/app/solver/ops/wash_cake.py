"""Wash-cake solver — displacement or slurry washing of a filter cake to a spent-wash vessel."""

from __future__ import annotations

from ..base import OperationResult, OperationSolver
from ..convert import convert_to_kg
from ..registry import register
from ..state import PhaseType, SimulationContext, VesselContents
from ..util import ensure_vessel

_EPS = 1e-9


def _displace_liquids(
    cake: VesselContents,
    spent: VesselContents,
    amount_kg: float,
    exclude_material: str | None = None,
) -> None:
    """Move up to ``amount_kg`` of liquid from the cake to spent wash, proportionally across the
    candidate liquid components (optionally excluding one material, e.g. the fresh solvent)."""
    candidates = [
        (key, c.material_id, c.mass_kg, c.phase)
        for key, c in cake.components.items()
        if c.phase is PhaseType.LIQUID and c.material_id != exclude_material
    ]
    total = sum(m for _, _, m, _ in candidates)
    if total <= 0:
        return
    to_remove = min(amount_kg, total)
    for key, mat_id, mass, phase in candidates:
        removal = mass / total * to_remove
        comp = cake.components[key]
        comp.mass_kg -= removal
        if comp.mass_kg < _EPS:
            del cake.components[key]
        spent.add_component(mat_id, removal, phase)


@register("WashCake")
class WashCakeSolver(OperationSolver):
    def validate(self, op: dict, ctx: SimulationContext) -> list[str]:
        errors: list[str] = []
        if not op.get("filterEquipmentId") and not op.get("equipmentId"):
            errors.append("WashCake: filterEquipmentId is required")
        if not (op.get("solventMaterialId") or op.get("washMaterialId")):
            errors.append("WashCake: solventMaterialId is required")
        return errors

    def solve(self, op: dict, ctx: SimulationContext) -> OperationResult:
        cake_id = op.get("filterEquipmentId") or op["equipmentId"]
        cake = ensure_vessel(ctx, cake_id)
        spent_id = op.get("spentWashEquipmentId")
        spent = ensure_vessel(ctx, spent_id) if spent_id else VesselContents("__spent__")

        # Tolerate both the solver field names and the frontend operation field names.
        solvent_id = op.get("solventMaterialId") or op.get("washMaterialId")
        if not solvent_id:
            return OperationResult(
                operation_id=op["id"],
                duration_min=op.get("washTimeMin", 0.0),
                equipment_ids=[cake_id],
            )
        solvent_mat = ctx.materials_db.get(solvent_id, {})
        amount = op.get("amountPerWash", op.get("washAmount", 0))
        amount_unit = op.get("amountUnit", op.get("washAmountUnit", "kg"))
        per_wash_kg = convert_to_kg(amount, amount_unit, solvent_mat)
        num_washes = int(op.get("numberOfWashes", 1))
        wash_type = op.get("washType", "Displacement")

        for _ in range(num_washes):
            cake.add_component(solvent_id, per_wash_kg, PhaseType.LIQUID)
            if wash_type == "Slurry":
                _displace_liquids(cake, spent, per_wash_kg)
            else:  # Displacement: push out retained (non-solvent) liquid
                _displace_liquids(cake, spent, per_wash_kg, exclude_material=solvent_id)

        if op.get("washTimeMin") is not None:
            duration = op["washTimeMin"] * num_washes
        elif op.get("washRateKgPerMin"):
            duration = (per_wash_kg / op["washRateKgPerMin"]) * num_washes
        else:
            duration = 0.0

        equipment_ids = [cake_id]
        if spent_id:
            equipment_ids.append(spent_id)
        return OperationResult(
            operation_id=op["id"], duration_min=duration, equipment_ids=equipment_ids
        )
