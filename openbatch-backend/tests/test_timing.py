import copy

import pytest

from app.solver.ops.timing import AgeSolver, MixSolver
from app.solver.state import PhaseType, VesselContents
from tests._helpers import make_ctx

mix = MixSolver()
age = AgeSolver()


def ctx_with_contents():
    ctx = make_ctx()
    v = VesselContents("R1")
    v.add_component("a", 1.0, PhaseType.LIQUID)
    v.add_component("b", 2.0, PhaseType.SOLID)
    ctx.vessels["R1"] = v
    return ctx


def test_mix_leaves_contents_unchanged():
    ctx = ctx_with_contents()
    before = copy.deepcopy(ctx.vessels["R1"].components)
    result = mix.solve({"id": "m", "type": "Mix", "equipmentId": "R1", "mixingTimeMin": 30}, ctx)
    assert result.duration_min == 30
    assert ctx.vessels["R1"].components == before


def test_age_with_condenser_lists_both():
    ctx = ctx_with_contents()
    result = age.solve(
        {"id": "a", "type": "Age", "equipmentId": "R1", "agingTimeMin": 20, "condenserEquipmentId": "C1"},
        ctx,
    )
    assert result.equipment_ids == ["R1", "C1"]


def test_negative_time_fails_validate():
    ctx = ctx_with_contents()
    errors = mix.validate({"id": "m", "type": "Mix", "equipmentId": "R1", "mixingTimeMin": -1}, ctx)
    assert errors
