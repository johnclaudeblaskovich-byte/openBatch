"""Yield-based reaction solver — products form per specified yield percentages rather than from
kinetics, scaled against the limiting reactant and the reaction set's stoichiometry.

The yield core (`run_yields`) is shared with the Ferment solver.
"""

from __future__ import annotations

from ..base import OperationResult, OperationSolver
from ..feeds import apply_continuous_feeds
from ..props import compute_avg_cp
from ..registry import register
from ..state import SimulationContext, VesselContents


def _moles(mass_kg: float, mw: float) -> float:
    return mass_kg / mw * 1000.0


def run_yields(op: dict, ctx: SimulationContext, vessel: VesselContents) -> None:
    """Apply yield-based reaction to a vessel: consume reactants at the governing extent and form
    each specified product at its own yield, then handle temperature (isothermal/adiabatic).
    """
    rxn = ctx.reactions_db[op["reactionDataSetId"]]["reactions"][0]
    reactant_coeff = {r["materialId"]: r["stoichiometricCoeff"] for r in rxn["reactants"]}
    product_coeff = {p["materialId"]: p["stoichiometricCoeff"] for p in rxn["products"]}
    product_phase = {p["materialId"]: p.get("phase", "Liquid") for p in rxn["products"]}

    # Reaction extent limited by the limiting reactant currently in the vessel.
    extent_max = None
    for mat_id, coeff in reactant_coeff.items():
        comp = vessel.components.get(mat_id)
        mw = ctx.materials_db[mat_id]["molecularWeight"]
        moles = _moles(comp.mass_kg, mw) if comp else 0.0
        avail = moles / coeff if coeff else 0.0
        extent_max = avail if extent_max is None else min(extent_max, avail)
    extent_max = extent_max or 0.0

    yields = op.get("yields", [])
    governing_f = max((y.get("yieldPct", 0) for y in yields), default=0) / 100.0

    extent_used = extent_max * governing_f
    for mat_id, coeff in reactant_coeff.items():
        mw = ctx.materials_db[mat_id]["molecularWeight"]
        vessel.remove_component(mat_id, coeff * extent_used * mw / 1000.0)

    for spec in yields:
        mat_id = spec["materialId"]
        coeff = product_coeff.get(mat_id, 1.0)
        mw = ctx.materials_db[mat_id]["molecularWeight"]
        produced_moles = coeff * extent_max * (spec.get("yieldPct", 0) / 100.0)
        vessel.add_component(
            mat_id,
            produced_moles * mw / 1000.0,
            spec.get("phase", product_phase.get(mat_id, "Liquid")),
        )

    if op.get("reactionType") == "Adiabatic":
        hr = rxn.get("heatOfReactionJPerMol", rxn.get("heatOfReaction", 0.0))
        delta_h = hr * extent_used
        cp = compute_avg_cp(vessel, ctx.materials_db)
        m = vessel.total_mass_kg
        if m > 0:
            vessel.temperature_c += -delta_h / (m * cp)
    elif op.get("finalTemperatureC") is not None:
        vessel.temperature_c = op["finalTemperatureC"]


@register("YieldReact")
class YieldReactSolver(OperationSolver):
    def validate(self, op: dict, ctx: SimulationContext) -> list[str]:
        errors: list[str] = []
        if not op.get("equipmentId"):
            errors.append("YieldReact: equipmentId is required")
        if op.get("reactionDataSetId") not in ctx.reactions_db:
            errors.append("YieldReact: a valid reactionDataSetId is required")
        return errors

    def solve(self, op: dict, ctx: SimulationContext) -> OperationResult:
        equip_id = op["equipmentId"]
        vessel = ctx.vessels[equip_id]
        streams: list[dict] = []

        feeds = op.get("feeds") or op.get("continuousFeeds")
        if feeds:
            _, records = apply_continuous_feeds(feeds, ctx, vessel)
            streams.extend(records)

        run_yields(op, ctx, vessel)

        return OperationResult(
            operation_id=op["id"],
            duration_min=op.get("reactionTimeMin", 60.0),
            equipment_ids=[equip_id],
            output_streams=streams,
        )
