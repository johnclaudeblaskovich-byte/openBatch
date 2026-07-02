"""Transfer solver — moves a fraction (or fixed amount) of one vessel's contents to another,
optionally retaining solids in an inline filter. Mass is conserved exactly.
"""

from __future__ import annotations

from ..base import OperationResult, OperationSolver
from ..convert import convert_to_kg
from ..registry import register
from ..state import PhaseType, SimulationContext
from ..util import ensure_vessel


def compute_transfer_fraction(op: dict, source_total: float) -> float:
    """Resolve the fraction (0..1) of the source vessel to move."""
    if source_total <= 0:
        return 0.0
    if op.get("transferAmount") is not None:
        target = convert_to_kg(op["transferAmount"], op.get("transferAmountUnit", "kg"), {})
        return min(target / source_total, 1.0)
    pct = op.get("transferPct", 100.0)
    return max(0.0, min(pct / 100.0, 1.0))


def execute_transfer(op: dict, ctx: SimulationContext, from_id: str, to_id: str) -> tuple[float, list[str]]:
    """Core mass movement shared by Transfer and PressureTransfer. Returns (moved_kg, equipment_ids)."""
    source = ensure_vessel(ctx, from_id)
    dest = ensure_vessel(ctx, to_id)

    filter_id = op.get("inlineFilterEquipmentId")
    filter_solids_pct = op.get("filterSolidsPct")
    filter_vessel = ensure_vessel(ctx, filter_id) if filter_id else None

    fraction = compute_transfer_fraction(op, source.total_mass_kg)

    # Snapshot before mutating, since remove_component may delete keys.
    snapshot = [(c.material_id, c.mass_kg, c.phase) for c in source.components.values()]
    total_moved = 0.0
    for mat_id, mass_kg, phase in snapshot:
        move = mass_kg * fraction
        if move <= 0:
            continue
        source.remove_component(mat_id, move)
        total_moved += move
        if filter_vessel is not None and phase is PhaseType.SOLID and filter_solids_pct:
            retained = move * filter_solids_pct / 100.0
            filter_vessel.add_component(mat_id, retained, phase)
            passed = move - retained
            if passed > 0:
                dest.add_component(mat_id, passed, phase)
        else:
            dest.add_component(mat_id, move, phase)

    equipment_ids = [from_id, to_id]
    if filter_id:
        equipment_ids.append(filter_id)
    return total_moved, equipment_ids


def transfer_duration(op: dict, total_moved: float) -> float:
    if op.get("transferTimeMin") is not None:
        return op["transferTimeMin"]
    rate = op.get("transferRateKgPerMin")
    return total_moved / rate if rate else 0.0


@register("Transfer")
class TransferSolver(OperationSolver):
    def validate(self, op: dict, ctx: SimulationContext) -> list[str]:
        errors: list[str] = []
        if not op.get("fromEquipmentId"):
            errors.append("Transfer: fromEquipmentId is required")
        if not op.get("toEquipmentId"):
            errors.append("Transfer: toEquipmentId is required")
        return errors

    def solve(self, op: dict, ctx: SimulationContext) -> OperationResult:
        moved, equipment_ids = execute_transfer(
            op, ctx, op["fromEquipmentId"], op["toEquipmentId"]
        )
        return OperationResult(
            operation_id=op["id"],
            duration_min=transfer_duration(op, moved),
            equipment_ids=equipment_ids,
        )
