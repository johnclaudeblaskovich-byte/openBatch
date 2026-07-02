import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui'
import { generateTextRecipe } from '@/recipe/generateTextRecipe'
import type { Project, Step } from '@/types'

/** Read-only mono text rendering of a step's recipe, with copy-to-clipboard. */
export default function TextRecipeView({ step, project }: { step: Step; project: Project }) {
  const text = generateTextRecipe(step, project)
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard may be unavailable */
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-end border-b border-border px-3 py-2">
        <Button size="sm" variant="outline" onClick={copy}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <pre className="min-h-0 flex-1 overflow-auto p-4 font-mono text-xs text-text-primary">
        {text}
      </pre>
    </div>
  )
}
