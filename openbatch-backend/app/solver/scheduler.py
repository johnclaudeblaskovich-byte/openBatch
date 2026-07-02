"""Just-In-Time scheduler — assigns start/end times to operations.

Operations are sequential within a unit procedure; unit procedures run in parallel unless they
share equipment; start-after constraints are honored; equipment is never double-booked.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from .util import get_equipment_ids


@dataclass
class ScheduleEvent:
    operation_id: str
    start_min: float
    end_min: float
    duration_min: float
    equipment_ids: list[str] = field(default_factory=list)


def schedule_jit(
    unit_procedures: list[dict],
    operation_results: dict[str, float],
) -> list[ScheduleEvent]:
    """Assign times. ``operation_results`` maps op id -> duration (minutes)."""
    events: list[ScheduleEvent] = []
    equip_free_at: dict[str, float] = {}
    op_end_at: dict[str, float] = {}

    all_ops = [
        (u, o, op)
        for u, up in enumerate(unit_procedures)
        for o, op in enumerate(up.get("operations", []))
    ]

    for u, o, op in all_ops:
        op_id = op["id"]
        equip_ids = get_equipment_ids(op)
        duration = operation_results.get(op_id, 0.0)

        # Sequential within the unit procedure.
        earliest = 0.0
        if o > 0:
            prev_id = unit_procedures[u]["operations"][o - 1]["id"]
            earliest = op_end_at.get(prev_id, 0.0)

        # Start-after constraints.
        for c in op.get("startAfterConstraints", []):
            earliest = max(
                earliest, op_end_at.get(c["targetOperationId"], 0.0) + c.get("delayMin", 0.0)
            )

        # Equipment availability (no double-booking).
        for e in equip_ids:
            earliest = max(earliest, equip_free_at.get(e, 0.0))

        start = earliest
        end = start + duration
        op_end_at[op_id] = end
        for e in equip_ids:
            equip_free_at[e] = end
        events.append(ScheduleEvent(op_id, start, end, duration, equip_ids))

    return events


def batch_time(events: list[ScheduleEvent]) -> float:
    return max((e.end_min for e in events), default=0.0)
