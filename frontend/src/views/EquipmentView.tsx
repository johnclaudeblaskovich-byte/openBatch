import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui'
import { useStore, genId } from '@/store'
import { findOperationsUsingEquipment, type EquipmentRef } from '@/lib/equipmentRefs'
import EquipmentForm from '@/components/equipment/EquipmentForm'
import UtilitiesPanel from '@/components/equipment/UtilitiesPanel'
import { cn } from '@/lib/cn'
import type { EquipmentUnit, Facility } from '@/types'

function newFacility(n: number): Facility {
  return { id: genId('fac'), name: `Facility ${n}`, equipmentUnits: [], notes: '' }
}

function newEquipment(): EquipmentUnit {
  return {
    id: genId('eq'),
    name: 'New Equipment',
    tag: 'EQ-001',
    equipmentClass: 'Reactor',
    totalVolume: 1,
    workingVolumeFraction: 0.8,
    materialOfConstruction: '316L SS',
    utilities: [],
    notes: '',
  }
}

interface PendingDelete {
  facilityId: string
  equipment: EquipmentUnit
  refs: EquipmentRef[]
}

export default function EquipmentView() {
  const project = useStore((s) => s.project)
  const upsertFacility = useStore((s) => s.upsertFacility)
  const upsertEquipment = useStore((s) => s.upsertEquipment)
  const deleteEquipment = useStore((s) => s.deleteEquipment)

  const facilities = project?.facilities ?? []
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null)
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingDelete | null>(null)

  const facility = facilities.find((f) => f.id === selectedFacilityId) ?? facilities[0] ?? null
  const selectedEquipment =
    facility?.equipmentUnits.find((e) => e.id === selectedEquipmentId) ?? null

  function addFacility() {
    const f = newFacility(facilities.length + 1)
    upsertFacility(f)
    setSelectedFacilityId(f.id)
  }

  function addEquipment() {
    if (!facility) return
    const e = newEquipment()
    upsertEquipment(facility.id, e)
    setSelectedEquipmentId(e.id)
  }

  function requestDelete(equip: EquipmentUnit) {
    if (!facility || !project) return
    const refs = findOperationsUsingEquipment(equip.id, project)
    if (refs.length > 0) {
      setPending({ facilityId: facility.id, equipment: equip, refs })
    } else {
      deleteEquipment(facility.id, equip.id)
    }
  }

  function confirmDelete() {
    if (!pending) return
    deleteEquipment(pending.facilityId, pending.equipment.id)
    setPending(null)
  }

  return (
    <div className="flex h-full">
      {/* Facilities */}
      <div className="flex w-52 shrink-0 flex-col border-r border-border">
        <div className="border-b border-border p-2">
          <Button size="sm" className="w-full" onClick={addFacility}>
            <Plus className="h-3.5 w-3.5" /> Facility
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-1">
          {facilities.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setSelectedFacilityId(f.id)
                setSelectedEquipmentId(null)
              }}
              className={cn(
                'flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm',
                f.id === facility?.id ? 'bg-primary/10 text-text-primary' : 'hover:bg-background',
              )}
            >
              <span className="truncate">{f.name}</span>
              <span className="shrink-0 text-xs text-muted">{f.equipmentUnits.length}</span>
            </button>
          ))}
          {facilities.length === 0 && (
            <div className="px-2 py-1.5 text-sm text-muted">No facilities.</div>
          )}
        </div>
      </div>

      {/* Equipment grid + form */}
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {!facility ? (
          <div className="text-sm text-muted">Create a facility.</div>
        ) : (
          <div className="space-y-4">
            <UtilitiesPanel />
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">{facility.name}</h2>
              <Button size="sm" variant="outline" onClick={addEquipment}>
                <Plus className="h-3.5 w-3.5" /> Equipment
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tag</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Total Vol (m³)</TableHead>
                  <TableHead>Working frac</TableHead>
                  <TableHead>MOC</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {facility.equipmentUnits.map((e) => (
                  <TableRow
                    key={e.id}
                    onClick={() => setSelectedEquipmentId(e.id)}
                    data-state={e.id === selectedEquipmentId ? 'selected' : undefined}
                    className="cursor-pointer"
                  >
                    <TableCell className="font-medium">{e.tag}</TableCell>
                    <TableCell>{e.equipmentClass}</TableCell>
                    <TableCell>{e.totalVolume}</TableCell>
                    <TableCell>{e.workingVolumeFraction}</TableCell>
                    <TableCell>{e.materialOfConstruction}</TableCell>
                    <TableCell>
                      <button
                        onClick={(ev) => {
                          ev.stopPropagation()
                          requestDelete(e)
                        }}
                        className="text-muted hover:text-error"
                        aria-label={`Delete ${e.tag}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
                {facility.equipmentUnits.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted">
                      No equipment.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {selectedEquipment && (
              <EquipmentForm
                equipment={selectedEquipment}
                onPatch={(patch) =>
                  upsertEquipment(facility.id, { ...selectedEquipment, ...patch })
                }
              />
            )}
          </div>
        )}
      </div>

      {/* Delete guard */}
      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {pending?.equipment.tag}?</DialogTitle>
            <DialogDescription>
              This equipment is referenced by the following operations:
            </DialogDescription>
          </DialogHeader>
          <ul className="max-h-48 list-disc space-y-1 overflow-auto pl-5 text-sm text-text-secondary">
            {pending?.refs.map((r, i) => (
              <li key={i}>
                <span className="font-medium text-text-primary">{r.stepName}</span> — {r.opLabel}
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
