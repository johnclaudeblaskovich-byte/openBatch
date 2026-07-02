import pytest

from app.solver.ops.ferment import FermentSolver
from app.solver.state import PhaseType, VesselContents
from tests._helpers import make_ctx

solver = FermentSolver()

MATERIALS = {
    "substrate": {"molecularWeight": 100, "defaultPhase": "Liquid"},
    "biomass": {"molecularWeight": 100, "defaultPhase": "Liquid"},
    "nutrient": {"molecularWeight": 50, "defaultPhase": "Liquid"},
}
REACTIONS = {
    "ferm": {
        "reactions": [
            {
                "keyComponentId": "substrate", "conversionPct": 100,
                "reactants": [{"materialId": "substrate", "stoichiometricCoeff": 1}],
                "products": [{"materialId": "biomass", "stoichiometricCoeff": 1, "phase": "Liquid"}],
            }
        ]
    }
}


def ctx_with(components):
    ctx = make_ctx(MATERIALS, REACTIONS)
    v = VesselContents("FRM")
    for mid, mass in components.items():
        v.add_component(mid, mass, PhaseType.LIQUID)
    ctx.vessels["FRM"] = v
    return ctx


def op(**kw):
    return {
        "id": "f", "type": "Ferment", "equipmentId": "FRM", "reactionDataSetId": "ferm",
        "yields": [{"materialId": "biomass", "yieldPct": 60}],
        "fermentationTimeMin": 600, **kw,
    }


def test_60pct_of_theoretical():
    ctx = ctx_with({"substrate": 0.1})  # 1 mol -> theoretical 1 mol biomass
    solver.solve(op(), ctx)
    assert ctx.vessels["FRM"].components["biomass"].mass_kg == pytest.approx(0.06)


def test_nutrient_feed_added_before_formation():
    ctx = ctx_with({"substrate": 0.1})
    solver.solve(
        op(feeds=[{"source": "Inventory", "materialId": "nutrient", "amount": 0.3, "amountUnit": "kg"}]),
        ctx,
    )
    assert ctx.vessels["FRM"].components["nutrient"].mass_kg == pytest.approx(0.3)


def test_duration_is_fermentation_time():
    ctx = ctx_with({"substrate": 0.1})
    assert solver.solve(op(), ctx).duration_min == 600
