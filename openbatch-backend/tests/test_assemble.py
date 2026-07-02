import pytest

from app.solver.engine import solve_step
from tests._sample import aspirin_project, aspirin_step


def test_aspirin_balance_closes():
    result = solve_step(aspirin_project(), aspirin_step())
    total_pct = (result["totalOutputKg"] - result["totalInputKg"]) / result["totalInputKg"] * 100
    assert abs(total_pct) < 0.1
    # No mass-balance warning for the conserving sample.
    assert not any("Mass balance discrepancy" in w for w in result["warnings"])


def test_material_balance_is_per_operation():
    result = solve_step(aspirin_project(), aspirin_step())
    rows = result["materialBalance"]
    # One row per executed operation, with per-op columns.
    assert len(rows) == 4
    for row in rows:
        assert {"operationName", "massInKg", "massOutKg", "accumulationKg", "discrepancyPct"} <= set(row)
    # The first charge introduces mass and is balanced.
    charge = next(r for r in rows if r["operationName"] == "Charge SA")
    assert charge["massInKg"] > 0
    assert abs(charge["discrepancyPct"]) < 0.1


def test_streams_have_source_and_destination():
    result = solve_step(aspirin_project(), aspirin_step())
    assert result["streams"], "expected at least one movement stream"
    charge_stream = next(
        s for s in result["streams"] if s["sourceOperationId"] == "op-charge-sa"
    )
    assert charge_stream["destinationEquipmentId"] == "R1"


def test_equipment_contents_have_fill():
    result = solve_step(aspirin_project(), aspirin_step())
    snaps = [s for s in result["equipmentContents"] if s["equipmentId"] == "R1"]
    assert snaps
    assert all("fillPct" in s and "totalVolumeM3" in s for s in snaps)


def test_operation_results_have_scheduled_times():
    result = solve_step(aspirin_project(), aspirin_step())
    for r in result["operationResults"]:
        assert r["scheduledStartMin"] is not None
        assert r["scheduledEndMin"] is not None


def test_stream_mass_fractions_sum_to_one():
    result = solve_step(aspirin_project(), aspirin_step())
    for stream in result["streams"]:
        total = sum(c["massFraction"] for c in stream["components"])
        assert total == pytest.approx(1.0, abs=1e-6)


def test_unbalanced_reaction_warns():
    # A (MW 100) -> B (MW 200): mass is created, so the overall balance must flag it.
    project = {
        "id": "p", "name": "p", "facilities": [],
        "materials": [
            {"id": "A", "name": "A", "defaultPhase": "Liquid", "molecularWeight": 100},
            {"id": "B", "name": "B", "defaultPhase": "Liquid", "molecularWeight": 200},
        ],
        "reactions": [
            {"id": "rxn", "name": "rxn", "reactions": [
                {"id": "r1", "keyComponentId": "A", "conversionPct": 100,
                 "reactants": [{"materialId": "A", "stoichiometricCoeff": 1}],
                 "products": [{"materialId": "B", "stoichiometricCoeff": 1, "phase": "Liquid"}]}
            ]}
        ],
        "processes": [], "productionPlans": [],
    }
    step = {
        "id": "s", "name": "s", "facilityId": "", "unitProcedures": [
            {"id": "up", "name": "up", "primaryEquipmentId": "R1", "operations": [
                {"id": "c", "type": "Charge", "isEnabled": True, "equipmentId": "R1",
                 "materials": [{"materialId": "A", "amount": 1, "amountUnit": "kg"}]},
                {"id": "r", "type": "React", "isEnabled": True, "equipmentId": "R1",
                 "reactionDataSetId": "rxn", "reactionTimeMin": 60},
            ]}
        ]
    }
    result = solve_step(project, step)
    assert any("Mass balance discrepancy" in w for w in result["warnings"])
