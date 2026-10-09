import { useEffect, useRef } from 'react'

export default function OtpInput({ length = 6, value, onChange, onComplete, disabled, invalid, autoFocus, describedBy }) {
  const inputs = useRef([])
  const digits = Array.from({ length }, (_, i) => value[i] || '')

  useEffect(() => {
    if (autoFocus) inputs.current[0]?.focus()
  }, [autoFocus])

  const focusBox = (i) => {
    const el = inputs.current[Math.max(0, Math.min(length - 1, i))]
    el?.focus()
    el?.select()
  }

  const commit = (next) => {
    const clean = next.replace(/\D/g, '').slice(0, length)
    onChange(clean)
    if (clean.length === length) onComplete?.(clean)
  }

  const fillFrom = (index, incoming) => {
    const chars = incoming.replace(/\D/g, '')
    if (!chars) return
    const arr = digits.slice()
    let pos = index
    for (const ch of chars) {
      if (pos >= length) break
      arr[pos] = ch
      pos += 1
    }
    commit(arr.join(''))
    focusBox(pos >= length ? length - 1 : pos)
  }

  const handleChange = (i, e) => {
    const typed = e.target.value
    if (!typed) {
      const arr = digits.slice()
      arr[i] = ''
      commit(arr.join(''))
      return
    }
    // When a box already holds a digit the new one is appended; keep only what was just typed.
    const incoming = typed.length > 1 && digits[i] && typed.startsWith(digits[i]) ? typed.slice(1) : typed
    fillFrom(i, incoming)
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      e.preventDefault()
      const arr = digits.slice()
      arr[i - 1] = ''
      commit(arr.join(''))
      focusBox(i - 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      focusBox(i - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      focusBox(i + 1)
    }
  }

  const handlePaste = (i, e) => {
    e.preventDefault()
    fillFrom(i, e.clipboardData.getData('text'))
  }

  return (
    <div className={`otp ${invalid ? 'otp--invalid' : ''}`} role="group" aria-label="One-time password" aria-describedby={describedBy}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            inputs.current[i] = el
          }}
          className={`otp__box ${d ? 'otp__box--filled' : ''}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={i === 0 ? length : 2}
          value={d}
          disabled={disabled}
          aria-label={`Digit ${i + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  )
}
