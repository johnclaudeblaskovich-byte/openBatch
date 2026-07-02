import { describe, it, expect } from 'vitest'
import type { Project } from '@/types'
import type { StepResultView } from '@/components/results/resultTypes'
import {
  materialBalanceToExport,
  streamTableToExport,
  toCSV,
  type ExportTable,
} from './exportTables'

const project = {
  materials: [
    { id: 'm1', name: 'Water' },
    { id: 'm2', name: 'Acid' },
  ],
  facilities: [{ id: 'f1', equipmentUnits: [{ id: 'e1', name: 'Reactor-1' }] }],
  reactions: [],
} as unknown as Project

const result = {
  stepId: 's1',
  operationResults: [{ operationId: 'op1', operationName: 'Charge' }],
  streams: [
    {
      id: 'st1',
      name: 'S1',
      sourceOperationId: 'op1',
      destinationEquipmentId: 'e1',
      totalMassKg: 100,
      temperatureC: 25,
      pressureKpa: 101,
      components: [
        { materialId: 'm1', massKg: 60, massFraction: 0.6 },
        { materialId: 'm2', massKg: 40, massFraction: 0.4 },
      ],
    },
  ],
  equipmentContents: [],
  finalEquipmentContents: [],
  materialBalance: [
    { operationId: 'op1', operationName: 'Charge', massInKg: 100, massOutKg: 100, accumulationKg: 0, discrepancyPct: 0 },
  ],
  batchTimeMin: 0,
  cycleTimeMin: 0,
  warnings: [],
  solvedAt: '',
} as unknown as StepResultView

describe('exportTables', () => {
  it('builds a stream table with resolved names and per-material columns', () => {
    const t = streamTableToExport(result, project)
    expect(t.columns).toEqual([
      'Stream',
      'From',
      'To',
      'Total (kg)',
      'Temp (°C)',
      'Pressure (kPa)',
      'Acid (kg)',
      'Acid (frac)',
      'Water (kg)',
      'Water (frac)',
    ])
    expect(t.rows).toHaveLength(1)
    // Names resolved, not ids.
    expect(t.rows[0].slice(0, 3)).toEqual(['S1', 'Charge', 'Reactor-1'])
    expect(t.rows[0]).toContain(100)
  })

  it('builds a material balance with a trailing total row', () => {
    const t = materialBalanceToExport(result, project)
    expect(t.rows[t.rows.length - 1][0]).toBe('Total')
  })

  it('serializes CSV with a header row and quotes special characters', () => {
    const table: ExportTable = {
      name: 'x',
      columns: ['a', 'b'],
      rows: [
        ['plain', 1],
        ['has,comma', 2],
        ['has"quote', null],
      ],
    }
    const csv = toCSV(table)
    const lines = csv.split('\r\n')
    expect(lines[0]).toBe('a,b')
    expect(lines[1]).toBe('plain,1')
    expect(lines[2]).toBe('"has,comma",2')
    expect(lines[3]).toBe('"has""quote",')
  })
})
