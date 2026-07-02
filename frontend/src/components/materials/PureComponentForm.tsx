import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
import NumberInput from '@/components/forms/NumberInput'
import TagInput from '@/components/forms/TagInput'
import type { Material, PhaseType } from '@/types'

interface Props {
  material: Material
  onPatch: (patch: Partial<Material>) => void
}

const PHASES: PhaseType[] = ['Liquid', 'Solid', 'Gas', 'Mixed']

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

/** Pure-component property form: identity, physical properties and Antoine vapor-pressure data. */
export default function PureComponentForm({ material, onPatch }: Props) {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Identity
        </h3>
        <Field label="Name">
          <Input value={material.name} onChange={(e) => onPatch({ name: e.target.value })} />
        </Field>
        <Field label="Aliases">
          <TagInput
            values={material.aliases}
            onChange={(aliases) => onPatch({ aliases })}
            placeholder="Add alias…"
          />
        </Field>
        <Field label="Default phase">
          <Select
            value={material.defaultPhase}
            onValueChange={(v) => onPatch({ defaultPhase: v as PhaseType })}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PHASES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Field label="Molecular weight (g/mol)">
          <NumberInput
            value={material.molecularWeight}
            mustBePositive
            invalidMessage="Molecular weight must be > 0"
            onChange={(v) => onPatch({ molecularWeight: v })}
          />
        </Field>
        <Field label="Density (kg/m³ @25°C)">
          <NumberInput
            value={material.density}
            mustBePositive
            invalidMessage="Density must be > 0"
            onChange={(v) => onPatch({ density: v })}
          />
        </Field>
        <Field label="Boiling point (°C)">
          <NumberInput
            value={material.boilingPoint}
            onChange={(v) => onPatch({ boilingPoint: v })}
          />
        </Field>
        <Field label="Melting point (°C)">
          <NumberInput
            value={material.meltingPoint}
            onChange={(v) => onPatch({ meltingPoint: v })}
          />
        </Field>
        <Field label="Cp liquid (J/(kg·K))">
          <NumberInput
            value={material.heatCapacityLiquid}
            onChange={(v) => onPatch({ heatCapacityLiquid: v })}
          />
        </Field>
        <Field label="Cp solid (J/(kg·K))">
          <NumberInput
            value={material.heatCapacitySolid}
            onChange={(v) => onPatch({ heatCapacitySolid: v })}
          />
        </Field>
        <Field label="Heat of vaporization (J/kg)">
          <NumberInput
            value={material.heatOfVaporization}
            onChange={(v) => onPatch({ heatOfVaporization: v })}
          />
        </Field>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Antoine equation
        </h3>
        <p className="font-mono text-xs text-text-secondary">
          log10(Psat_mmHg) = A − B / (C + T_°C)
        </p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="A">
            <NumberInput value={material.antoineA} onChange={(v) => onPatch({ antoineA: v })} />
          </Field>
          <Field label="B">
            <NumberInput value={material.antoineB} onChange={(v) => onPatch({ antoineB: v })} />
          </Field>
          <Field label="C">
            <NumberInput value={material.antoineC} onChange={(v) => onPatch({ antoineC: v })} />
          </Field>
        </div>
      </section>

      <section className="space-y-1">
        <Label>Notes</Label>
        <Input value={material.notes} onChange={(e) => onPatch({ notes: e.target.value })} />
      </section>
    </div>
  )
}
