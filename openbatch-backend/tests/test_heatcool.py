import copy

import pytest

from app.solver.ops.heatcool import CoolSolver, HeatSolver
from app.solver.state import PhaseType, VesselContents
from tests._helpers import make_ctx

heat = HeatSolver()
cool = CoolSolver()


def ctx_at(temp):
    ctx = make_ctx()
    v = VesselContents("R1", temperature_c=temp)
    v.add_component("a", 1.0, PhaseType.LIQUID)
    ctx.vessels["R1"] = v
    return ctx


def test_heat_duration_from_rate():
    ctx = ctx_at(25)
    op = {"id": "h", "type": "Heat", "equipmentId": "R1", "targetTemperatureC": 80, "heatingRateC_PerMin": 5}
    result = heat.solve(op, ctx)
    assert result.duration_min == pytest.approx(11)
    assert ctx.vessels["R1"].temperature_c == 80


def test_cool_explicit_time_overrides_rate():
    ctx = ctx_at(80)
    op = {"id": "c", "type": "Cool", "equipmentId": "R1", "targetTemperatureC": 5, "coolingTimeMin": 30, "coolingRateC_PerMin": 1}
    result = cool.solve(op, ctx)
    assert result.duration_min == 30


def test_missing_time_and_rate_fails_validate():
    ctx = ctx_at(25)
    op = {"id": "h", "type": "Heat", "equipmentId": "R1", "targetTemperatureC": 80}
    assert heat.validate(op, ctx)


def test_composition_unchanged():
    ctx = ctx_at(25)
    before = copy.deepcopy(ctx.vessels["R1"].components)
    heat.solve({"id": "h", "type": "Heat", "equipmentId": "R1", "targetTemperatureC": 50, "heatingTimeMin": 10}, ctx)
    assert ctx.vessels["R1"].components == before
