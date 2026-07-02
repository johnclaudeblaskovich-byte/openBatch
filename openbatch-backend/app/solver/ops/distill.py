"""Distill solver — separates volatiles to an overhead receiver, leaving bottoms in place.

Percent mode applies an explicit per-component split. Rayleigh mode is a documented shortcut:
the overhead cut (capped by the stop criterion) is distributed across components weighted by their
Antoine vapour pressure at the bottoms temperature — not a rigorous Rayleigh integration.
"""

from __future__ import annotations

from ..base import OperationResult, OperationSolver
from ..convert import convert_to_kg
from ..feeds import apply_continuous_feeds
from ..props import antoine_psat_kpa
from ..registry import register
from ..state import PhaseType, SimulationContext, VesselContents
from ..util import ensure_vessel

_EPS = 1e-9


def _percent_overhead(op: dict, vessel: VesselContents) -> dict[str, float]:
    """Desired overhead mass per component key under Percent mode."""
    by_material = {s["materialId"]: s for s in op.get("separations", [])}
    unspecified = op.get("unspecifiedGoesTo", "Bottoms")
    desired: dict[str, float] = {}
    for key, comp in vessel.components.items():
        spec = by_material.get(comp.material_id)
        if spec is not None:
            frac = spec["pct"] / 100.0
            overhead_frac = frac if spec["goesTo"] == "Overhead" else 1.0 - frac
        else:
            overhead_frac = 1.0 if unspecified == "Overhead" else 0.0
        desired[key] = comp.mass_kg * overhead_frac
    return desired


def _rayleigh_overhead(
    op: dict, vessel: VesselContents, materials_db: dict[str, dict]
) -> dict[str, float]:
    """Volatility-weighted overhead distribution (shortcut)."""
    temp = op.get("bottomsTemperatureC", vessel.temperature_c)
    weights: dict[str, float] = {}
    for key, comp in vessel.components.items():
        mat = materials_db.get(comp.material_id, {})
        psat = antoine_psat_kpa(mat, temp) if "antoineA" in mat else 0.0
        weights[key] = psat * comp.mass_kg
    total_w = sum(weights.values())
    sc = op.get("stopCriterion") or {}
    if sc.get("type") == "AmountRemoved":
        cut = convert_to_kg(sc["amount"], sc.get("unit", "kg"), {})
    else:
        cut = vessel.total_mass_kg * 0.5
    desired: dict[str, float] = {}
    for key, comp in vessel.components.items():
        share = (weights[key] / total_w) if total_w > 0 else 0.0
        desired[key] = min(comp.mass_kg, cut * share)
    return desired


def _apply_stop_cap(op: dict, vessel: VesselContents, desired: dict[str, float]) -> float:
    """Return a scale factor for the desired overhead given the stop criterion."""
    overhead_total = sum(desired.values())
    if overhead_total <= 0:
        return 0.0
    sc = op.get("stopCriterion") or {}
    total = vessel.total_mass_kg
    if sc.get("type") == "AmountRemoved":
        cap = convert_to_kg(sc["amount"], sc.get("unit", "kg"), {})
    elif sc.get("type") == "AmountRetained":
        cap = max(0.0, total - convert_to_kg(sc["amount"], sc.get("unit", "kg"), {}))
    else:
        cap = overhead_total
    return min(1.0, cap / overhead_total)


@register("Distill")
class DistillSolver(OperationSolver):
    def validate(self, op: dict, ctx: SimulationContext) -> list[str]:
        errors: list[str] = []
        if not op.get("equipmentId"):
            errors.append("Distill: equipmentId is required")
        return errors

    def solve(self, op: dict, ctx: SimulationContext) -> OperationResult:
        equip_id = op["equipmentId"]
        vessel = ensure_vessel(ctx, equip_id)
        streams: list[dict] = []

        feeds = op.get("feeds") or op.get("continuousFeeds")
        if feeds:
            _, recs = apply_continuous_feeds(feeds, ctx, vessel)
            streams.extend(recs)

        mode = op.get("separationMode", "Percent")
        if mode == "Rayleigh":
            desired = _rayleigh_overhead(op, vessel, ctx.materials_db)
        else:
            desired = _percent_overhead(op, vessel)
        scale = _apply_stop_cap(op, vessel, desired)

        dist_id = op.get("distillateEquipmentId")
        distillate = ensure_vessel(ctx, dist_id) if dist_id else VesselContents("__overhead__")

        snapshot = list(vessel.components.items())
        for key, comp in snapshot:
            overhead = desired.get(key, 0.0) * scale
            if overhead <= 0:
                continue
            mat_id, phase = comp.material_id, comp.phase
            comp.mass_kg -= overhead
            if comp.mass_kg < _EPS:
                del vessel.components[key]
            distillate.add_component(mat_id, overhead, phase)

        if op.get("bottomsTemperatureC") is not None:
            vessel.temperature_c = op["bottomsTemperatureC"]
        if op.get("bottomsPressureKPa") is not None:
            vessel.pressure_kpa = op["bottomsPressureKPa"]

        equipment_ids = [equip_id]
        for eid in (dist_id, op.get("condenserEquipmentId"), op.get("vacuumPumpId")):
            if eid and eid not in equipment_ids:
                equipment_ids.append(eid)

        return OperationResult(
            operation_id=op["id"],
            duration_min=op.get("distillationTimeMin", 0.0),
            equipment_ids=equipment_ids,
            output_streams=streams,
        )
