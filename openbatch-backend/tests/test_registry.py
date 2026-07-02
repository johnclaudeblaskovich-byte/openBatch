import pytest

from app.solver.base import OperationResult, OperationSolver
from app.solver.registry import OPERATION_SOLVERS, get_solver, register
from app.solver.state import SimulationContext, VesselContents
from app.solver.util import ensure_vessel, get_equipment_ids, get_key_coeff


def test_operation_result_defaults():
    r = OperationResult()
    assert r.duration_min == 0.0
    assert r.equipment_ids == []
    assert r.output_streams == []
    assert r.warnings == []


def test_register_and_get_solver():
    original = OPERATION_SOLVERS.get("Charge")
    try:

        @register("Charge")
        class _Dummy(OperationSolver):
            def validate(self, op, ctx):
                return []

            def solve(self, op, ctx):
                return OperationResult(operation_id=op.get("id", ""))

        assert get_solver("Charge") is OPERATION_SOLVERS["Charge"]
        assert isinstance(get_solver("Charge"), _Dummy)
    finally:
        # Restore the real solver so other tests aren't polluted by the global registry.
        if original is not None:
            OPERATION_SOLVERS["Charge"] = original


def test_get_solver_unknown_raises():
    with pytest.raises(KeyError):
        get_solver("Nope")


def test_get_equipment_ids():
    op = {"type": "Transfer", "fromEquipmentId": "A", "toEquipmentId": "B"}
    assert get_equipment_ids(op) == ["A", "B"]


def test_get_key_coeff():
    rxn = {
        "keyComponentId": "k",
        "reactants": [
            {"materialId": "k", "stoichiometricCoeff": 2},
            {"materialId": "x", "stoichiometricCoeff": 1},
        ],
    }
    assert get_key_coeff(rxn) == 2.0


def _ctx() -> SimulationContext:
    return SimulationContext(
        project={}, step={}, vessels={}, materials_db={}, reactions_db={},
        schedule_events=[], streams=[],
    )


def test_ensure_vessel_creates_once():
    ctx = _ctx()
    v1 = ensure_vessel(ctx, "R1")
    v2 = ensure_vessel(ctx, "R1")
    assert v1 is v2
    assert isinstance(v1, VesselContents)
