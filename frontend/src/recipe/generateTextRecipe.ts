import type { AnyOperation, Project, Step } from '@/types'
import { displayDurationMin } from '@/lib/opDuration'

interface Maps {
  matName: (id: string | undefined) => string
  equip: (id: string | undefined) => string
  rxnName: (id: string | undefined) => string
}

function rec(op: AnyOperation): Record<string, unknown> {
  return op as unknown as Record<string, unknown>
}

function describeOperation(op: AnyOperation, m: Maps): string {
  const o = rec(op)
  const eq = (k: string) => m.equip(o[k] as string | undefined)
  const num = (k: string) => o[k] as number | undefined
  switch (op.type) {
    case 'Charge': {
      const mats = ((o.materials as Array<Record<string, unknown>>) ?? [])
        .map((x) => `${m.matName(x.materialId as string)} ${x.amount} ${x.amountUnit}`)
        .join(', ')
      return `Charge ${mats} to ${eq('equipmentId')}`
    }
    case 'Transfer':
      return `Transfer from ${eq('fromEquipmentId')} to ${eq('toEquipmentId')}${
        num('transferPct') != null ? ` (${num('transferPct')}%)` : ''
      }`
    case 'PressureTransfer':
      return `Pressure-transfer from ${eq('fromEquipmentId')} to ${eq('toEquipmentId')}`
    case 'React':
      return `React (${m.rxnName(o.reactionDataSetId as string)}) in ${eq('equipmentId')} for ${
        num('reactionTimeMin') ?? '?'
      } min${num('finalTemperatureC') != null ? ` at ${num('finalTemperatureC')}°C` : ''}`
    case 'YieldReact':
      return `Yield-react (${m.rxnName(o.reactionDataSetId as string)}) in ${eq('equipmentId')}`
    case 'Crystallize':
      return `Crystallize in ${eq('equipmentId')}${
        num('targetTemperatureC') != null ? ` to ${num('targetTemperatureC')}°C` : ''
      }`
    case 'Distill':
      return `Distill in ${eq('equipmentId')} → distillate ${eq('distillateEquipmentId')}`
    case 'Filter':
      return `Filter ${eq('fromEquipmentId')} → cake ${eq('filterEquipmentId')}, mother liquor ${eq('motherLiquorEquipmentId')}`
    case 'WashCake':
      return `Wash cake with ${m.matName((o.solventMaterialId ?? o.washMaterialId) as string)}`
    case 'FilterDry':
      return `Filter-dry in ${eq('filterDryerEquipmentId')}`
    case 'Centrifuge':
      return `Centrifuge ${eq('equipmentId')} → mother liquor ${eq('motherLiquorEquipmentId')}`
    case 'Dry':
      return `Dry ${eq('equipmentId')}${
        num('finalMoisturePct') != null ? ` to ${num('finalMoisturePct')}% moisture` : ''
      }`
    case 'Heat':
      return `Heat ${eq('equipmentId')} to ${num('targetTemperatureC') ?? '?'}°C`
    case 'Cool':
      return `Cool ${eq('equipmentId')} to ${num('targetTemperatureC') ?? '?'}°C`
    case 'Mix':
      return `Mix ${eq('equipmentId')} for ${num('mixingTimeMin') ?? '?'} min`
    case 'Age':
      return `Age ${eq('equipmentId')} for ${num('agingTimeMin') ?? '?'} min`
    case 'Extract':
      return `Extract in ${eq('equipmentId')} → top layer ${eq('topLayerEquipmentId')}`
    case 'Decant':
      return `Decant ${eq('equipmentId')} → top layer ${eq('topLayerEquipmentId')}`
    case 'Concentrate':
      return `Concentrate ${eq('equipmentId')}${
        num('removalPct') != null ? ` (remove ${num('removalPct')}% liquid)` : ''
      }`
    case 'Ferment':
      return `Ferment in ${eq('equipmentId')} for ${num('fermentationTimeMin') ?? '?'} min`
    default:
      return (o.displayName as string) ?? 'Operation'
  }
}

/**
 * Render a Step's recipe as deterministic, mono-friendly numbered text
 * (`1` = unit procedure, `n.m` = operation). Pure — no React, no DOM.
 */
export function generateTextRecipe(step: Step, project: Project): string {
  const equipName = new Map<string, string>()
  for (const f of project.facilities) for (const e of f.equipmentUnits) equipName.set(e.id, e.name)
  const matName = new Map<string, string>()
  for (const mm of project.materials) matName.set(mm.id, mm.name)
  const rxnName = new Map<string, string>()
  for (const r of project.reactions) rxnName.set(r.id, r.name)

  const maps: Maps = {
    matName: (id) => (id ? (matName.get(id) ?? id) : '—'),
    equip: (id) => (id ? (equipName.get(id) ?? id) : '—'),
    rxnName: (id) => (id ? (rxnName.get(id) ?? id) : '—'),
  }

  const lines: string[] = []
  lines.push(`Recipe — ${step.name}`)
  lines.push('='.repeat(Math.max(10, step.name.length + 9)))
  step.unitProcedures.forEach((up, ui) => {
    const eq = up.primaryEquipmentId ? maps.equip(up.primaryEquipmentId) : ''
    lines.push('')
    lines.push(`${ui + 1}. ${up.name}${eq ? ` — ${eq}` : ''}`)
    up.operations.forEach((op, oi) => {
      const dur = displayDurationMin(op, { defaultChargeRateKgPerMin: 100 })
      const durStr = dur != null ? ` (~${dur} min)` : ''
      lines.push(`   ${ui + 1}.${oi + 1} ${describeOperation(op, maps)}${durStr}`)
    })
  })
  return lines.join('\n')
}
