import { Download } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui'
import {
  downloadCSV,
  downloadXLSX,
  type ExportTable,
} from '@/export/exportTables'

/**
 * "Export ▾" dropdown offering CSV / XLSX download of a single result table.
 * `build` is called lazily on click so the table reflects current data.
 */
export default function ExportMenu({
  build,
  filenameBase,
}: {
  build: () => ExportTable
  filenameBase: string
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline">
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => downloadCSV(build(), `${filenameBase}.csv`)}>
          CSV (.csv)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => downloadXLSX([build()], `${filenameBase}.xlsx`)}>
          Excel (.xlsx)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
