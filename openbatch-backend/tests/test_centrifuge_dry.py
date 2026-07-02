import pytest

from app.solver.ops.centrifuge import CentrifugeSolver
from app.solver.ops.dry import DrySolver
from app.solver.state import PhaseType, VesselContents
from tests._helpers import make_ctx, total_system_mass

centrifuge = CentrifugeSolver()
dry = DrySolver()


def ctx_slurry(solid=1.0, liquid=1.0):
    ctx = make_ctx()
    v = VesselContents("CF")
    v.add_component("sol", solid, PhaseType.SOLID)
    v.add_component("liq", liquid, PhaseType.LIQUID)
    ctx.vessels["CF"] = v
    return ctx


def test_centrifuge_retains_solids_and_moisture():
    ctx = ctx_slurry(solid=1.0, liquid=1.0)
    before = total_system_mass(ctx)
    centrifuge.solve(
        {"id": "c", "type": "Centrifuge", "equipmentId": "CF", "motherLiquorEquipmentId": "ML",
         "filterSolidsPct": 99, "cakeMoisturePct": 5},
        ctx,
    )
    cake = ctx.vessels["CF"]
    assert cake.components["sol"].mass_kg == pytest.approx(0.99)
    assert cake.components["liq"].mass_kg == pytest.approx(0.05)  # 5% of liquid retained
    assert total_system_mass(ctx) == pytest.approx(before)


def test_dry_to_final_moisture():
    ctx = make_ctx()
    v = VesselContents("D")
    v.add_component("sol", 1.0, PhaseType.SOLID)
    v.add_component("water", 0.2, PhaseType.LIQUID)
    ctx.vessels["D"] = v
    before = total_system_mass(ctx)
    dry.solve(
        {"id": "d", "type": "Dry", "equipmentId": "D", "finalMoisturePct": 1,
         "dryingTemperatureC": 50, "evaporatedSolventEquipmentId": "EVAP"},
        ctx,
    )
    assert ctx.vessels["D"].components["water"].mass_kg == pytest.approx(0.01)
    assert ctx.vessels["EVAP"].components["water"].mass_kg == pytest.approx(0.19)
    assert ctx.vessels["D"].temperature_c == 50
    assert total_system_mass(ctx) == pytest.approx(before)
