"""Shared helpers for solver tests."""

from __future__ import annotations

from app.solver.state import SimulationContext


def make_ctx(
    materials_db: dict | None = None,
    reactions_db: dict | None = None,
    project: dict | None = None,
    step: dict | None = None,
) -> SimulationContext:
    return SimulationContext(
        project=project or {},
        step=step or {},
        vessels={},
        materials_db=materials_db or {},
        reactions_db=reactions_db or {},
        schedule_events=[],
        streams=[],
    )


def total_system_mass(ctx: SimulationContext) -> float:
    return sum(v.total_mass_kg for v in ctx.vessels.values())
