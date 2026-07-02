import pytest

from app.solver.ops.distill import DistillSolver
from app.solver.state import PhaseType, VesselContents
from tests._helpers import make_ctx, total_system_mass

solver = DistillSolver()


def ctx_mix(components):
    ctx = make_ctx()
    v = VesselContents("D")
    for mid, mass in components.items():
        v.add_component(mid, mass, PhaseType.LIQUID)
    ctx.vessels["D"] = v
    return ctx


def op(**kw):
    return {
        "id": "d", "type": "Distill", "equipmentId": "D", "separationMode": "Percent",
        "distillateEquipmentId": "DIST", **kw,
    }


def test_percent_overhead_split():
    ctx = ctx_mix({"volatile": 1.0})
    solver.solve(
        op(separations=[{"materialId": "volatile", "goesTo": "Overhead", "pct": 90}]), ctx
    )
    assert ctx.vessels["DIST"].components["volatile"].mass_kg == pytest.approx(0.9)
    assert ctx.vessels["D"].components["volatile"].mass_kg == pytest.approx(0.1)


def test_unlisted_follows_unspecified():
    ctx = ctx_mix({"volatile": 1.0, "heavy": 1.0})
    solver.solve(
        op(
            separations=[{"materialId": "volatile", "goesTo": "Overhead", "pct": 100}],
            unspecifiedGoesTo="Bottoms",
        ),
        ctx,
    )
    assert "volatile" not in ctx.vessels["D"].components
    assert ctx.vessels["D"].components["heavy"].mass_kg == pytest.approx(1.0)


def test_stop_criterion_caps_overhead():
    ctx = ctx_mix({"volatile": 1.0})
    solver.solve(
        op(
            separations=[{"materialId": "volatile", "goesTo": "Overhead", "pct": 100}],
            stopCriterion={"type": "AmountRemoved", "amount": 0.3, "unit": "kg"},
        ),
        ctx,
    )
    assert ctx.vessels["DIST"].components["volatile"].mass_kg == pytest.approx(0.3)


def test_mass_conserved():
    ctx = ctx_mix({"volatile": 1.0, "heavy": 1.0})
    before = total_system_mass(ctx)
    solver.solve(op(separations=[{"materialId": "volatile", "goesTo": "Overhead", "pct": 80}]), ctx)
    assert total_system_mass(ctx) == pytest.approx(before)
