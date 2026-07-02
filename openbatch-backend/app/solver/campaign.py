"""Campaign simulation — runs a Production Plan by solving each entry's Step N times, threading
equipment availability across batches. Delegates all balance math to the single-Step solver; this
module only schedules and aggregates.
"""

from __future__ import annotations

from collections.abc import Callable
from datetime import datetime, timezone

from .engine import solve_step

CampaignProgress = Callable[[int, int, str], None]


def _resolve_step(project: dict, entry: dict) -> dict | None:
    for proc in project.get("processes", []):
        if proc.get("id") != entry.get("processId"):
            continue
        for step in proc.get("steps", []):
            if step.get("id") == entry.get("stepId"):
                return step
    return None


def simulate_campaign(
    plan: dict,
    project: dict,
    on_progress: CampaignProgress | None = None,
) -> dict:
    """Run the plan back-to-back and return a CampaignResult dict.

    Threading: an ``equip_free_at`` map is kept ACROSS batches so a batch starts no earlier than the
    shared equipment frees from the previous batch (no overlapping occupancy).
    """
    equip_free_at: dict[str, float] = {}
    batch_results: list[dict] = []
    earliest = plan.get("earliestStartMin") or 0.0
    total_batches = sum(int(e.get("numberOfBatches", 0)) for e in plan.get("entries", []))
    total_time = 0.0
    done = 0

    for entry in plan.get("entries", []):
        step = _resolve_step(project, entry)
        if step is None:
            continue
        for _ in range(int(entry.get("numberOfBatches", 0))):
            result = solve_step(project, step)
            batch_time = result.get("batchTimeMin", 0.0)

            batch_equipment: set[str] = set()
            for opr in result.get("operationResults", []):
                batch_equipment.update(opr.get("equipmentIds", []))

            offset = max([earliest, *(equip_free_at.get(e, 0.0) for e in batch_equipment)])
            batch_end = offset + batch_time
            for e in batch_equipment:
                equip_free_at[e] = batch_end
            total_time = max(total_time, batch_end)

            done += 1
            batch_results.append(
                {
                    **result,
                    "batchIndex": done,
                    "batchStartMin": offset,
                    "entryId": entry.get("id"),
                }
            )
            if on_progress:
                on_progress(done, total_batches, f"Batch {done}/{total_batches}")

    # Equipment utilization = busy time / campaign makespan.
    busy: dict[str, float] = {}
    for br in batch_results:
        for opr in br.get("operationResults", []):
            dur = (opr.get("scheduledEndMin") or 0.0) - (opr.get("scheduledStartMin") or 0.0)
            for e in opr.get("equipmentIds", []):
                busy[e] = busy.get(e, 0.0) + dur
    utilization = {e: (busy[e] / total_time if total_time else 0.0) for e in busy}

    return {
        "planId": plan.get("id", ""),
        "totalBatches": total_batches,
        "totalTimeMin": total_time,
        "batchResults": batch_results,
        "equipmentUtilization": utilization,
        "solvedAt": datetime.now(timezone.utc).isoformat(),
    }
