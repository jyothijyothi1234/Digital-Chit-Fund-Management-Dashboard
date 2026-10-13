import { useId } from 'react'
import Icon from './Icon'

/**
 * Labelled input with hint, error and an optional fixed prefix (e.g. +91).
 * `trailing` renders inside the box on the right (used by the password toggle).
 */
export default function TextField({ label, optional, hint, error, prefix, trailing, labelAside, className = '', ...inputProps }) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className={`field ${error ? 'field--invalid' : ''} ${className}`}>
      <div className="field__label-row">
        <label htmlFor={id} className="field__label">
          {label}
          {optional && <span className="field__optional"> (optional)</span>}
        </label>
        {labelAside}
      </div>
      <div className="field__control">
        {prefix && (
          <span className="field__prefix" aria-hidden="true">
            {prefix}
          </span>
        )}
        <input id={id} className="field__input" aria-invalid={Boolean(error)} aria-describedby={describedBy} {...inputProps} />
        {trailing}
      </div>
      {error ? (
        <p id={errorId} className="field__error">
          <Icon name="alert" size={15} />
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="field__hint">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
