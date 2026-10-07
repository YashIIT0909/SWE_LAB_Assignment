'use client'
import { useEffect, useRef } from 'react'

const ORIGIN = 'https://embed.diagrams.net'
const OPTIONS = {
  preview: 'chrome=0&lightbox=0&nav=0',
  editor: 'ui=kennedy&noSaveBtn=1&noExitBtn=1&saveAndExit=0',
}

/** draw.io embed (postMessage JSON protocol): loads `xml` when the iframe says `init`. */
export function DrawioFrame({
  xml,
  mode,
  className,
  merge,
}: {
  xml: string
  mode: keyof typeof OPTIONS
  className?: string
  /** Bump `key` to merge another diagram's XML onto the open canvas. */
  merge?: { xml: string; key: number }
}) {
  const frame = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== ORIGIN || e.source !== frame.current?.contentWindow) return
      const msg = JSON.parse(e.data as string) as { event?: string }
      if (msg.event === 'init')
        frame.current?.contentWindow?.postMessage(
          JSON.stringify({ action: 'load', xml, autosave: 0 }),
          ORIGIN,
        )
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [xml])

  useEffect(() => {
    if (merge)
      frame.current?.contentWindow?.postMessage(
        JSON.stringify({ action: 'merge', xml: merge.xml }),
        ORIGIN,
      )
    // only when a new merge is requested
  }, [merge?.key])

  return (
    <iframe
      ref={frame}
      title="Diagram"
      src={`${ORIGIN}/?embed=1&proto=json&spin=1&${OPTIONS[mode]}`}
      className={className}
    />
  )
}
