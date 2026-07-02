from app.solver.state import PhaseType, VesselContents


def test_add_component_accumulates_under_one_key():
    v = VesselContents(equipment_id="R1")
    v.add_component("w", 1.0, PhaseType.LIQUID)
    v.add_component("w", 1.0, PhaseType.LIQUID)
    assert v.total_mass_kg == 2.0
    assert list(v.components.keys()) == ["w"]


def test_remove_more_than_available_returns_available_and_deletes_key():
    v = VesselContents(equipment_id="R1")
    v.add_component("w", 2.0, PhaseType.LIQUID)
    removed = v.remove_component("w", 3.0)
    assert removed == 2.0
    assert "w" not in v.components


def test_empty_vessel_total_is_zero():
    assert VesselContents(equipment_id="R1").total_mass_kg == 0.0


def test_partial_remove_keeps_key():
    v = VesselContents(equipment_id="R1")
    v.add_component("w", 2.0, PhaseType.LIQUID)
    assert v.remove_component("w", 0.5) == 0.5
    assert v.components["w"].mass_kg == 1.5


def test_phase_accepts_string():
    v = VesselContents(equipment_id="R1")
    v.add_component("s", 1.0, "Solid")
    assert v.components["s"].phase is PhaseType.SOLID
