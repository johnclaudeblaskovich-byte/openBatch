"""Physical-property helpers used by the heat and reaction solvers."""

from __future__ import annotations

from .state import PhaseType, VesselContents

_DEFAULT_CP = 4184.0  # J/(kg·K), water
_MMHG_TO_KPA = 0.1333224


def compute_avg_cp(vessel: VesselContents, materials_db: dict[str, dict]) -> float:
    """Mass-weighted average heat capacity (J/(kg·K)) of a vessel's contents.

    Uses ``heatCapacityLiquid`` or ``heatCapacitySolid`` per component phase, defaulting to
    4184 J/(kg·K) when the value is unknown. Returns the default for an empty vessel.
    """
    total = vessel.total_mass_kg
    if total <= 0:
        return _DEFAULT_CP
    weighted = 0.0
    for comp in vessel.components.values():
        material = materials_db.get(comp.material_id, {})
        if comp.phase is PhaseType.SOLID:
            cp = material.get("heatCapacitySolid") or material.get("heatCapacityLiquid")
        else:
            cp = material.get("heatCapacityLiquid")
        weighted += comp.mass_kg * (cp if cp else _DEFAULT_CP)
    return weighted / total


def antoine_psat_mmhg(material: dict, T_c: float) -> float:
    """Antoine vapor pressure in mmHg: ``10 ** (A - B / (C + T_c))``."""
    a = material["antoineA"]
    b = material["antoineB"]
    c = material["antoineC"]
    return 10 ** (a - b / (c + T_c))


def antoine_psat_kpa(material: dict, T_c: float) -> float:
    """Antoine vapor pressure in kPa."""
    return antoine_psat_mmhg(material, T_c) * _MMHG_TO_KPA
