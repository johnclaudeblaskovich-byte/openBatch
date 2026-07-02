/**
 * Top-level Project type and the UOM set.
 *
 * The entire project serializes to a single `.bpd` JSON file. Do not rename fields.
 */

import type { Facility, Utility } from './equipment'
import type { Material } from './material'
import type { ReactionDataSet } from './reaction'
import type { BpProcess } from './hierarchy'
import type { ProductionPlan } from './results'

export interface UomSet {
  mass: 'kg' | 'g' | 'lb'
  volume: 'L' | 'mL' | 'm3' | 'gal'
  temperature: 'C' | 'K' | 'F'
  time: 'min' | 'hr' | 's'
  pressure: 'kPa' | 'bar' | 'atm' | 'psi'
  energy: 'J' | 'kJ' | 'kcal' | 'BTU'
}

export interface Project {
  id: string
  name: string
  description: string
  company: string
  author: string
  createdAt: string
  modifiedAt: string
  uom: UomSet
  facilities: Facility[]
  utilities: Utility[]
  materials: Material[]
  reactions: ReactionDataSet[]
  processes: BpProcess[]
  productionPlans: ProductionPlan[]
}
