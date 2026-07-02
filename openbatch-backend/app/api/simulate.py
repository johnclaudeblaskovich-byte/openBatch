"""Simulation REST + WebSocket endpoints.

`POST /api/simulate` (single step) and `POST /api/simulate-campaign` (production plan) register a
job; `WS /ws/solve/{job_id}` runs it off the event loop and streams status -> progress -> complete.
"""

from __future__ import annotations

import asyncio
import uuid

from fastapi import APIRouter, Body, WebSocket
from pydantic import BaseModel

from app.solver.campaign import simulate_campaign
from app.solver.engine import solve_step

router = APIRouter(tags=["simulate"])

# In-memory job registry.
JOBS: dict[str, dict] = {}


class SimulateRequest(BaseModel):
    project: dict
    stepId: str


class CampaignRequest(BaseModel):
    project: dict
    planId: str


@router.post("/api/simulate")
def start_simulation(req: SimulateRequest = Body(...)) -> dict:
    job_id = str(uuid.uuid4())
    JOBS[job_id] = {"kind": "step", "status": "pending", "project": req.project, "stepId": req.stepId}
    return {"job_id": job_id}


@router.post("/api/simulate-campaign")
def start_campaign(req: CampaignRequest = Body(...)) -> dict:
    job_id = str(uuid.uuid4())
    JOBS[job_id] = {
        "kind": "campaign",
        "status": "pending",
        "project": req.project,
        "planId": req.planId,
    }
    return {"job_id": job_id}


def _find_step(project: dict, step_id: str) -> dict | None:
    for proc in project.get("processes", []):
        for step in proc.get("steps", []):
            if step.get("id") == step_id:
                return step
    return None


def _find_plan(project: dict, plan_id: str) -> dict | None:
    for plan in project.get("productionPlans", []):
        if plan.get("id") == plan_id:
            return plan
    return None


@router.websocket("/ws/solve/{job_id}")
async def solve_socket(websocket: WebSocket, job_id: str) -> None:
    await websocket.accept()
    job = JOBS.get(job_id)
    if job is None:
        await websocket.send_json({"type": "error", "message": "unknown job"})
        await websocket.close()
        return

    project = job["project"]
    if job.get("kind") == "campaign":
        target = _find_plan(project, job["planId"])
        if target is None:
            job["status"] = "error"
            await websocket.send_json({"type": "error", "message": f"unknown plan {job['planId']}"})
            await websocket.close()
            return
    else:
        target = _find_step(project, job["stepId"])
        if target is None:
            job["status"] = "error"
            await websocket.send_json({"type": "error", "message": f"unknown step {job['stepId']}"})
            await websocket.close()
            return

    job["status"] = "running"
    await websocket.send_json({"type": "status", "status": "running"})

    loop = asyncio.get_running_loop()
    queue: asyncio.Queue[dict] = asyncio.Queue()

    def on_progress(done: int, total: int, label: str) -> None:
        loop.call_soon_threadsafe(
            queue.put_nowait,
            {"type": "progress", "done": done, "total": total, "opId": label},
        )

    if job.get("kind") == "campaign":
        task = asyncio.create_task(asyncio.to_thread(simulate_campaign, target, project, on_progress))
    else:
        task = asyncio.create_task(asyncio.to_thread(solve_step, project, target, on_progress))

    try:
        while not task.done() or not queue.empty():
            try:
                msg = await asyncio.wait_for(queue.get(), timeout=0.05)
                await websocket.send_json(msg)
            except asyncio.TimeoutError:
                continue
        result = await task
        job["status"] = "complete"
        job["result"] = result
        await websocket.send_json({"type": "complete", "result": result})
    except Exception as exc:  # noqa: BLE001 — surface any solver error to the client
        job["status"] = "error"
        await websocket.send_json({"type": "error", "message": str(exc)})
    finally:
        await websocket.close()
