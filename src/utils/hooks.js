import { useEffect, useState } from 'react'
import { APP_NAME } from '../config'

/** A clock that ticks four times a second while the component is mounted. */
function useNow() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [])
  return now
}

/** Seconds left until each absolute deadline (ms timestamps). */
export function useSecondsUntil(...deadlines) {
  const now = useNow()
  return deadlines.map((d) => (d ? Math.max(0, Math.ceil((d - now) / 1000)) : 0))
}

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${APP_NAME}` : APP_NAME
  }, [title])
}

export function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
