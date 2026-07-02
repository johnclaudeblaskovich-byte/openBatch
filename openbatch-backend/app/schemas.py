"""Pydantic models mirroring the core Project hierarchy, sufficient to validate a .bpd project.

These are a *validation* view of the schema — the solver still operates on raw dicts. Models allow
extra fields so unknown/forward-compatible keys survive a normalize round-trip. Operations are a
discriminated union keyed by ``type``; unrecognised types fall through to ``GenericOperation``.
"""

from __future__ import annotations

from typing import Annotated, Any, Literal, Union

from pydantic import BaseModel, ConfigDict, Discriminator, Field, Tag


class _Base(BaseModel):
    model_config = ConfigDict(extra="allow")


# ---------------------------------------------------------------------------
# Operations
# ---------------------------------------------------------------------------


class ChargeMaterial(_Base):
    materialId: str
    amount: float = 0.0
    amountUnit: str = "kg"


class _Op(_Base):
    id: str
    displayName: str = ""
    isEnabled: bool = True


class ChargeOp(_Op):
    type: Literal["Charge"] = "Charge"
    equipmentId: str | None = None
    materials: list[ChargeMaterial] = Field(default_factory=list)


class TransferOp(_Op):
    type: Literal["Transfer"] = "Transfer"
    fromEquipmentId: str | None = None
    toEquipmentId: str | None = None


class PressureTransferOp(_Op):
    type: Literal["PressureTransfer"] = "PressureTransfer"
    fromEquipmentId: str | None = None
    toEquipmentId: str | None = None


class ReactOp(_Op):
    type: Literal["React"] = "React"
    equipmentId: str | None = None
    reactionDataSetId: str | None = None


class YieldReactOp(_Op):
    type: Literal["YieldReact"] = "YieldReact"
    equipmentId: str | None = None
    reactionDataSetId: str | None = None


class CrystallizeOp(_Op):
    type: Literal["Crystallize"] = "Crystallize"
    equipmentId: str | None = None


class DistillOp(_Op):
    type: Literal["Distill"] = "Distill"
    equipmentId: str | None = None
    distillateEquipmentId: str | None = None


class FilterOp(_Op):
    type: Literal["Filter"] = "Filter"
    fromEquipmentId: str | None = None
    filterEquipmentId: str | None = None
    motherLiquorEquipmentId: str | None = None


class WashCakeOp(_Op):
    type: Literal["WashCake"] = "WashCake"
    equipmentId: str | None = None
    solventMaterialId: str | None = None
    washMaterialId: str | None = None


class FilterDryOp(_Op):
    type: Literal["FilterDry"] = "FilterDry"
    filterDryerEquipmentId: str | None = None


class CentrifugeOp(_Op):
    type: Literal["Centrifuge"] = "Centrifuge"
    equipmentId: str | None = None
    motherLiquorEquipmentId: str | None = None


class DryOp(_Op):
    type: Literal["Dry"] = "Dry"
    equipmentId: str | None = None


class HeatOp(_Op):
    type: Literal["Heat"] = "Heat"
    equipmentId: str | None = None


class CoolOp(_Op):
    type: Literal["Cool"] = "Cool"
    equipmentId: str | None = None


class MixOp(_Op):
    type: Literal["Mix"] = "Mix"
    equipmentId: str | None = None


class AgeOp(_Op):
    type: Literal["Age"] = "Age"
    equipmentId: str | None = None


class ExtractOp(_Op):
    type: Literal["Extract"] = "Extract"
    equipmentId: str | None = None
    topLayerEquipmentId: str | None = None
    bottomLayerEquipmentId: str | None = None


class DecantOp(_Op):
    type: Literal["Decant"] = "Decant"
    equipmentId: str | None = None
    topLayerEquipmentId: str | None = None


class ConcentrateOp(_Op):
    type: Literal["Concentrate"] = "Concentrate"
    equipmentId: str | None = None


class FermentOp(_Op):
    type: Literal["Ferment"] = "Ferment"
    equipmentId: str | None = None


class GenericOperation(_Op):
    """Fallback for operation types without a dedicated model (still validated for base fields)."""

    type: str


# Tier-1 operation models keyed by their `type` string.
_OP_MODELS: dict[str, type[_Op]] = {
    "Charge": ChargeOp,
    "Transfer": TransferOp,
    "PressureTransfer": PressureTransferOp,
    "React": ReactOp,
    "YieldReact": YieldReactOp,
    "Crystallize": CrystallizeOp,
    "Distill": DistillOp,
    "Filter": FilterOp,
    "WashCake": WashCakeOp,
    "FilterDry": FilterDryOp,
    "Centrifuge": CentrifugeOp,
    "Dry": DryOp,
    "Heat": HeatOp,
    "Cool": CoolOp,
    "Mix": MixOp,
    "Age": AgeOp,
    "Extract": ExtractOp,
    "Decant": DecantOp,
    "Concentrate": ConcentrateOp,
    "Ferment": FermentOp,
}


def _op_discriminator(value: Any) -> str:
    """Map an operation to its union tag; unknown types → 'Generic'."""
    t = value.get("type") if isinstance(value, dict) else getattr(value, "type", None)
    return t if t in _OP_MODELS else "Generic"


AnyOperation = Annotated[
    Union[
        Annotated[ChargeOp, Tag("Charge")],
        Annotated[TransferOp, Tag("Transfer")],
        Annotated[PressureTransferOp, Tag("PressureTransfer")],
        Annotated[ReactOp, Tag("React")],
        Annotated[YieldReactOp, Tag("YieldReact")],
        Annotated[CrystallizeOp, Tag("Crystallize")],
        Annotated[DistillOp, Tag("Distill")],
        Annotated[FilterOp, Tag("Filter")],
        Annotated[WashCakeOp, Tag("WashCake")],
        Annotated[FilterDryOp, Tag("FilterDry")],
        Annotated[CentrifugeOp, Tag("Centrifuge")],
        Annotated[DryOp, Tag("Dry")],
        Annotated[HeatOp, Tag("Heat")],
        Annotated[CoolOp, Tag("Cool")],
        Annotated[MixOp, Tag("Mix")],
        Annotated[AgeOp, Tag("Age")],
        Annotated[ExtractOp, Tag("Extract")],
        Annotated[DecantOp, Tag("Decant")],
        Annotated[ConcentrateOp, Tag("Concentrate")],
        Annotated[FermentOp, Tag("Ferment")],
        Annotated[GenericOperation, Tag("Generic")],
    ],
    Discriminator(_op_discriminator),
]


# ---------------------------------------------------------------------------
# Hierarchy
# ---------------------------------------------------------------------------


class UnitProcedure(_Base):
    id: str
    name: str = ""
    primaryEquipmentId: str | None = None
    operations: list[AnyOperation] = Field(default_factory=list)


class Step(_Base):
    id: str
    name: str = ""
    facilityId: str | None = None
    unitProcedures: list[UnitProcedure] = Field(default_factory=list)


class BpProcess(_Base):
    id: str
    name: str = ""
    steps: list[Step] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Facilities / materials / reactions / plans
# ---------------------------------------------------------------------------


class EquipmentUnit(_Base):
    id: str
    name: str = ""


class Facility(_Base):
    id: str
    name: str = ""
    equipmentUnits: list[EquipmentUnit] = Field(default_factory=list)


class Material(_Base):
    id: str
    name: str = ""


class ReactionDataSet(_Base):
    id: str
    name: str = ""


class ProductionPlan(_Base):
    id: str
    name: str = ""
    entries: list[dict] = Field(default_factory=list)


class Project(_Base):
    id: str
    name: str = ""
    facilities: list[Facility] = Field(default_factory=list)
    utilities: list[dict] = Field(default_factory=list)
    materials: list[Material] = Field(default_factory=list)
    reactions: list[ReactionDataSet] = Field(default_factory=list)
    processes: list[BpProcess] = Field(default_factory=list)
    productionPlans: list[ProductionPlan] = Field(default_factory=list)
