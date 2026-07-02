"""React solver — shortcut stoichiometric reaction by key-component conversion."""

from __future__ import annotations

from ..base import OperationResult, OperationSolver
from ..feeds import apply_continuous_feeds
from ..props import compute_avg_cp
from ..registry import register
from ..state import ComponentMass, SimulationContext
from ..util import get_key_coeff


def _heat_of_reaction(rxn: dict) -> float:
    hr = rxn.get("heatOfReactionJPerMol")
    return rxn.get("heatOfReaction", 0.0) if hr is None else hr


@register("React")
class ReactSolver(OperationSolver):
    def validate(self, op: dict, ctx: SimulationContext) -> list[str]:
        errors: list[str] = []
        if not op.get("equipmentId"):
            errors.append("React: equipmentId is required")
        if op.get("reactionDataSetId") not in ctx.reactions_db:
            errors.append(f"React: unknown reaction data set {op.get('reactionDataSetId')}")
        return errors

    def solve(self, op: dict, ctx: SimulationContext) -> OperationResult:
        equip_id = op["equipmentId"]
        vessel = ctx.vessels[equip_id]
        rxn_set = ctx.reactions_db[op["reactionDataSetId"]]
        warnings: list[str] = []
        adiabatic = op.get("reactionType") == "Adiabatic"

        # Continuous feeds are charged before reacting.
        streams: list[dict] = []
        feeds = op.get("continuousFeeds") or op.get("feeds")
        if feeds:
            _, records = apply_continuous_feeds(feeds, ctx, vessel)
            streams.extend(records)

        for rxn in rxn_set["reactions"]:
            key_id = rxn["keyComponentId"]
            conv = rxn["conversionPct"] / 100.0
            if key_id not in vessel.components:
                warnings.append(f"key component not found: {key_id}")
                continue
            key_mass = vessel.components.get(key_id, ComponentMass(key_id, 0.0)).mass_kg
            key_mw = ctx.materials_db[key_id]["molecularWeight"]
            key_moles = key_mass / key_mw * 1000.0
            converted = key_moles * conv
            key_coeff = get_key_coeff(rxn)

            for r in rxn["reactants"]:
                mw = ctx.materials_db[r["materialId"]]["molecularWeight"]
                vessel.remove_component(
                    r["materialId"],
                    r["stoichiometricCoeff"] / key_coeff * converted * mw / 1000.0,
                )
            for p in rxn["products"]:
                mat = ctx.materials_db[p["materialId"]]
                mw = mat["molecularWeight"]
                vessel.add_component(
                    p["materialId"],
                    p["stoichiometricCoeff"] / key_coeff * converted * mw / 1000.0,
                    p.get("phase", mat.get("defaultPhase", "Liquid")),
                )

            if adiabatic:
                delta_h = _heat_of_reaction(rxn) * converted
                cp = compute_avg_cp(vessel, ctx.materials_db)
                m = vessel.total_mass_kg
                if m > 0:
                    vessel.temperature_c += -delta_h / (m * cp)

        if not adiabatic:
            target = op.get("finalTemperatureC", op.get("temperatureC"))
            if target is not None:
                vessel.temperature_c = target

        return OperationResult(
            operation_id=op["id"],
            duration_min=op.get("reactionTimeMin", 60.0),
            equipment_ids=[equip_id],
            output_streams=streams,
            warnings=warnings,
        )
