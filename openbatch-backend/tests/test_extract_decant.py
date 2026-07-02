import pytest

from app.solver.ops.decant import DecantSolver
from app.solver.ops.extract import ExtractSolver
from app.solver.state import PhaseType, VesselContents
from tests._helpers import make_ctx, total_system_mass

extract = ExtractSolver()
decant = DecantSolver()


def ctx_mix(components):
    ctx = make_ctx()
    v = VesselContents("X")
    for mid, mass in components.items():
        v.add_component(mid, mass, PhaseType.LIQUID)
    ctx.vessels["X"] = v
    return ctx


def test_extract_top_split():
    ctx = ctx_mix({"product": 1.0})
    extract.solve(
        {"id": "e", "type": "Extract", "equipmentId": "X", "topLayerEquipmentId": "TOP",
         "separations": [{"materialId": "product", "goesTo": "Top", "pct": 95}]},
        ctx,
    )
    assert ctx.vessels["TOP"].components["product"].mass_kg == pytest.approx(0.95)
    assert ctx.vessels["X"].components["product"].mass_kg == pytest.approx(0.05)


def test_extract_unlisted_follows_unspecified_and_conserves():
    ctx = ctx_mix({"product": 1.0, "water": 1.0})
    before = total_system_mass(ctx)
    extract.solve(
        {"id": "e", "type": "Extract", "equipmentId": "X", "topLayerEquipmentId": "TOP",
         "separations": [{"materialId": "product", "goesTo": "Top", "pct": 100}],
         "unspecifiedGoesTo": "Bottom"},
        ctx,
    )
    assert "product" not in ctx.vessels["X"].components
    assert ctx.vessels["X"].components["water"].mass_kg == pytest.approx(1.0)
    assert total_system_mass(ctx) == pytest.approx(before)


def test_decant_moves_water_to_top():
    ctx = ctx_mix({"water": 1.0, "oil": 1.0})
    decant.solve(
        {"id": "d", "type": "Decant", "equipmentId": "X", "topLayerEquipmentId": "TOP",
         "separations": [{"materialId": "water", "goesTo": "Top", "pct": 100}],
         "decantTimeMin": 15},
        ctx,
    )
    assert ctx.vessels["TOP"].components["water"].mass_kg == pytest.approx(1.0)
    # Unlisted oil stays in the bottom.
    assert ctx.vessels["X"].components["oil"].mass_kg == pytest.approx(1.0)


def test_decant_duration():
    ctx = ctx_mix({"water": 1.0})
    result = decant.solve(
        {"id": "d", "type": "Decant", "equipmentId": "X", "decantTimeMin": 15, "separations": []},
        ctx,
    )
    assert result.duration_min == 15
