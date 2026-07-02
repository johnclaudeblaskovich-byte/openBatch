"""Registry mapping operation ``type`` strings to solver instances.

Solvers in Phases 8–11 register themselves here via the ``@register('Type')`` decorator. Keys
must exactly match the frontend ``OperationType`` string values.
"""

from __future__ import annotations

from collections.abc import Callable

from .base import OperationSolver

OPERATION_SOLVERS: dict[str, OperationSolver] = {}


def register(type_str: str) -> Callable[[type[OperationSolver]], type[OperationSolver]]:
    """Class decorator that instantiates the solver and registers it under ``type_str``."""

    def deco(cls: type[OperationSolver]) -> type[OperationSolver]:
        OPERATION_SOLVERS[type_str] = cls()
        return cls

    return deco


def get_solver(type_str: str) -> OperationSolver:
    solver = OPERATION_SOLVERS.get(type_str)
    if solver is None:
        known = ", ".join(sorted(OPERATION_SOLVERS)) or "(none registered)"
        raise KeyError(f"No solver registered for operation type {type_str!r}. Known types: {known}")
    return solver
