import pytest

from app.solver.ops.filter_dry import FilterDrySolver
from app.solver.state import PhaseType, VesselContents
from tests._helpers import make_ctx, total_system_mass

solver = FilterDrySolver()
MATERIALS = {"solvent": {"defaultPhase": "Liquid", "density": 1000}}


def ctx_slurry():
    ctx = make_ctx(MATERIALS)
    src = VesselContents("SRC")
    src.add_component("sol", 1.0, PhaseType.SOLID)
    src.add_component("ml", 1.0, PhaseType.LIQUID)
    ctx.vessels["SRC"] = src
    return ctx


def op(**kw):
    return {
        "id": "fd", "type": "FilterDry", "filterDryerEquipmentId": "FD",
        "fromEquipmentId": "SRC", "motherLiquorEquipmentId": "ML",
        "spentWashEquipmentId": "SPENT", "condenserEquipmentId": "COND",
        "filterSolidsPct": 100, "cakeMoisturePctAfterFiltration": 20,
        "washes": [
            {"solventMaterialId": "solvent", "amountPerWash": 0.2, "amountUnit": "kg",
             "washType": "Displacement", "washTimeMin": 5}
        ],
        "finalMoisturePct": 1,
        "dryingTemperatureC": 60,
        "filtrationTimeMin": 30, "slurryTransferTimeMin": 5, "dryingTimeMin": 120,
        **kw,
    }


def test_isolates_washes_and_dries_in_one_vessel():
    ctx = ctx_slurry()
    solver.solve(op(), ctx)
    fd = ctx.vessels["FD"]
    # All solids ended in the filter-dryer.
    assert fd.components["sol"].mass_kg == pytest.approx(1.0)
    # Dried to 1% of solid mass = 0.01 kg residual liquid total.
    residual = sum(c.mass_kg for c in fd.components.values() if c.phase is PhaseType.LIQUID)
    assert residual == pytest.approx(0.01, abs=1e-6)
    assert fd.temperature_c == 60


def test_sinks_receive_material():
    ctx = ctx_slurry()
    solver.solve(op(), ctx)
    assert ctx.vessels["ML"].total_mass_kg > 0
    assert ctx.vessels["SPENT"].total_mass_kg > 0
    assert ctx.vessels["COND"].total_mass_kg > 0


def test_duration_sums_sub_ops():
    ctx = ctx_slurry()
    result = solver.solve(op(), ctx)
    # 30 filtration + 5 slurry + (5 * 1 wash) + 120 drying
    assert result.duration_min == pytest.approx(160)


def test_mass_conserved_including_solvent():
    ctx = ctx_slurry()
    before = total_system_mass(ctx)
    solver.solve(op(), ctx)
    # One wash added 0.2 kg solvent from inventory.
    assert total_system_mass(ctx) == pytest.approx(before + 0.2)
