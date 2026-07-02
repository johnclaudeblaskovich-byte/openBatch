"""Unit conversion to the canonical kilogram basis.

All operation amounts are converted to kilograms via :func:`convert_to_kg` before any balance,
using the material's density (for volumes) or molecular weight (for moles).
"""

from __future__ import annotations

_LB_TO_KG = 0.453592
_GAL_TO_L = 3.785411784


def convert_to_kg(amount: float, unit: str, material: dict) -> float:
    """Convert ``amount`` expressed in ``unit`` to kilograms.

    Supported units: kg, g, lb, L, mL, m3 (m³), gal, mol, kmol.
    Volumes use ``material['density']`` (kg/m³, default 1000). Moles use
    ``material['molecularWeight']`` (g/mol). Unknown units raise ``ValueError``.
    """
    density = material.get("density", 1000.0) if material else 1000.0

    if unit == "kg":
        return amount
    if unit == "g":
        return amount / 1000.0
    if unit == "lb":
        return amount * _LB_TO_KG
    if unit == "L":
        # litres -> m³ (/1000) -> kg (× density)
        return amount * density / 1000.0
    if unit == "mL":
        return amount * density / 1_000_000.0
    if unit in ("m3", "m³"):
        return amount * density
    if unit == "gal":
        return amount * _GAL_TO_L * density / 1000.0
    if unit in ("mol", "kmol"):
        mw = (material or {}).get("molecularWeight")
        if mw is None:
            raise ValueError(f"molecularWeight required to convert {unit} to kg")
        # mol: amount × MW (g) / 1000 = kg ;  kmol: amount × MW (kg)
        return amount * mw / 1000.0 if unit == "mol" else amount * mw

    raise ValueError(f"Unknown unit: {unit!r}")
