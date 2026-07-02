import pytest

from app.solver.ops.transfer import TransferSolver
from app.solver.state import PhaseType, VesselContents
from tests._helpers import make_ctx, total_system_mass

solver = TransferSolver()


def test_percent_transfer_moves_half():
    ctx = make_ctx()
    src = VesselContents("A")
    src.add_component("w", 4.0, PhaseType.LIQUID)
    ctx.vessels["A"] = src
    op = {"id": "t", "type": "Transfer", "fromEquipmentId": "A", "toEquipmentId": "B", "transferPct": 50}
    before = total_system_mass(ctx)
    solver.solve(op, ctx)
    assert ctx.vessels["A"].total_mass_kg == pytest.approx(2.0)
    assert ctx.vessels["B"].total_mass_kg == pytest.approx(2.0)
    assert total_system_mass(ctx) == pytest.approx(before)


def test_fixed_amount_splits_by_mass_fraction():
    ctx = make_ctx()
    src = VesselContents("A")
    src.add_component("a", 1.0, PhaseType.LIQUID)
    src.add_component("b", 3.0, PhaseType.LIQUID)  # total 4 kg
    ctx.vessels["A"] = src
    op = {
        "id": "t", "type": "Transfer", "fromEquipmentId": "A", "toEquipmentId": "B",
        "transferAmount": 1.0, "transferAmountUnit": "kg",
    }
    solver.solve(op, ctx)
    # 1 kg total moved, 25% a / 75% b
    assert ctx.vessels["B"].components["a"].mass_kg == pytest.approx(0.25)
    assert ctx.vessels["B"].components["b"].mass_kg == pytest.approx(0.75)
    assert ctx.vessels["A"].total_mass_kg == pytest.approx(3.0)


def test_inline_filter_retains_solids():
    ctx = make_ctx()
    src = VesselContents("A")
    src.add_component("liq", 2.0, PhaseType.LIQUID)
    src.add_component("sol", 1.0, PhaseType.SOLID)
    ctx.vessels["A"] = src
    op = {
        "id": "t", "type": "Transfer", "fromEquipmentId": "A", "toEquipmentId": "B",
        "transferPct": 100, "inlineFilterEquipmentId": "F", "filterSolidsPct": 100,
    }
    before = total_system_mass(ctx)
    solver.solve(op, ctx)
    assert ctx.vessels["F"].components["sol"].mass_kg == pytest.approx(1.0)
    assert "sol" not in ctx.vessels["B"].components
    assert ctx.vessels["B"].components["liq"].mass_kg == pytest.approx(2.0)
    assert total_system_mass(ctx) == pytest.approx(before)
