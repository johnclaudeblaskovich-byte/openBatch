"""Operation solver contract: the abstract base and the result object solvers return."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field

from .state import SimulationContext


@dataclass
class OperationResult:
    operation_id: str = ""
    duration_min: float = 0.0
    equipment_ids: list[str] = field(default_factory=list)
    output_streams: list[dict] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


class OperationSolver(ABC):
    """Base class every operation solver implements; the solve loop dispatches on ``op['type']``."""

    @abstractmethod
    def validate(self, op: dict, ctx: SimulationContext) -> list[str]:
        """Return a list of human-readable validation errors (empty when valid)."""

    @abstractmethod
    def solve(self, op: dict, ctx: SimulationContext) -> OperationResult:
        """Mutate the context's vessels/streams and return the operation result."""

    def get_duration_min(self, op: dict) -> float:
        return 0.0
