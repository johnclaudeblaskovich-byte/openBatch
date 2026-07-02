"""A backend-shaped sample project (operations use the field names the solvers read)."""

from __future__ import annotations


def aspirin_project() -> dict:
    return {
        "id": "proj-aspirin",
        "name": "Aspirin Synthesis",
        "facilities": [
            {
                "id": "fac-1",
                "name": "Pilot Plant",
                "equipmentUnits": [
                    {"id": "R1", "tag": "R-101", "totalVolume": 1.0, "workingVolumeFraction": 0.8},
                    {"id": "F1", "tag": "F-101", "totalVolume": 0.5, "workingVolumeFraction": 0.8},
                ],
            }
        ],
        "materials": [
            {"id": "salicylic", "name": "SALICYLIC-ACID", "defaultPhase": "Solid",
             "molecularWeight": 138.12, "density": 1443},
            {"id": "anhydride", "name": "ACETIC-ANHYDRIDE", "defaultPhase": "Liquid",
             "molecularWeight": 102.09, "density": 1080},
            {"id": "aspirin", "name": "ASPIRIN", "defaultPhase": "Solid",
             "molecularWeight": 180.16, "density": 1400},
            {"id": "acetic", "name": "ACETIC-ACID", "defaultPhase": "Liquid",
             "molecularWeight": 60.05, "density": 1049},
        ],
        "reactions": [
            {
                "id": "rxn-aspirin",
                "name": "Aspirin Synthesis",
                "reactions": [
                    {
                        "id": "rxn-1",
                        "keyComponentId": "salicylic",
                        "conversionPct": 95,
                        "heatOfReaction": -50000,
                        "reactants": [
                            {"materialId": "salicylic", "stoichiometricCoeff": 1, "phase": "Solid"},
                            {"materialId": "anhydride", "stoichiometricCoeff": 1, "phase": "Liquid"},
                        ],
                        "products": [
                            {"materialId": "aspirin", "stoichiometricCoeff": 1, "phase": "Solid"},
                            {"materialId": "acetic", "stoichiometricCoeff": 1, "phase": "Liquid"},
                        ],
                    }
                ],
            }
        ],
        "processes": [
            {
                "id": "proc-1",
                "name": "Aspirin Synthesis",
                "steps": [aspirin_step()],
            }
        ],
        "productionPlans": [],
    }


def aspirin_step() -> dict:
    return {
        "id": "step-1",
        "name": "R&D Scale",
        "facilityId": "fac-1",
        "unitProcedures": [
            {
                "id": "up-reaction",
                "name": "Reaction",
                "primaryEquipmentId": "R1",
                "operations": [
                    {
                        "id": "op-charge-sa", "type": "Charge", "displayName": "Charge SA",
                        "isEnabled": True, "equipmentId": "R1",
                        "materials": [{"materialId": "salicylic", "amount": 100, "amountUnit": "kg"}],
                        "chargeTimeMin": 15,
                    },
                    {
                        "id": "op-charge-aan", "type": "Charge", "displayName": "Charge AAN",
                        "isEnabled": True, "equipmentId": "R1",
                        "materials": [{"materialId": "anhydride", "amount": 80, "amountUnit": "kg"}],
                        "chargeTimeMin": 10,
                    },
                    {
                        "id": "op-react", "type": "React", "displayName": "React",
                        "isEnabled": True, "equipmentId": "R1",
                        "reactionDataSetId": "rxn-aspirin", "reactionTimeMin": 60,
                    },
                ],
            },
            {
                "id": "up-filt",
                "name": "Filtration",
                "primaryEquipmentId": "F1",
                "operations": [
                    {
                        "id": "op-filter", "type": "Filter", "displayName": "Filter",
                        "isEnabled": True, "fromEquipmentId": "R1", "filterEquipmentId": "F1",
                        "motherLiquorEquipmentId": "ML1",
                        "filterSolidsPct": 100, "cakeMoisturePct": 10, "filtrationTimeMin": 30,
                    },
                ],
            },
        ],
    }
