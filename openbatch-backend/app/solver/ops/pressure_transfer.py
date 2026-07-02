"""Pressure-transfer solver — a Transfer driven by a pressure differential, with before/after
pressure bookkeeping and an optional pressurization delay.
"""

from __future__ import annotations

from ..base import OperationResult, OperationSolver
from ..registry import register
from ..state import SimulationContext
from ..util import ensure_vessel
from .transfer import execute_transfer, transfer_duration


@register("PressureTransfer")
class PressureTransferSolver(OperationSolver):
    def validate(self, op: dict, ctx: SimulationContext) -> list[str]:
        errors: list[str] = []
        if not op.get("fromEquipmentId"):
            errors.append("PressureTransfer: fromEquipmentId is required")
        if not op.get("toEquipmentId"):
            errors.append("PressureTransfer: toEquipmentId is required")
        return errors

    def solve(self, op: dict, ctx: SimulationContext) -> OperationResult:
        from_id = op["fromEquipmentId"]
        to_id = op["toEquipmentId"]
        moved, equipment_ids = execute_transfer(op, ctx, from_id, to_id)

        # Pressure bookkeeping.
        if op.get("afterPressureSourceKPa") is not None:
            ensure_vessel(ctx, from_id).pressure_kpa = op["afterPressureSourceKPa"]
        if op.get("afterPressureDestKPa") is not None:
            ensure_vessel(ctx, to_id).pressure_kpa = op["afterPressureDestKPa"]

        # Vacuum unit, when present, occupies equipment for the duration.
        vacuum_id = op.get("vacuumUnitId")
        if vacuum_id and vacuum_id not in equipment_ids:
            equipment_ids.append(vacuum_id)

        duration = transfer_duration(op, moved) + op.get("beforeTransferTimeMin", 0.0)
        return OperationResult(
            operation_id=op["id"], duration_min=duration, equipment_ids=equipment_ids
        )
