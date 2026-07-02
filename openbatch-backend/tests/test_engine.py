import copy

from app.solver.engine import solve_step
from tests._sample import aspirin_project, aspirin_step


def test_solve_step_runs_and_returns_shape():
    result = solve_step(aspirin_project(), aspirin_step())
    assert "operationResults" in result
    assert "streams" in result
    assert "equipmentContents" in result
    assert len(result["operationResults"]) == 4  # 3 reaction ops + 1 filter


def test_disabled_operations_skipped():
    project = aspirin_project()
    step = copy.deepcopy(aspirin_step())
    step["unitProcedures"][0]["operations"][0]["isEnabled"] = False
    result = solve_step(project, step)
    ids = {r["operationId"] for r in result["operationResults"]}
    assert "op-charge-sa" not in ids


def test_react_snapshot_includes_product():
    result = solve_step(aspirin_project(), aspirin_step())
    react_snaps = [
        s for s in result["equipmentContents"]
        if s["afterOperationId"] == "op-react" and s["equipmentId"] == "R1"
    ]
    assert react_snaps
    materials = {c["materialId"] for s in react_snaps for c in s["components"]}
    assert "aspirin" in materials


def test_on_progress_called_per_operation():
    calls = []
    solve_step(aspirin_project(), aspirin_step(), on_progress=lambda d, t, op: calls.append((d, t, op)))
    assert len(calls) == 4
    assert calls[-1][0] == 4 and calls[-1][1] == 4
