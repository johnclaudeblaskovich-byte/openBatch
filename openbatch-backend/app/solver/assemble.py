"""Assemble raw solver outputs + schedule events into a StepSimulationResult-shaped dict."""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone

from .base import OperationResult
from .convert import convert_to_kg
from .engine import flatten_operations
from .scheduler import ScheduleEvent, batch_time
from .state import SimulationContext

_BALANCE_TOL_PCT = 0.1


def _compute_inputs(step: dict, ctx: SimulationContext) -> dict[str, float]:
    """Total inventory mass entering the system per material (charges, inventory feeds, washes)."""
    inputs: dict[str, float] = defaultdict(float)

    for op in flatten_operations(step):
        if op["type"] == "Charge":
            for mat in op.get("materials", []):
                material = ctx.materials_db.get(mat["materialId"], {})
                inputs[mat["materialId"]] += convert_to_kg(mat["amount"], mat["amountUnit"], material)
        for feed in op.get("continuousFeeds") or op.get("feeds") or []:
            if feed.get("source", "Inventory") == "Inventory" and feed.get("materialId"):
                material = ctx.materials_db.get(feed["materialId"], {})
                inputs[feed["materialId"]] += convert_to_kg(
                    feed.get("amount", 0), feed.get("amountUnit", "kg"), material
                )
        if op["type"] == "WashCake":
            mat_id = op.get("solventMaterialId") or op.get("washMaterialId")
            if mat_id:
                material = ctx.materials_db.get(mat_id, {})
                amount = op.get("amountPerWash", op.get("washAmount", 0))
                unit = op.get("amountUnit", op.get("washAmountUnit", "kg"))
                inputs[mat_id] += convert_to_kg(amount, unit, material) * int(
                    op.get("numberOfWashes", 1)
                )
        if op["type"] == "FilterDry":
            for wash in op.get("washes", []):
                mat_id = wash.get("solventMaterialId") or wash.get("washMaterialId")
                if not mat_id:
                    continue
                material = ctx.materials_db.get(mat_id, {})
                amount = wash.get("amountPerWash", wash.get("washAmount", 0))
                unit = wash.get("amountUnit", wash.get("washAmountUnit", "kg"))
                inputs[mat_id] += convert_to_kg(amount, unit, material) * int(
                    wash.get("numberOfWashes", 1)
                )
    return {k: v for k, v in inputs.items() if k}


def _compute_outputs(ctx: SimulationContext) -> dict[str, float]:
    """Final vessel contents + material removed via vent/evaporated streams, per material."""
    outputs: dict[str, float] = defaultdict(float)
    for vessel in ctx.vessels.values():
        for comp in vessel.components.values():
            outputs[comp.material_id] += comp.mass_kg
    for s in ctx.streams:
        if s.get("type") in ("vent", "evaporated"):
            outputs[s["materialId"]] += s.get("massKg", 0.0)
    return dict(outputs)


def _format_streams(streams: list[dict]) -> list[dict]:
    """Attach a per-component mass fraction to each stream."""
    out = []
    for s in streams:
        total = s.get("totalMassKg", 0.0)
        comps = [
            {
                "materialId": c["materialId"],
                "massKg": c["massKg"],
                "massFraction": (c["massKg"] / total if total else 0.0),
            }
            for c in s.get("components", [])
        ]
        out.append({**s, "components": comps})
    return out


def _final_contents(equipment_contents: list[dict]) -> list[dict]:
    """Last snapshot per equipment id."""
    by_equip: dict[str, dict] = {}
    for snap in equipment_contents:
        by_equip[snap["equipmentId"]] = snap
    return list(by_equip.values())


def assemble_result(
    ctx: SimulationContext,
    op_results: dict[str, OperationResult],
    step: dict,
    events: list[ScheduleEvent],
    *,
    equipment_contents: list[dict],
    streams: list[dict],
    material_balance: list[dict],
    op_meta: dict[str, dict],
) -> dict:
    events_by_id = {e.operation_id: e for e in events}
    warnings: list[str] = []

    operation_results = []
    for op_id, r in op_results.items():
        ev = events_by_id.get(op_id)
        meta = op_meta.get(op_id, {})
        operation_results.append(
            {
                "operationId": op_id,
                "operationName": meta.get("name", op_id),
                "unitProcedureId": meta.get("unitProcedureId"),
                "durationMin": r.duration_min,
                "scheduledStartMin": ev.start_min if ev else None,
                "scheduledEndMin": ev.end_min if ev else None,
                "equipmentIds": r.equipment_ids,
                "warnings": r.warnings,
            }
        )
        warnings.extend(r.warnings)

    # Overall mass-balance reconciliation (Implicit Rule #1).
    inputs = _compute_inputs(step, ctx)
    outputs = _compute_outputs(ctx)
    total_in = sum(inputs.values())
    total_out = sum(outputs.values())
    total_pct = ((total_out - total_in) / total_in * 100.0) if total_in else 0.0
    if abs(total_pct) > _BALANCE_TOL_PCT:
        warnings.append(
            f"Mass balance discrepancy: in {total_in:.4f} kg vs out {total_out:.4f} kg "
            f"({total_pct:+.3f}%)"
        )

    bt = batch_time(events)
    return {
        "stepId": step.get("id", ""),
        "operationResults": operation_results,
        "streams": _format_streams(streams),
        "equipmentContents": equipment_contents,
        "finalEquipmentContents": _final_contents(equipment_contents),
        "materialBalance": material_balance,
        "totalInputKg": total_in,
        "totalOutputKg": total_out,
        "batchTimeMin": bt,
        "cycleTimeMin": bt,
        "totalCycleTimeMin": bt,
        "warnings": warnings,
        "solvedAt": datetime.now(timezone.utc).isoformat(),
    }
