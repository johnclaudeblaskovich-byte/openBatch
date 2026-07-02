import { useState } from 'react'
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui'

/**
 * Throwaway visual smoke-test page — not routed. Renders one of every shadcn/ui
 * primitive so they can be eyeballed during development.
 */
export default function KitchenSink() {
  const [checked, setChecked] = useState(false)
  return (
    <TooltipProvider>
      <div className="space-y-6 p-8 font-sans text-text-primary">
        <h1 className="text-2xl font-semibold">OpenBatch UI Kitchen Sink</h1>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase text-text-secondary">Buttons</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="default">Default</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
        </section>

        <Separator />

        <section className="max-w-sm space-y-2">
          <h2 className="text-sm font-semibold uppercase text-text-secondary">Inputs</h2>
          <Label htmlFor="ks-input">Name</Label>
          <Input id="ks-input" placeholder="Type here…" />
          <div className="flex items-center gap-2">
            <Checkbox
              id="ks-check"
              checked={checked}
              onCheckedChange={(v) => setChecked(Boolean(v))}
            />
            <Label htmlFor="ks-check">Enabled</Label>
          </div>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Pick a phase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="liquid">Liquid</SelectItem>
              <SelectItem value="solid">Solid</SelectItem>
              <SelectItem value="gas">Gas</SelectItem>
            </SelectContent>
          </Select>
        </section>

        <Separator />

        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase text-text-secondary">Tabs</h2>
          <Tabs defaultValue="recipe">
            <TabsList>
              <TabsTrigger value="recipe">Recipe</TabsTrigger>
              <TabsTrigger value="equipment">Equipment</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
            </TabsList>
            <TabsContent value="recipe">Recipe panel</TabsContent>
            <TabsContent value="equipment">Equipment panel</TabsContent>
            <TabsContent value="materials">Materials panel</TabsContent>
          </Tabs>
        </section>

        <Separator />

        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase text-text-secondary">
            Dialog / Dropdown / Tooltip
          </h2>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button>Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>About OpenBatch</DialogTitle>
                  <DialogDescription>A clone of Aspen Batch Process Developer.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Menu</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>New</DropdownMenuItem>
                <DropdownMenuItem>Open</DropdownMenuItem>
                <DropdownMenuItem disabled>Disabled</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost">Hover me</Button>
              </TooltipTrigger>
              <TooltipContent>Tooltip content</TooltipContent>
            </Tooltip>
          </div>
        </section>

        <Separator />

        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase text-text-secondary">Table</h2>
          <ScrollArea className="h-40 rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operation</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Charge</TableCell>
                  <TableCell>Reactor-1</TableCell>
                  <TableCell>15</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>React</TableCell>
                  <TableCell>Reactor-1</TableCell>
                  <TableCell>60</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </ScrollArea>
        </section>
      </div>
    </TooltipProvider>
  )
}
