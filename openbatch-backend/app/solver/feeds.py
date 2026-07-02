"""Shared continuous-feed handling used by React / YieldReact / Distill / Ferment.

A ``ContinuousFeed`` adds metered material into a vessel during an operation, sourced either from
inventory (a material id) or pulled from another equipment vessel.
"""

from __future__ import annotations

from .convert import convert_to_kg
from .state import SimulationContext, VesselContents


def apply_continuous_feeds(
    feeds: list[dict],
    ctx: SimulationContext,
    vessel: VesselContents,
) -> tuple[float, list[dict]]:
    """Add each feed's material to ``vessel``. Returns (total_added_kg, feed_stream_records)."""
    total_added = 0.0
    records: list[dict] = []
    for feed in feeds or []:
        source = feed.get("source", "Inventory")
        if source == "Equipment":
            src_id = feed.get("sourceEquipmentId")
            src = ctx.vessels.get(src_id)
            if src is None or src.total_mass_kg <= 0:
                continue
            # Pull a target mass proportionally across the source's components.
            target = convert_to_kg(feed["amount"], feed.get("amountUnit", "kg"), {})
            fraction = min(target / src.total_mass_kg, 1.0)
            snapshot = [(c.material_id, c.mass_kg, c.phase) for c in src.components.values()]
            for mat_id, mass_kg, phase in snapshot:
                move = mass_kg * fraction
                src.remove_component(mat_id, move)
                vessel.add_component(mat_id, move, phase)
                total_added += move
            records.append({"type": "feed", "source": src_id, "massKg": target})
        else:
            mat_id = feed.get("materialId")
            material = ctx.materials_db.get(mat_id, {})
            mass_kg = convert_to_kg(feed["amount"], feed.get("amountUnit", "kg"), material)
            vessel.add_component(mat_id, mass_kg, material.get("defaultPhase", "Liquid"))
            total_added += mass_kg
            records.append({"type": "feed", "materialId": mat_id, "massKg": mass_kg})
    return total_added, records
