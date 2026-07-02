"""Backend simulation state.

These lightweight dataclasses are the backend's source of truth while a solve runs. They mirror
the frontend domain types but are mutated in place by the operation solvers.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum

# A residual mass below this (kg) is treated as empty and the component key is dropped.
_EPS = 1e-9


class PhaseType(str, Enum):
    LIQUID = "Liquid"
    SOLID = "Solid"
    GAS = "Gas"
    MIXED = "Mixed"


@dataclass
class ComponentMass:
    material_id: str
    mass_kg: float
    phase: PhaseType = PhaseType.LIQUID


@dataclass
class VesselContents:
    equipment_id: str
    components: dict[str, ComponentMass] = field(default_factory=dict)
    temperature_c: float = 25.0
    pressure_kpa: float = 101.325

    @property
    def total_mass_kg(self) -> float:
        return sum(c.mass_kg for c in self.components.values())

    def add_component(
        self,
        mat_id: str,
        mass_kg: float,
        phase: PhaseType | str = PhaseType.LIQUID,
    ) -> None:
        """Accumulate mass onto an existing component, or create it."""
        phase = PhaseType(phase) if not isinstance(phase, PhaseType) else phase
        existing = self.components.get(mat_id)
        if existing is None:
            self.components[mat_id] = ComponentMass(mat_id, mass_kg, phase)
        else:
            existing.mass_kg += mass_kg

    def remove_component(self, mat_id: str, mass_kg: float) -> float:
        """Remove up to the available mass; return the amount actually removed.

        Deletes the component key when the residual mass drops below 1e-9 kg.
        """
        existing = self.components.get(mat_id)
        if existing is None:
            return 0.0
        removed = min(mass_kg, existing.mass_kg)
        existing.mass_kg -= removed
        if existing.mass_kg < _EPS:
            del self.components[mat_id]
        return removed


@dataclass
class SimulationContext:
    project: dict
    step: dict
    vessels: dict[str, VesselContents]
    materials_db: dict[str, dict]
    reactions_db: dict[str, dict]
    schedule_events: list[dict]
    streams: list[dict]
    current_time_min: float = 0.0
