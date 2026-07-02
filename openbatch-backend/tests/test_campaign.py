from app.solver.campaign import simulate_campaign
from app.solver.engine import solve_step
from tests._sample import aspirin_project, aspirin_step


def _plan(batches: int) -> dict:
    return {
        "id": "plan1",
        "name": "Campaign",
        "entries": [
            {"id": "e1", "processId": "proc-1", "stepId": "step-1", "numberOfBatches": batches}
        ],
    }


def test_campaign_totals_and_batch_count():
    project = aspirin_project()
    single = solve_step(project, aspirin_step())["batchTimeMin"]
    campaign = simulate_campaign(_plan(3), project)
    assert campaign["totalBatches"] == 3
    assert len(campaign["batchResults"]) == 3
    # Shared equipment serializes -> total >= 3x a single batch.
    assert campaign["totalTimeMin"] >= 3 * single - 1e-6


def test_campaign_batches_do_not_overlap():
    campaign = simulate_campaign(_plan(3), aspirin_project())
    starts = [b["batchStartMin"] for b in campaign["batchResults"]]
    # Each batch starts strictly after the previous one began (serialized on shared equipment).
    assert starts == sorted(starts)
    assert starts[1] > starts[0]
    assert starts[2] > starts[1]


def test_campaign_progress_per_batch():
    calls = []
    simulate_campaign(_plan(3), aspirin_project(), on_progress=lambda d, t, label: calls.append((d, t)))
    assert len(calls) == 3
    assert calls[-1] == (3, 3)
