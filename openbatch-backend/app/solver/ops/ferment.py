"""Ferment solver — biotech yield reaction (substrate -> product/biomass) with nutrient feeds.

Modeled like YieldReact with fermentation-specific timing; reuses the shared yield core.
"""

from __future__ import annotations

from ..base import OperationResult, OperationSolver
from ..feeds import apply_continuous_feeds
from ..registry import register
from ..state import SimulationContext
from ..util import ensure_vessel
from .yield_react import run_yields


@register("Ferment")
class FermentSolver(OperationSolver):
    def validate(self, op: dict, ctx: SimulationContext) -> list[str]:
        errors: list[str] = []
        if not op.get("equipmentId"):
            errors.append("Ferment: equipmentId is required")
        if op.get("reactionDataSetId") not in ctx.reactions_db:
            errors.append("Ferment: a valid reactionDataSetId is required")
        return errors

    def solve(self, op: dict, ctx: SimulationContext) -> OperationResult:
        equip_id = op["equipmentId"]
        vessel = ensure_vessel(ctx, equip_id)
        streams: list[dict] = []

        # Continuous nutrient feeds are added before product formation.
        feeds = op.get("feeds") or op.get("continuousFeeds")
        if feeds:
            _, records = apply_continuous_feeds(feeds, ctx, vessel)
            streams.extend(records)

        run_yields(op, ctx, vessel)

        return OperationResult(
            operation_id=op["id"],
            duration_min=op.get("fermentationTimeMin", 0.0),
            equipment_ids=[equip_id],
            output_streams=streams,
        )
