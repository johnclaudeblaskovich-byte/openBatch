"""Referential-integrity + discriminated-union validation for /project endpoints."""

from __future__ import annotations

import copy

from fastapi.testclient import TestClient

from app.main import app
from app.schemas import Project
from tests._sample import aspirin_project

client = TestClient(app)


def _valid_project() -> dict:
    """The sample step references ML1; add it so the project is fully referentially clean."""
    p = copy.deepcopy(aspirin_project())
    p["facilities"][0]["equipmentUnits"].append(
        {"id": "ML1", "tag": "ML-101", "totalVolume": 0.5, "workingVolumeFraction": 0.8}
    )
    return p


def test_validate_accepts_clean_project():
    resp = client.post("/project/validate", json={"project": _valid_project()})
    assert resp.status_code == 200
    body = resp.json()
    assert body["valid"] is True
    assert body["errors"] == []


def test_validate_rejects_dangling_material():
    p = _valid_project()
    p["processes"][0]["steps"][0]["unitProcedures"][0]["operations"][0]["materials"][0][
        "materialId"
    ] = "ghost-material"
    resp = client.post("/project/validate", json={"project": p})
    body = resp.json()
    assert body["valid"] is False
    assert any("ghost-material" in e for e in body["errors"])


def test_validate_rejects_dangling_equipment():
    p = _valid_project()
    p["processes"][0]["steps"][0]["unitProcedures"][0]["operations"][0]["equipmentId"] = "ghost-eq"
    resp = client.post("/project/validate", json={"project": p})
    body = resp.json()
    assert body["valid"] is False
    assert any("ghost-eq" in e for e in body["errors"])


def test_validate_does_not_mutate_input():
    p = _valid_project()
    snapshot = copy.deepcopy(p)
    client.post("/project/validate", json={"project": p})
    assert p == snapshot


def test_discriminated_union_parses_each_tier1_type():
    p = Project.model_validate(_valid_project())
    step = p.processes[0].steps[0]
    types = {op.type for up in step.unitProcedures for op in up.operations}
    assert {"Charge", "React", "Filter"} <= types
    # The React op parsed as the ReactOp model (has reactionDataSetId field surfaced).
    react = next(op for up in step.unitProcedures for op in up.operations if op.type == "React")
    assert react.reactionDataSetId == "rxn-aspirin"


def test_normalize_applies_charge_rate_default_without_touching_user_values():
    p = _valid_project()
    # First charge has chargeTimeMin=15 (user-specified) → must NOT get a default rate.
    # Add a charge with neither rate nor time → should get the default.
    ops = p["processes"][0]["steps"][0]["unitProcedures"][0]["operations"]
    ops.append(
        {
            "id": "op-charge-bare",
            "type": "Charge",
            "displayName": "Charge bare",
            "equipmentId": "R1",
            "materials": [{"materialId": "salicylic", "amount": 10, "amountUnit": "kg"}],
        }
    )
    resp = client.post("/project/normalize", json={"project": p})
    out = resp.json()["project"]
    norm_ops = out["processes"][0]["steps"][0]["unitProcedures"][0]["operations"]
    user_charge = next(o for o in norm_ops if o["id"] == "op-charge-sa")
    bare_charge = next(o for o in norm_ops if o["id"] == "op-charge-bare")
    assert "chargeRateKgPerMin" not in user_charge  # user value (chargeTimeMin) untouched
    assert user_charge["chargeTimeMin"] == 15
    assert bare_charge["chargeRateKgPerMin"] == 100.0
