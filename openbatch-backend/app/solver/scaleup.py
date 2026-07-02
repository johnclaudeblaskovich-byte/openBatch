"""Scale-Up engine — computes a scale factor for a Step under one of five modes and proportionally
scales all charge/transfer amounts. Pure backend math.
"""

from __future__ import annotations

import copy
from enum import Enum

from .state import SimulationContext
from .util import compute_batch_volume, compute_current_output, get_equipment


class ScaleUpMode(str, Enum):
    MAX_BATCH_CURRENT_EQUIPMENT = "MaxBatchCurrentEquipment"
    MAX_BATCH_SPECIFIC_EQUIPMENT = "MaxBatchSpecificEquipment"
    TARGET_BATCH_SIZE = "TargetBatchSize"
    MULTIPLE_OF_CURRENT = "MultipleOfCurrent"
    RETURN_TO_ORIGINAL = "ReturnToOriginal"


def _headroom(up: dict, ctx: SimulationContext) -> float:
    equip = get_equipment(up["primaryEquipmentId"], ctx)
    if equip is None:
        return float("inf")
    batch_volume = compute_batch_volume(up, ctx)
    working_vol = equip.get("totalVolume", 0.0) * equip.get("workingVolumeFraction", 0.8)
    return working_vol / batch_volume if batch_volume > 0 else float("inf")


def compute_scale_factor(
    mode: ScaleUpMode | str,
    params: dict,
    step: dict,
    ctx: SimulationContext,
) -> float:
    mode = ScaleUpMode(mode)
    if mode == ScaleUpMode.MAX_BATCH_CURRENT_EQUIPMENT:
        # Smallest working-volume headroom across all UPs limits the batch.
        min_headroom = float("inf")
        for up in step["unitProcedures"]:
            min_headroom = min(min_headroom, _headroom(up, ctx))
        return min_headroom if min_headroom != float("inf") else 1.0

    if mode == ScaleUpMode.MAX_BATCH_SPECIFIC_EQUIPMENT:
        # Headroom of the named equipment only.
        equip_id = params["equipmentId"]
        min_headroom = float("inf")
        for up in step["unitProcedures"]:
            if up.get("primaryEquipmentId") == equip_id:
                min_headroom = min(min_headroom, _headroom(up, ctx))
        return min_headroom if min_headroom != float("inf") else 1.0

    if mode == ScaleUpMode.TARGET_BATCH_SIZE:
        current_output = compute_current_output(step, ctx)
        return params["targetMassKg"] / current_output if current_output > 0 else 1.0

    if mode == ScaleUpMode.MULTIPLE_OF_CURRENT:
        return params["multiplier"]

    if mode == ScaleUpMode.RETURN_TO_ORIGINAL:
        return 1.0 / params.get("currentScaleFactor", 1.0)

    return 1.0


def apply_scale_factor(factor: float, step: dict) -> dict:
    """Scale all Charge material amounts and Transfer/PressureTransfer transferAmount by factor.

    Deep-copies the step; the input is never mutated.
    """
    scaled = copy.deepcopy(step)
    for up in scaled.get("unitProcedures", []):
        for op in up.get("operations", []):
            if op.get("type") == "Charge":
                for mat in op.get("materials", []):
                    mat["amount"] *= factor
            elif op.get("type") in ("Transfer", "PressureTransfer"):
                if "transferAmount" in op and op["transferAmount"] is not None:
                    op["transferAmount"] *= factor
    return scaled
