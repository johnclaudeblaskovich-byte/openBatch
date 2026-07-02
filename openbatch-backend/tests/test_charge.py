import pytest

from app.solver.ops.charge import ChargeSolver
from tests._helpers import make_ctx

MATERIALS = {
    "water": {"defaultPhase": "Liquid", "density": 1000},
    "ethanol": {"defaultPhase": "Liquid", "density": 789},
}

solver = ChargeSolver()


def charge_op(materials, **kw):
    return {"id": "op1", "type": "Charge", "equipmentId": "R1", "materials": materials, **kw}


def test_charges_multiple_materials():
    ctx = make_ctx(MATERIALS)
    op = charge_op(
        [
            {"materialId": "water", "amount": 1, "amountUnit": "kg"},
            {"materialId": "ethanol", "amount": 0.5, "amountUnit": "kg"},
        ]
    )
    solver.solve(op, ctx)
    assert ctx.vessels["R1"].total_mass_kg == pytest.approx(1.5)


def test_grams_unit():
    ctx = make_ctx(MATERIALS)
    op = charge_op([{"materialId": "water", "amount": 500, "amountUnit": "g"}])
    solver.solve(op, ctx)
    assert ctx.vessels["R1"].total_mass_kg == pytest.approx(0.5)


def test_duration_from_rate():
    ctx = make_ctx(MATERIALS)
    op = charge_op(
        [{"materialId": "water", "amount": 1.5, "amountUnit": "kg"}],
        chargeRateKgPerMin=50,
    )
    result = solver.solve(op, ctx)
    assert result.duration_min == pytest.approx(0.03)


def test_validate_unknown_material():
    ctx = make_ctx(MATERIALS)
    op = charge_op([{"materialId": "ghost", "amount": 1, "amountUnit": "kg"}])
    errors = solver.validate(op, ctx)
    assert any("ghost" in e for e in errors)
