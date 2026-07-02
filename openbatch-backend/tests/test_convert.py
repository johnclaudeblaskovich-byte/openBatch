import pytest

from app.solver.convert import convert_to_kg
from app.solver.props import antoine_psat_kpa, antoine_psat_mmhg, compute_avg_cp
from app.solver.state import PhaseType, VesselContents

WATER = {"antoineA": 8.10765, "antoineB": 1750.286, "antoineC": 235.0}


def test_grams():
    assert convert_to_kg(1000, "g", {}) == 1.0


def test_pounds():
    assert convert_to_kg(1, "lb", {}) == pytest.approx(0.453592)


def test_litres_with_density():
    assert convert_to_kg(1, "L", {"density": 800}) == pytest.approx(0.8)


def test_moles():
    assert convert_to_kg(2, "mol", {"molecularWeight": 180}) == pytest.approx(0.36)


def test_kmol():
    assert convert_to_kg(1, "kmol", {"molecularWeight": 180}) == pytest.approx(180.0)


def test_unknown_unit_raises():
    with pytest.raises(ValueError):
        convert_to_kg(1, "furlong", {})


def test_moles_without_mw_raises():
    with pytest.raises(ValueError):
        convert_to_kg(1, "mol", {})


def test_water_antoine_at_100c():
    assert antoine_psat_mmhg(WATER, 100) == pytest.approx(760, rel=0.02)
    assert antoine_psat_kpa(WATER, 100) == pytest.approx(101.3, rel=0.02)


def test_avg_cp_default_for_empty_vessel():
    assert compute_avg_cp(VesselContents("R1"), {}) == 4184.0


def test_avg_cp_mass_weighted():
    v = VesselContents("R1")
    v.add_component("a", 1.0, PhaseType.LIQUID)
    v.add_component("b", 1.0, PhaseType.LIQUID)
    db = {"a": {"heatCapacityLiquid": 2000}, "b": {"heatCapacityLiquid": 4000}}
    assert compute_avg_cp(v, db) == pytest.approx(3000.0)
