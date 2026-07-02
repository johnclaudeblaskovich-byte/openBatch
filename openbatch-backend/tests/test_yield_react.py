import pytest

from app.solver.ops.yield_react import YieldReactSolver
from app.solver.state import PhaseType, VesselContents
from tests._helpers import make_ctx

solver = YieldReactSolver()

MATERIALS = {
    "A": {"molecularWeight": 100, "defaultPhase": "Liquid"},
    "P": {"molecularWeight": 100, "defaultPhase": "Liquid"},
    "S": {"molecularWeight": 50, "defaultPhase": "Liquid"},
}

# A -> P
REACTIONS = {
    "rxn": {
        "reactions": [
            {
                "keyComponentId": "A", "conversionPct": 100, "heatOfReaction": -40000,
                "reactants": [{"materialId": "A", "stoichiometricCoeff": 1}],
                "products": [{"materialId": "P", "stoichiometricCoeff": 1, "phase": "Liquid"}],
            }
        ]
    }
}


def ctx_with(components):
    ctx = make_ctx(MATERIALS, REACTIONS)
    v = VesselContents("R1")
    for mid, mass in components.items():
        v.add_component(mid, mass, PhaseType.LIQUID)
    ctx.vessels["R1"] = v
    return ctx


def base_op(**kw):
    return {
        "id": "y", "type": "YieldReact", "equipmentId": "R1", "reactionDataSetId": "rxn",
        "yields": [{"materialId": "P", "yieldPct": 80}],
        **kw,
    }


def test_80pct_of_theoretical():
    # 0.1 kg A = 1 mol -> theoretical 1 mol P; 80% -> 0.8 mol = 0.08 kg
    ctx = ctx_with({"A": 0.1})
    solver.solve(base_op(), ctx)
    assert ctx.vessels["R1"].components["P"].mass_kg == pytest.approx(0.08)


def test_continuous_feed_present_before_reaction():
    ctx = ctx_with({"A": 0.1})
    op = base_op(feeds=[{"source": "Inventory", "materialId": "S", "amount": 0.5, "amountUnit": "kg"}])
    solver.solve(op, ctx)
    assert ctx.vessels["R1"].components["S"].mass_kg == pytest.approx(0.5)


def test_mass_consistency_products_vs_reactants():
    ctx = ctx_with({"A": 0.1})
    solver.solve(base_op(), ctx)
    # consumed 0.8 mol A (0.08 kg), produced 0.8 mol P (0.08 kg)
    assert ctx.vessels["R1"].components["A"].mass_kg == pytest.approx(0.02)
    assert ctx.vessels["R1"].components["P"].mass_kg == pytest.approx(0.08)


def test_adiabatic_adjusts_temperature():
    ctx = ctx_with({"A": 0.1})
    start = ctx.vessels["R1"].temperature_c
    solver.solve(base_op(reactionType="Adiabatic"), ctx)
    assert ctx.vessels["R1"].temperature_c > start
