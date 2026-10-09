import { useState } from 'react'
import TextField from './TextField'
import Icon from './Icon'

export default function PasswordField(props) {
  const [visible, setVisible] = useState(false)
  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      trailing={
        <button
          type="button"
          className="field__toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          <Icon name={visible ? 'eyeOff' : 'eye'} size={20} />
        </button>
      }
    />
  )
}
