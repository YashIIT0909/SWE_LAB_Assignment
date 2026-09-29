'use client'
import { useId, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useKeywordSuggestions } from '@/lib/queries'

/** Chip input: Enter or comma adds a term; suggestions come from existing keywords. */
export function KeywordInput({
  id,
  value,
  onChange,
  max = 50,
}: {
  id: string
  value: string[]
  onChange: (terms: string[]) => void
  max?: number
}) {
  const [draft, setDraft] = useState('')
  const listId = useId()
  const prefix = draft.trim().toLowerCase()
  const suggestions = useKeywordSuggestions(prefix)

  const add = (raw: string) => {
    const terms = raw
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t && t.length <= 50 && !value.includes(t))
    if (terms.length) onChange([...value, ...new Set(terms)].slice(0, max))
    setDraft('')
  }

  return (
    <div className="space-y-2">
      <Input
        id={id}
        list={listId}
        value={draft}
        maxLength={50}
        placeholder="Type a keyword and press Enter"
        onChange={(e) => {
          if (e.target.value.includes(',')) add(e.target.value)
          else setDraft(e.target.value)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            add(draft)
          } else if (e.key === 'Backspace' && !draft && value.length) {
            onChange(value.slice(0, -1))
          }
        }}
        onBlur={() => draft && add(draft)}
      />
      <datalist id={listId}>
        {suggestions.data
          ?.filter((k) => !value.includes(k.term))
          .map((k) => (
            <option key={k.id} value={k.term} />
          ))}
      </datalist>
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1" aria-label="Selected keywords">
          {value.map((t) => (
            <li key={t}>
              <Badge variant="secondary" className="gap-1">
                {t}
                <button
                  type="button"
                  aria-label={`Remove keyword ${t}`}
                  className="ml-1 hover:text-destructive"
                  onClick={() => onChange(value.filter((v) => v !== t))}
                >
                  ×
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
