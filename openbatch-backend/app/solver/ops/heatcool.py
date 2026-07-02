"""Heat and Cool — shortcut heat-transfer solvers (temperature + timing only, no energy balance)."""

from __future__ import annotations

from ..base import OperationResult, OperationSolver
from ..registry import register
from ..state import SimulationContext
from ..util import ensure_vessel


def _validate(op: dict, name: str) -> list[str]:
    errors: list[str] = []
    if not op.get("equipmentId"):
        errors.append(f"{name}: equipmentId is required")
    if op.get("targetTemperatureC") is None:
        errors.append(f"{name}: targetTemperatureC is required")
    return errors


@register("Heat")
class HeatSolver(OperationSolver):
    def validate(self, op: dict, ctx: SimulationContext) -> list[str]:
        errors = _validate(op, "Heat")
        if op.get("heatingTimeMin") is None and op.get("heatingRateC_PerMin") is None:
            errors.append("Heat: a heatingTimeMin or heatingRateC_PerMin is required")
        return errors

    def solve(self, op: dict, ctx: SimulationContext) -> OperationResult:
        equip_id = op["equipmentId"]
        vessel = ensure_vessel(ctx, equip_id)
        target = op["targetTemperatureC"]
        start = vessel.temperature_c
        if op.get("heatingTimeMin") is not None:
            duration = op["heatingTimeMin"]
        else:
            rate = op["heatingRateC_PerMin"]
            duration = abs(target - start) / rate if rate else 0.0
        vessel.temperature_c = target
        equipment_ids = [equip_id]
        if op.get("utilityId"):
            equipment_ids.append(op["utilityId"])
        return OperationResult(
            operation_id=op["id"], duration_min=duration, equipment_ids=equipment_ids
        )


@register("Cool")
class CoolSolver(OperationSolver):
    def validate(self, op: dict, ctx: SimulationContext) -> list[str]:
        errors = _validate(op, "Cool")
        if op.get("coolingTimeMin") is None and op.get("coolingRateC_PerMin") is None:
            errors.append("Cool: a coolingTimeMin or coolingRateC_PerMin is required")
        return errors

    def solve(self, op: dict, ctx: SimulationContext) -> OperationResult:
        equip_id = op["equipmentId"]
        vessel = ensure_vessel(ctx, equip_id)
        target = op["targetTemperatureC"]
        start = vessel.temperature_c
        if op.get("coolingTimeMin") is not None:
            duration = op["coolingTimeMin"]
        else:
            rate = op["coolingRateC_PerMin"]
            duration = abs(target - start) / rate if rate else 0.0
        vessel.temperature_c = target
        equipment_ids = [equip_id]
        if op.get("condenserEquipmentId"):
            equipment_ids.append(op["condenserEquipmentId"])
        if op.get("utilityId"):
            equipment_ids.append(op["utilityId"])
        return OperationResult(
            operation_id=op["id"], duration_min=duration, equipment_ids=equipment_ids
        )
