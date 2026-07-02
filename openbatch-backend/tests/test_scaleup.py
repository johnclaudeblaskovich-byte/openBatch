import copy

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.solver.engine import build_context
from app.solver.scaleup import ScaleUpMode, apply_scale_factor, compute_scale_factor
from tests._sample import aspirin_project, aspirin_step

client = TestClient(app)


def _ctx_step():
    project = aspirin_project()
    step = aspirin_step()
    return build_context(project, step), step


def test_target_batch_size_factor():
    ctx, step = _ctx_step()
    # Current output = 100 (SA) + 80 (AAN) = 180 kg charged.
    factor = compute_scale_factor(
        ScaleUpMode.TARGET_BATCH_SIZE, {"targetMassKg": 360}, step, ctx
    )
    assert factor == pytest.approx(2.0)


def test_multiple_of_current():
    ctx, step = _ctx_step()
    assert compute_scale_factor(ScaleUpMode.MULTIPLE_OF_CURRENT, {"multiplier": 3.5}, step, ctx) == 3.5


def test_return_to_original_reciprocal():
    ctx, step = _ctx_step()
    factor = compute_scale_factor(
        ScaleUpMode.RETURN_TO_ORIGINAL, {"currentScaleFactor": 2.0}, step, ctx
    )
    assert factor == pytest.approx(0.5)


def test_max_batch_modes_return_positive():
    ctx, step = _ctx_step()
    f1 = compute_scale_factor(ScaleUpMode.MAX_BATCH_CURRENT_EQUIPMENT, {}, step, ctx)
    f2 = compute_scale_factor(
        ScaleUpMode.MAX_BATCH_SPECIFIC_EQUIPMENT, {"equipmentId": "R1"}, step, ctx
    )
    assert f1 > 0 and f2 > 0


def test_apply_scales_charges_only_and_no_mutation():
    _, step = _ctx_step()
    original = copy.deepcopy(step)
    scaled = apply_scale_factor(2.0, step)
    # Input not mutated.
    assert step == original
    # Charge amounts doubled.
    charge = scaled["unitProcedures"][0]["operations"][0]
    assert charge["materials"][0]["amount"] == pytest.approx(200)
    # Non-charge fields unchanged (React reactionTimeMin).
    react = scaled["unitProcedures"][0]["operations"][2]
    assert react["reactionTimeMin"] == 60


def test_preview_endpoint():
    resp = client.post(
        "/scaleup/preview",
        json={
            "project": aspirin_project(),
            "stepId": "step-1",
            "mode": "TargetBatchSize",
            "params": {"targetMassKg": 360},
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["factor"] == pytest.approx(2.0)
    assert body["predictedOutputKg"] == pytest.approx(360)


def test_apply_endpoint_returns_scaled_step():
    resp = client.post(
        "/scaleup/apply",
        json={
            "project": aspirin_project(),
            "stepId": "step-1",
            "mode": "MultipleOfCurrent",
            "params": {"multiplier": 2.0},
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    charge = body["scaledStep"]["unitProcedures"][0]["operations"][0]
    assert charge["materials"][0]["amount"] == pytest.approx(200)
