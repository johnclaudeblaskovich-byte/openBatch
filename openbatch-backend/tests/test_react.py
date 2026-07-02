import pytest

from app.solver.ops.react import ReactSolver
from app.solver.state import PhaseType, VesselContents
from tests._helpers import make_ctx

solver = ReactSolver()

MATERIALS = {
    "A": {"molecularWeight": 100, "defaultPhase": "Liquid", "heatCapacityLiquid": 2000},
    "B": {"molecularWeight": 100, "defaultPhase": "Liquid", "heatCapacityLiquid": 2000},
    "C": {"molecularWeight": 50, "defaultPhase": "Liquid"},
    "D": {"molecularWeight": 200, "defaultPhase": "Liquid"},
}


def ctx_with(components, reactions):
    ctx = make_ctx(MATERIALS, {"rxn": {"reactions": reactions}})
    v = VesselContents("R1")
    for mid, mass in components.items():
        v.add_component(mid, mass, PhaseType.LIQUID)
    ctx.vessels["R1"] = v
    return ctx


def a_to_b(conv, rtype="Stoichiometric"):
    return {
        "id": "r", "type": "React", "equipmentId": "R1", "reactionDataSetId": "rxn",
        "reactionType": rtype,
    }


def test_simple_50pct_conversion():
    rxn = [{
        "keyComponentId": "A", "conversionPct": 50,
        "reactants": [{"materialId": "A", "stoichiometricCoeff": 1}],
        "products": [{"materialId": "B", "stoichiometricCoeff": 1, "phase": "Liquid"}],
    }]
    ctx = ctx_with({"A": 1.0}, rxn)
    solver.solve(a_to_b(50), ctx)
    assert ctx.vessels["R1"].components["A"].mass_kg == pytest.approx(0.5)
    assert ctx.vessels["R1"].components["B"].mass_kg == pytest.approx(0.5)


def test_stoichiometry_with_coefficients():
    # 2 C + D -> ... key C, coeff 2; 1 mol-equiv conversion
    rxn = [{
        "keyComponentId": "C", "conversionPct": 100,
        "reactants": [
            {"materialId": "C", "stoichiometricCoeff": 2},
            {"materialId": "D", "stoichiometricCoeff": 1},
        ],
        "products": [{"materialId": "B", "stoichiometricCoeff": 1, "phase": "Liquid"}],
    }]
    # 100 g C = 0.1 kg -> 2 mol C; D plentiful
    ctx = ctx_with({"C": 0.1, "D": 1.0}, rxn)
    solver.solve(a_to_b(100), ctx)
    # converted = 2 mol; D consumed = 1/2*2*200/1000 = 0.2 kg
    assert ctx.vessels["R1"].components["D"].mass_kg == pytest.approx(0.8)
    assert "C" not in ctx.vessels["R1"].components


def test_adiabatic_exotherm_raises_temperature():
    rxn = [{
        "keyComponentId": "A", "conversionPct": 100, "heatOfReaction": -50000,
        "reactants": [{"materialId": "A", "stoichiometricCoeff": 1}],
        "products": [{"materialId": "B", "stoichiometricCoeff": 1, "phase": "Liquid"}],
    }]
    ctx = ctx_with({"A": 1.0}, rxn)
    start = ctx.vessels["R1"].temperature_c
    solver.solve(a_to_b(100, "Adiabatic"), ctx)
    assert ctx.vessels["R1"].temperature_c > start


def test_missing_key_component_warns_and_no_change():
    rxn = [{
        "keyComponentId": "A", "conversionPct": 100,
        "reactants": [{"materialId": "A", "stoichiometricCoeff": 1}],
        "products": [{"materialId": "B", "stoichiometricCoeff": 1, "phase": "Liquid"}],
    }]
    ctx = ctx_with({"B": 1.0}, rxn)  # no A present
    result = solver.solve(a_to_b(100), ctx)
    assert any("key component not found" in w for w in result.warnings)
    assert ctx.vessels["R1"].components["B"].mass_kg == pytest.approx(1.0)
