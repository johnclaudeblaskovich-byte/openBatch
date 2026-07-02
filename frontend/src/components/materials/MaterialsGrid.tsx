import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui'
import type { Material } from '@/types'

const TYPE_LABEL: Record<Material['type'], string> = {
  PureComponent: 'Pure',
  PredefinedMixture: 'Mixture',
  Cell: 'Cell',
}

/** Read-only overview of the whole materials database. */
export default function MaterialsGrid({ materials }: { materials: Material[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Phase</TableHead>
          <TableHead>MW (g/mol)</TableHead>
          <TableHead>Density (kg/m³)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {materials.map((m) => (
          <TableRow key={m.id}>
            <TableCell>{m.name}</TableCell>
            <TableCell>
              <span className="rounded bg-background px-1.5 py-0.5 text-xs text-text-secondary">
                {TYPE_LABEL[m.type]}
              </span>
            </TableCell>
            <TableCell>{m.defaultPhase}</TableCell>
            <TableCell>{m.molecularWeight ?? '—'}</TableCell>
            <TableCell>{m.density ?? '—'}</TableCell>
          </TableRow>
        ))}
        {materials.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-muted">
              No materials.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
