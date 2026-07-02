import pytest

from app.solver.ops.wash_cake import WashCakeSolver
from app.solver.state import PhaseType, VesselContents
from tests._helpers import make_ctx, total_system_mass

solver = WashCakeSolver()
MATERIALS = {"solvent": {"defaultPhase": "Liquid", "density": 1000}}


def ctx_cake(retained_liquid=1.0, solid=1.0):
    ctx = make_ctx(MATERIALS)
    cake = VesselContents("CAKE")
    cake.add_component("sol", solid, PhaseType.SOLID)
    cake.add_component("ml", retained_liquid, PhaseType.LIQUID)
    ctx.vessels["CAKE"] = cake
    return ctx


def op(**kw):
    return {
        "id": "w", "type": "WashCake", "filterEquipmentId": "CAKE",
        "solventMaterialId": "solvent", "amountPerWash": 0.5, "amountUnit": "kg",
        "spentWashEquipmentId": "SPENT", **kw,
    }


def test_single_displacement_wash():
    ctx = ctx_cake()
    solver.solve(op(washType="Displacement", numberOfWashes=1), ctx)
    assert ctx.vessels["SPENT"].components["ml"].mass_kg == pytest.approx(0.5)


def test_three_washes_triple_duration():
    ctx = ctx_cake()
    result = solver.solve(op(washType="Displacement", numberOfWashes=3, washTimeMin=10), ctx)
    assert result.duration_min == 30


def test_slurry_leaves_mixed_solvent_in_cake():
    ctx = ctx_cake(retained_liquid=1.0)
    before = total_system_mass(ctx)
    solver.solve(op(washType="Slurry", numberOfWashes=1), ctx)
    cake = ctx.vessels["CAKE"]
    # Added 0.5 solvent, removed 0.5 of mixed liquids -> some solvent remains in cake
    assert "solvent" in cake.components
    # Conservation: original + fresh solvent charged from inventory.
    assert total_system_mass(ctx) == pytest.approx(before + 0.5)


def test_mass_conserved():
    ctx = ctx_cake()
    before = total_system_mass(ctx)
    solver.solve(op(washType="Displacement", numberOfWashes=2), ctx)
    # Two washes of 0.5 kg solvent each were charged from inventory.
    assert total_system_mass(ctx) == pytest.approx(before + 1.0)
