import pytest

from app.solver.ops.filter import FilterSolver
from app.solver.state import PhaseType, VesselContents
from tests._helpers import make_ctx, total_system_mass

solver = FilterSolver()


def ctx_slurry(solid=1.0, liquid=1.0):
    ctx = make_ctx()
    v = VesselContents("S")
    if solid:
        v.add_component("sol", solid, PhaseType.SOLID)
    if liquid:
        v.add_component("liq", liquid, PhaseType.LIQUID)
    ctx.vessels["S"] = v
    return ctx


def op(**kw):
    return {
        "id": "f", "type": "Filter", "fromEquipmentId": "S",
        "filterEquipmentId": "CAKE", "motherLiquorEquipmentId": "ML", **kw,
    }


def test_cake_and_mother_liquor_split():
    ctx = ctx_slurry()
    solver.solve(op(filterSolidsPct=100, cakeMoisturePct=10), ctx)
    cake = ctx.vessels["CAKE"]
    ml = ctx.vessels["ML"]
    assert cake.components["sol"].mass_kg == pytest.approx(1.0)
    assert cake.components["liq"].mass_kg == pytest.approx(0.1)
    assert ml.components["liq"].mass_kg == pytest.approx(0.9)


def test_transfer_pct_processes_half():
    ctx = ctx_slurry(solid=2.0, liquid=0.0)
    solver.solve(op(transferPct=50, filterSolidsPct=100), ctx)
    assert ctx.vessels["S"].components["sol"].mass_kg == pytest.approx(1.0)
    assert ctx.vessels["CAKE"].components["sol"].mass_kg == pytest.approx(1.0)


def test_mass_conserved():
    ctx = ctx_slurry()
    before = total_system_mass(ctx)
    solver.solve(op(filterSolidsPct=95, cakeMoisturePct=20), ctx)
    assert total_system_mass(ctx) == pytest.approx(before)


def test_duration_sums_filtration_and_slurry():
    ctx = ctx_slurry()
    result = solver.solve(op(filtrationTimeMin=30, slurryTransferTimeMin=5), ctx)
    assert result.duration_min == 35
