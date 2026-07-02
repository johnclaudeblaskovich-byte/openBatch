import pytest

from app.solver.ops.pressure_transfer import PressureTransferSolver
from app.solver.state import PhaseType, VesselContents
from tests._helpers import make_ctx, total_system_mass

solver = PressureTransferSolver()


def base_ctx():
    ctx = make_ctx()
    src = VesselContents("A")
    src.add_component("w", 4.0, PhaseType.LIQUID)
    ctx.vessels["A"] = src
    return ctx


def test_moves_and_sets_destination_pressure():
    ctx = base_ctx()
    before = total_system_mass(ctx)
    op = {
        "id": "pt", "type": "PressureTransfer", "fromEquipmentId": "A", "toEquipmentId": "B",
        "afterPressureDestKPa": 250.0,
    }
    solver.solve(op, ctx)
    assert ctx.vessels["B"].total_mass_kg == pytest.approx(4.0)
    assert ctx.vessels["B"].pressure_kpa == pytest.approx(250.0)
    assert total_system_mass(ctx) == pytest.approx(before)


def test_duration_includes_pressurization():
    ctx = base_ctx()
    op = {
        "id": "pt", "type": "PressureTransfer", "fromEquipmentId": "A", "toEquipmentId": "B",
        "transferTimeMin": 10, "beforeTransferTimeMin": 5,
    }
    result = solver.solve(op, ctx)
    assert result.duration_min == pytest.approx(15)


def test_vacuum_unit_in_equipment_ids():
    ctx = base_ctx()
    op = {
        "id": "pt", "type": "PressureTransfer", "fromEquipmentId": "A", "toEquipmentId": "B",
        "vacuumUnitId": "VAC1",
    }
    result = solver.solve(op, ctx)
    assert "VAC1" in result.equipment_ids
