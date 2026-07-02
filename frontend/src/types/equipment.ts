/**
 * Equipment & facility domain types.
 *
 * Field names are load-bearing: the backend and the `.bpd` file format depend on them.
 */

export const EQUIPMENT_CLASSES = [
  'Reactor',
  'Filter',
  'Centrifuge',
  'Dryer',
  'Crystallizer',
  'Distillation Column',
  'Extraction Column',
  'Fermenter',
  'Storage Tank',
  'Buffer Tank',
  'Heat Exchanger',
  'Condenser',
  'Vacuum Pump',
  'Transfer Pump',
  'Centrifugal Pump',
  'Filter Dryer',
  'Fluid Bed Dryer',
  'Freeze Dryer',
  'Granulator',
  'Evaporator',
  'Mixer',
  'Mill',
  'Column',
  'Other',
] as const

export type EquipmentClass = (typeof EQUIPMENT_CLASSES)[number]

export interface UtilityConnection {
  utilityId: string
  location: 'Jacket' | 'Coil' | 'Other'
}

export interface Utility {
  id: string
  name: string
  type: 'Heating' | 'Cooling' | 'Other'
  supplyTemperature: number
  returnTemperature?: number
}

export interface EquipmentUnit {
  id: string
  name: string
  tag: string
  equipmentClass: EquipmentClass
  totalVolume: number
  /** Fraction of total volume usable as working volume. Defaults to 0.8. */
  workingVolumeFraction: number
  maxFillVolume?: number
  materialOfConstruction: string
  manufacturer?: string
  model?: string
  utilities: UtilityConnection[]
  notes: string
}

export interface Facility {
  id: string
  name: string
  location?: string
  equipmentUnits: EquipmentUnit[]
  notes: string
}
