"""Mix and Age — pure timing operations that occupy equipment without changing composition."""

from __future__ import annotations

from ..base import OperationResult, OperationSolver
from ..registry import register
from ..state import SimulationContext
from ..util import ensure_vessel


@register("Mix")
class MixSolver(OperationSolver):
    def validate(self, op: dict, ctx: SimulationContext) -> list[str]:
        errors: list[str] = []
        if not op.get("equipmentId"):
            errors.append("Mix: equipmentId is required")
        if op.get("mixingTimeMin", 0) < 0:
            errors.append("Mix: mixingTimeMin must be >= 0")
        return errors

    def solve(self, op: dict, ctx: SimulationContext) -> OperationResult:
        equip_id = op["equipmentId"]
        ensure_vessel(ctx, equip_id)  # composition unchanged
        return OperationResult(
            operation_id=op["id"],
            duration_min=op.get("mixingTimeMin", 0.0),
            equipment_ids=[equip_id],
        )


@register("Age")
class AgeSolver(OperationSolver):
    def validate(self, op: dict, ctx: SimulationContext) -> list[str]:
        errors: list[str] = []
        if not op.get("equipmentId"):
            errors.append("Age: equipmentId is required")
        if op.get("agingTimeMin", 0) < 0:
            errors.append("Age: agingTimeMin must be >= 0")
        return errors

    def solve(self, op: dict, ctx: SimulationContext) -> OperationResult:
        equip_id = op["equipmentId"]
        ensure_vessel(ctx, equip_id)  # composition unchanged (vented vapor is a no-op for MVP)
        equipment_ids = [equip_id]
        condenser = op.get("condenserEquipmentId")
        if condenser:
            equipment_ids.append(condenser)
        return OperationResult(
            operation_id=op["id"],
            duration_min=op.get("agingTimeMin", 0.0),
            equipment_ids=equipment_ids,
        )
