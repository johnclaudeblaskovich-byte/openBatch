"""Consolidated known-value solver checks (P20-02).

These pin down the numeric behaviour called out in the spec: charge mass, stoichiometric
conversion + adiabatic ΔT, filter cake/mother-liquor split, and the Antoine water reference.
"""

import pytest

from app.solver.ops.charge import ChargeSolver
from app.solver.ops.filter import FilterSolver
from app.solver.ops.react import ReactSolver
from app.solver.props import antoine_psat_mmhg
from app.solver.state import PhaseType, VesselContents
from tests._helpers import make_ctx, total_system_mass


def test_charge_adds_exact_mass():
    ctx = make_ctx({"water": {"defaultPhase": "Liquid", "density": 1000}})
    ChargeSolver().solve(
        {
            "id": "c",
            "type": "Charge",
            "equipmentId": "R1",
            "materials": [{"materialId": "water", "amount": 25, "amountUnit": "kg"}],
        },
        ctx,
    )
    assert ctx.vessels["R1"].total_mass_kg == pytest.approx(25.0)


def test_react_stoichiometric_conversion_and_adiabatic_dt():
    materials = {
        "A": {"molecularWeight": 100, "defaultPhase": "Liquid", "heatCapacityLiquid": 2000},
        "B": {"molecularWeight": 100, "defaultPhase": "Liquid", "heatCapacityLiquid": 2000},
    }
    rxn = [
        {
            "keyComponentId": "A",
            "conversionPct": 100,
            "heatOfReaction": -50000,
            "reactants": [{"materialId": "A", "stoichiometricCoeff": 1}],
            "products": [{"materialId": "B", "stoichiometricCoeff": 1, "phase": "Liquid"}],
        }
    ]
    ctx = make_ctx(materials, {"rxn": {"reactions": rxn}})
    v = VesselContents("R1")
    v.add_component("A", 1.0, PhaseType.LIQUID)
    ctx.vessels["R1"] = v
    start_temp = ctx.vessels["R1"].temperature_c

    ReactSolver().solve(
        {
            "id": "r",
            "type": "React",
            "equipmentId": "R1",
            "reactionDataSetId": "rxn",
            "reactionType": "Adiabatic",
        },
        ctx,
    )
    # Full conversion: all A → B (mass conserved, MW equal).
    assert "A" not in ctx.vessels["R1"].components
    assert ctx.vessels["R1"].components["B"].mass_kg == pytest.approx(1.0)
    # Exothermic → temperature rose.
    assert ctx.vessels["R1"].temperature_c > start_temp


def test_filter_solids_to_cake_liquids_to_mother_liquor_with_moisture():
    ctx = make_ctx()
    v = VesselContents("S")
    v.add_component("sol", 1.0, PhaseType.SOLID)
    v.add_component("liq", 1.0, PhaseType.LIQUID)
    ctx.vessels["S"] = v
    before = total_system_mass(ctx)

    FilterSolver().solve(
        {
            "id": "f",
            "type": "Filter",
            "fromEquipmentId": "S",
            "filterEquipmentId": "CAKE",
            "motherLiquorEquipmentId": "ML",
            "filterSolidsPct": 100,
            "cakeMoisturePct": 10,
        },
        ctx,
    )
    assert ctx.vessels["CAKE"].components["sol"].mass_kg == pytest.approx(1.0)
    assert ctx.vessels["CAKE"].components["liq"].mass_kg == pytest.approx(0.1)
    assert ctx.vessels["ML"].components["liq"].mass_kg == pytest.approx(0.9)
    assert total_system_mass(ctx) == pytest.approx(before)  # mass conserved


def test_antoine_water_reference():
    """Water Antoine constants give ~760 mmHg (1 atm) at 100 °C, within 1%."""
    water = {"antoineA": 8.10765, "antoineB": 1750.286, "antoineC": 235.0}
    psat = antoine_psat_mmhg(water, 100.0)
    assert psat == pytest.approx(760.0, rel=0.01)
