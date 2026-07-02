import pytest

from app.solver.ops.crystallize import CrystallizeSolver
from app.solver.state import PhaseType, VesselContents
from tests._helpers import make_ctx

solver = CrystallizeSolver()


def ctx_with(components):
    ctx = make_ctx()
    v = VesselContents("CR1")
    for mid, mass in components.items():
        v.add_component(mid, mass, PhaseType.LIQUID)
    ctx.vessels["CR1"] = v
    return ctx


def op(**kw):
    return {"id": "x", "type": "Crystallize", "equipmentId": "CR1", **kw}


def test_phase_split_70_30():
    ctx = ctx_with({"prod": 1.0})
    solver.solve(op(separations=[{"materialId": "prod", "separationPct": 70}], crystallizationTimeMin=60), ctx)
    v = ctx.vessels["CR1"]
    assert v.components["prod::solid"].mass_kg == pytest.approx(0.7)
    assert v.components["prod::solid"].phase is PhaseType.SOLID
    assert v.components["prod"].mass_kg == pytest.approx(0.3)
    assert v.total_mass_kg == pytest.approx(1.0)


def test_target_temperature_set():
    ctx = ctx_with({"prod": 1.0})
    solver.solve(op(separations=[{"materialId": "prod", "separationPct": 50}], targetTemperatureC=5), ctx)
    assert ctx.vessels["CR1"].temperature_c == 5


def test_missing_component_warns():
    ctx = ctx_with({"prod": 1.0})
    result = solver.solve(op(separations=[{"materialId": "ghost", "separationPct": 50}]), ctx)
    assert any("component not present" in w for w in result.warnings)
    assert ctx.vessels["CR1"].total_mass_kg == pytest.approx(1.0)
