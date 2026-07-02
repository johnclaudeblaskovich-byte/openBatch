"""Implicit Rules validation pass (rules 1, 2, 6 + structural invariants)."""

from __future__ import annotations

from app.solver.engine import build_context
from app.solver.rules import validate_result


def _ctx(project: dict, step: dict):
    return build_context(project, step)


def _project_with_reaction() -> dict:
    return {
        "id": "p1",
        "name": "P",
        "facilities": [{"id": "f1", "name": "F", "equipmentUnits": [{"id": "R1"}]}],
        "materials": [{"id": "key-mat", "name": "KEY"}, {"id": "other", "name": "OTHER"}],
        "reactions": [
            {
                "id": "rxn-set",
                "name": "RXN",
                "reactions": [{"id": "r", "keyComponentId": "key-mat", "conversionPct": 90}],
            }
        ],
        "processes": [],
        "productionPlans": [],
    }


def test_rule1_mass_imbalance():
    step = {"id": "s1", "unitProcedures": []}
    result = {
        "materialBalance": [
            {"operationId": "op1", "operationName": "Charge", "discrepancyPct": 5.0},
        ],
        "equipmentContents": [],
        "operationResults": [],
    }
    warnings = validate_result(step, result, _ctx({"materials": [], "reactions": []}, step))
    rule1 = [w for w in warnings if w["rule"] == "mass_conservation"]
    assert len(rule1) == 1
    assert rule1[0]["operationId"] == "op1"
    assert rule1[0]["severity"] == "warning"
    # Attached to the result.
    assert result["ruleWarnings"] == warnings


def test_rule2_working_volume_exceeded():
    step = {"id": "s1", "unitProcedures": []}
    result = {
        "materialBalance": [],
        "equipmentContents": [{"afterOperationId": "op1", "equipmentId": "R1", "fillPct": 120.0}],
        "operationResults": [],
    }
    warnings = validate_result(step, result, _ctx({"materials": [], "reactions": []}, step))
    rule2 = [w for w in warnings if w["rule"] == "working_volume"]
    assert len(rule2) == 1
    assert rule2[0]["severity"] == "error"


def test_rule6_missing_reaction_key_component():
    project = _project_with_reaction()
    # A step that reacts but never charges the reaction's key component.
    step = {
        "id": "s1",
        "unitProcedures": [
            {
                "id": "up1",
                "name": "UP",
                "primaryEquipmentId": "R1",
                "operations": [
                    {
                        "id": "op-charge",
                        "type": "Charge",
                        "equipmentId": "R1",
                        "materials": [{"materialId": "other", "amount": 10, "amountUnit": "kg"}],
                    },
                    {
                        "id": "op-react",
                        "type": "React",
                        "equipmentId": "R1",
                        "reactionDataSetId": "rxn-set",
                    },
                ],
            }
        ],
    }
    result = {"materialBalance": [], "equipmentContents": [], "operationResults": []}
    warnings = validate_result(step, result, _ctx(project, step))
    rule6 = [w for w in warnings if w["rule"] == "reaction_key_component"]
    assert len(rule6) == 1
    assert rule6[0]["operationId"] == "op-react"
    assert "key-mat" in rule6[0]["message"]


def test_duplicate_equipment_in_one_op_is_not_a_self_overlap():
    # An op that lists the same equipment twice (e.g. Filter) must not flag rule 10 against itself.
    step = {"id": "s1", "unitProcedures": []}
    result = {
        "materialBalance": [],
        "equipmentContents": [],
        "operationResults": [
            {
                "operationId": "op-filter",
                "unitProcedureId": "up",
                "equipmentIds": ["eq-filter1", "eq-filter1"],
                "scheduledStartMin": 0,
                "scheduledEndMin": 30,
            },
            {
                "operationId": "op-wash",
                "unitProcedureId": "up",
                "equipmentIds": ["eq-filter1"],
                "scheduledStartMin": 30,
                "scheduledEndMin": 30,
            },
        ],
    }
    warnings = validate_result(step, result, _ctx({"materials": [], "reactions": []}, step))
    assert [w for w in warnings if w["rule"] == "equipment_exclusive"] == []


def test_clean_result_has_no_warnings():
    step = {"id": "s1", "unitProcedures": []}
    result = {
        "materialBalance": [{"operationId": "op1", "operationName": "X", "discrepancyPct": 0.001}],
        "equipmentContents": [{"afterOperationId": "op1", "equipmentId": "R1", "fillPct": 80.0}],
        "operationResults": [],
    }
    warnings = validate_result(step, result, _ctx({"materials": [], "reactions": []}, step))
    assert warnings == []
