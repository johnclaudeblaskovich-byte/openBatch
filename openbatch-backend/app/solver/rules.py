"""Implicit Rules validation pass (spec Section 9).

`validate_result(step, result, ctx)` runs after a Step solve and returns a list of structured
warnings — each ``{rule, severity, operationId, message}`` — that the results UI surfaces. The pass
never raises; structural invariants (rules 8/9/10) are checked and reported as errors if ever
violated, but under normal operation they should not fire.
"""

from __future__ import annotations

from typing import Any

from .engine import flatten_operations
from .state import SimulationContext

MASS_BALANCE_TOL_PCT = 0.1
_REACTION_TYPES = {"React", "YieldReact", "ReactDistill"}


def _warning(rule: str, severity: str, operation_id: str | None, message: str) -> dict[str, Any]:
    return {"rule": rule, "severity": severity, "operationId": operation_id, "message": message}


def _step_input_material_ids(step: dict) -> set[str]:
    """Material ids introduced into the step (charges + inventory feeds)."""
    ids: set[str] = set()
    for op in flatten_operations(step):
        for mat in op.get("materials", []) or []:
            if mat.get("materialId"):
                ids.add(mat["materialId"])
        for feed in op.get("continuousFeeds") or op.get("feeds") or []:
            if feed.get("materialId"):
                ids.add(feed["materialId"])
    return ids


def validate_result(step: dict, result: dict, ctx: SimulationContext) -> list[dict]:
    """Return structured Warnings for the solved Step (also stored on result['ruleWarnings'])."""
    warnings: list[dict] = []

    # Rule 1 — mass conservation (>0.1% per operation).
    for row in result.get("materialBalance", []):
        pct = row.get("discrepancyPct", 0.0)
        if abs(pct) > MASS_BALANCE_TOL_PCT:
            warnings.append(
                _warning(
                    "mass_conservation",
                    "warning",
                    row.get("operationId"),
                    f"Mass imbalance of {pct:+.3f}% exceeds ±{MASS_BALANCE_TOL_PCT}% tolerance.",
                )
            )

    # Rule 2 — working volume exceeded (hard violation → error).
    for snap in result.get("equipmentContents", []):
        fill = snap.get("fillPct")
        if fill is not None and fill > 100.0:
            warnings.append(
                _warning(
                    "working_volume",
                    "error",
                    snap.get("afterOperationId"),
                    f"Equipment fill {fill:.1f}% exceeds working volume (100%).",
                )
            )

    # Rule 6 — reaction key component missing from the charged inventory.
    input_ids = _step_input_material_ids(step)
    for op in flatten_operations(step):
        if op.get("type") not in _REACTION_TYPES:
            continue
        rxn_set = ctx.reactions_db.get(op.get("reactionDataSetId", ""))
        if not rxn_set:
            continue
        for sub in rxn_set.get("reactions", []):
            key = sub.get("keyComponentId")
            if key and key not in input_ids:
                warnings.append(
                    _warning(
                        "reaction_key_component",
                        "warning",
                        op.get("id"),
                        f"Reaction key component '{key}' is never charged in this step.",
                    )
                )

    # Rule 9 — operations sequential within a unit procedure (structural invariant).
    for op_result_group in _group_by_up(result):
        prev_end = None
        prev_start = None
        for r in op_result_group:
            start = r.get("scheduledStartMin")
            if prev_start is not None and start is not None and start < prev_start:
                warnings.append(
                    _warning(
                        "sequential_operations",
                        "error",
                        r.get("operationId"),
                        "Operation scheduled before its predecessor within the same unit procedure.",
                    )
                )
            prev_end, prev_start = r.get("scheduledEndMin"), start

    # Rule 10 — a single equipment unit is never occupied by two operations at once.
    warnings.extend(_check_equipment_exclusivity(result))

    result["ruleWarnings"] = warnings
    return warnings


def _group_by_up(result: dict) -> list[list[dict]]:
    groups: dict[str | None, list[dict]] = {}
    for r in result.get("operationResults", []):
        groups.setdefault(r.get("unitProcedureId"), []).append(r)
    return list(groups.values())


def _check_equipment_exclusivity(result: dict) -> list[dict]:
    """Detect overlapping occupancy of the same equipment (rule 10 invariant)."""
    warnings: list[dict] = []
    intervals: dict[str, list[tuple[float, float, str]]] = {}
    for r in result.get("operationResults", []):
        start = r.get("scheduledStartMin")
        end = r.get("scheduledEndMin")
        if start is None or end is None:
            continue
        # Dedupe equipment within one operation — an op that lists the same unit twice must not
        # be treated as overlapping with itself.
        for eq in set(r.get("equipmentIds", [])):
            intervals.setdefault(eq, []).append((start, end, r.get("operationId")))

    for eq, spans in intervals.items():
        spans.sort()
        for (s1, e1, id1), (s2, e2, id2) in zip(spans, spans[1:]):
            if id1 == id2:
                continue  # same operation (defensive) — never self-overlap
            if s2 < e1 - 1e-6:  # overlap beyond rounding noise
                warnings.append(
                    _warning(
                        "equipment_exclusive",
                        "error",
                        id2,
                        f"Equipment '{eq}' is occupied by overlapping operations.",
                    )
                )
    return warnings
