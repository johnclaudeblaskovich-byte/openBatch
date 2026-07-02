"""Step solve driver — builds the simulation context and executes a Step's operations in order.

Dispatches each operation to its registered solver, mutates vessel contents, and derives the report
data the frontend renders: per-operation equipment snapshots (with fill %), movement streams, and a
per-operation material balance.
"""

from __future__ import annotations

from collections.abc import Callable

from . import ops as _ops  # noqa: F401  (importing registers all solvers)
from .base import OperationResult
from .convert import convert_to_kg
from .registry import get_solver
from .state import SimulationContext

ProgressCallback = Callable[[int, int, str], None]
_EPS = 1e-9


def build_context(project: dict, step: dict) -> SimulationContext:
    """Index the project's materials (by id) and reaction sets (by set id); vessels are lazy."""
    materials_db = {m["id"]: m for m in project.get("materials", [])}
    reactions_db = {r["id"]: r for r in project.get("reactions", [])}
    return SimulationContext(
        project=project,
        step=step,
        vessels={},
        materials_db=materials_db,
        reactions_db=reactions_db,
        schedule_events=[],
        streams=[],
    )


def flatten_operations(step: dict) -> list[dict]:
    """Enabled operations across all unit procedures, in execution order."""
    return [
        op
        for up in step.get("unitProcedures", [])
        for op in up.get("operations", [])
        if op.get("isEnabled", True)
    ]


def _op_meta(step: dict) -> dict[str, dict]:
    meta: dict[str, dict] = {}
    for up in step.get("unitProcedures", []):
        for op in up.get("operations", []):
            meta[op["id"]] = {
                "name": op.get("displayName", op["id"]),
                "unitProcedureId": up["id"],
            }
    return meta


def _working_volume_map(project: dict) -> dict[str, float]:
    """equipmentId -> working volume (m³): maxFillVolume, else totalVolume × workingVolumeFraction."""
    out: dict[str, float] = {}
    for facility in project.get("facilities", []):
        for unit in facility.get("equipmentUnits", []):
            total = unit.get("totalVolume")
            frac = unit.get("workingVolumeFraction", 0.8)
            working = unit.get("maxFillVolume")
            if working is None and total is not None:
                working = total * frac
            if working:
                out[unit["id"]] = working
    return out


def _op_inventory_input(op: dict, materials_db: dict[str, dict]) -> float:
    """Total inventory mass (kg) an operation introduces (charges, inventory feeds, wash solvent)."""
    total = 0.0
    if op["type"] == "Charge":
        for mat in op.get("materials", []):
            material = materials_db.get(mat["materialId"], {})
            total += convert_to_kg(mat["amount"], mat["amountUnit"], material)
    for feed in op.get("continuousFeeds") or op.get("feeds") or []:
        if feed.get("source", "Inventory") == "Inventory" and feed.get("materialId"):
            material = materials_db.get(feed["materialId"], {})
            total += convert_to_kg(feed.get("amount", 0), feed.get("amountUnit", "kg"), material)
    if op["type"] == "WashCake":
        mat_id = op.get("solventMaterialId") or op.get("washMaterialId")
        if mat_id:
            material = materials_db.get(mat_id, {})
            amount = op.get("amountPerWash", op.get("washAmount", 0))
            unit = op.get("amountUnit", op.get("washAmountUnit", "kg"))
            total += convert_to_kg(amount, unit, material) * int(op.get("numberOfWashes", 1))
    if op["type"] == "FilterDry":
        for wash in op.get("washes", []):
            mat_id = wash.get("solventMaterialId") or wash.get("washMaterialId")
            if mat_id:
                material = materials_db.get(mat_id, {})
                amount = wash.get("amountPerWash", wash.get("washAmount", 0))
                unit = wash.get("amountUnit", wash.get("washAmountUnit", "kg"))
                total += convert_to_kg(amount, unit, material) * int(wash.get("numberOfWashes", 1))
    return total


def solve_step(project: dict, step: dict, on_progress: ProgressCallback | None = None) -> dict:
    """Execute a Step and return a StepSimulationResult-shaped dict (via assemble_result)."""
    ctx = build_context(project, step)
    op_results: dict[str, OperationResult] = {}
    equipment_contents: list[dict] = []
    streams: list[dict] = []
    material_balance: list[dict] = []
    op_meta = _op_meta(step)
    working_volumes = _working_volume_map(project)
    densities = {mid: (m.get("density") or 1000.0) for mid, m in ctx.materials_db.items()}
    flat_ops = flatten_operations(step)
    total = len(flat_ops)
    stream_seq = 0

    for i, op in enumerate(flat_ops):
        op_id = op["id"]
        before = {
            vid: {c.material_id: c.mass_kg for c in v.components.values()}
            for vid, v in ctx.vessels.items()
        }
        before_total = sum(v.total_mass_kg for v in ctx.vessels.values())

        solver = get_solver(op["type"])
        errors = solver.validate(op, ctx)
        result = solver.solve(op, ctx)
        if errors:
            result.warnings = [*errors, *result.warnings]
        op_results[op_id] = result

        # Mass removed from the system via vent/evaporated streams (only when no sink vessel).
        removed = sum(
            s.get("massKg", 0.0)
            for s in result.output_streams
            if s.get("type") in ("vent", "evaporated")
        )

        # Movement streams: for each vessel that gained material during this op, one stream.
        for vid, v in ctx.vessels.items():
            bmap = before.get(vid, {})
            gains = {
                c.material_id: c.mass_kg - bmap.get(c.material_id, 0.0)
                for c in v.components.values()
                if c.mass_kg - bmap.get(c.material_id, 0.0) > _EPS
            }
            if gains:
                stream_seq += 1
                streams.append(
                    {
                        "id": f"S{stream_seq}",
                        "sourceOperationId": op_id,
                        "destinationEquipmentId": vid,
                        "totalMassKg": sum(gains.values()),
                        "temperatureC": v.temperature_c,
                        "pressureKpa": v.pressure_kpa,
                        "components": [{"materialId": m, "massKg": g} for m, g in gains.items()],
                    }
                )
        # Vent/evaporated discard streams (mass leaving the system).
        for s in result.output_streams:
            if s.get("type") in ("vent", "evaporated") and s.get("massKg", 0) > 0:
                stream_seq += 1
                streams.append(
                    {
                        "id": f"S{stream_seq}",
                        "sourceOperationId": op_id,
                        "destinationEquipmentId": None,
                        "totalMassKg": s["massKg"],
                        "temperatureC": None,
                        "pressureKpa": None,
                        "components": [{"materialId": s["materialId"], "massKg": s["massKg"]}],
                    }
                )

        after_total = sum(v.total_mass_kg for v in ctx.vessels.values())
        mass_in = _op_inventory_input(op, ctx.materials_db)
        accumulation = after_total - before_total
        discrepancy = (mass_in - removed) - accumulation
        scale = max(before_total, mass_in, 1.0)
        material_balance.append(
            {
                "operationId": op_id,
                "operationName": op_meta.get(op_id, {}).get("name", op_id),
                "massInKg": mass_in,
                "massOutKg": removed,
                "accumulationKg": accumulation,
                "discrepancyPct": discrepancy / scale * 100.0,
            }
        )

        # Enriched equipment snapshots after this op.
        for v in ctx.vessels.values():
            vol = sum(c.mass_kg / densities.get(c.material_id, 1000.0) for c in v.components.values())
            working = working_volumes.get(v.equipment_id)
            equipment_contents.append(
                {
                    "afterOperationId": op_id,
                    "equipmentId": v.equipment_id,
                    "totalMassKg": v.total_mass_kg,
                    "totalVolumeM3": vol,
                    "temperatureC": v.temperature_c,
                    "pressureKpa": v.pressure_kpa,
                    "fillPct": (vol / working * 100.0) if working else None,
                    "components": [
                        {"materialId": c.material_id, "massKg": c.mass_kg, "phase": c.phase.value}
                        for c in v.components.values()
                    ],
                }
            )

        ctx.streams.extend(result.output_streams)
        if on_progress:
            on_progress(i + 1, total, op_id)

    from .assemble import assemble_result
    from .rules import validate_result
    from .scheduler import schedule_jit

    durations = {op_id: r.duration_min for op_id, r in op_results.items()}
    events = schedule_jit(step.get("unitProcedures", []), durations)
    ctx.schedule_events = [e.__dict__ for e in events]
    result = assemble_result(
        ctx,
        op_results,
        step,
        events,
        equipment_contents=equipment_contents,
        streams=streams,
        material_balance=material_balance,
        op_meta=op_meta,
    )
    # Implicit Rules pass — attaches structured warnings to result['ruleWarnings'].
    validate_result(step, result, ctx)
    return result
