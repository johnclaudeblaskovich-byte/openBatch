import pytest

from app.solver.feeds import apply_continuous_feeds
from app.solver.ops.concentrate import ConcentrateSolver
from app.solver.state import PhaseType, VesselContents
from tests._helpers import make_ctx, total_system_mass

solver = ConcentrateSolver()


def ctx_with_liquid(mass):
    ctx = make_ctx()
    v = VesselContents("E1")
    v.add_component("solv", mass, PhaseType.LIQUID)
    ctx.vessels["E1"] = v
    return ctx


def test_removes_40pct_liquid():
    ctx = ctx_with_liquid(2.0)
    solver.solve({"id": "c", "type": "Concentrate", "equipmentId": "E1", "removalPct": 40}, ctx)
    assert ctx.vessels["E1"].total_mass_kg == pytest.approx(1.2)


def test_condenser_captures_removed_mass():
    ctx = ctx_with_liquid(2.0)
    before = total_system_mass(ctx)
    solver.solve(
        {"id": "c", "type": "Concentrate", "equipmentId": "E1", "removalPct": 40, "condenserEquipmentId": "C1"},
        ctx,
    )
    assert ctx.vessels["C1"].components["solv"].mass_kg == pytest.approx(0.8)
    assert total_system_mass(ctx) == pytest.approx(before)


def test_apply_inventory_feed_adds_mass():
    ctx = make_ctx({"x": {"defaultPhase": "Liquid"}})
    v = VesselContents("R1")
    ctx.vessels["R1"] = v
    added, _ = apply_continuous_feeds(
        [{"source": "Inventory", "materialId": "x", "amount": 0.5, "amountUnit": "kg"}], ctx, v
    )
    assert added == pytest.approx(0.5)
    assert v.components["x"].mass_kg == pytest.approx(0.5)


def test_apply_equipment_feed_reduces_source():
    ctx = make_ctx()
    src = VesselContents("SRC")
    src.add_component("x", 1.0, PhaseType.LIQUID)
    ctx.vessels["SRC"] = src
    dest = VesselContents("R1")
    ctx.vessels["R1"] = dest
    apply_continuous_feeds(
        [{"source": "Equipment", "sourceEquipmentId": "SRC", "amount": 0.3, "amountUnit": "kg"}],
        ctx,
        dest,
    )
    assert ctx.vessels["SRC"].total_mass_kg == pytest.approx(0.7)
    assert dest.components["x"].mass_kg == pytest.approx(0.3)
