import { passwordChecks } from '../utils/validators'
import Icon from './Icon'

export default function PasswordChecklist({ value, id }) {
  const checks = passwordChecks(value)
  return (
    <ul className="checklist" id={id} aria-label="Password requirements">
      {checks.map((c) => (
        <li key={c.id} className={c.ok ? 'checklist__item checklist__item--ok' : 'checklist__item'}>
          <Icon name={c.ok ? 'check' : 'dot'} size={16} strokeWidth={c.ok ? 2.4 : 1.8} />
          <span>{c.label}</span>
          <span className="visually-hidden">{c.ok ? ' (done)' : ' (not yet)'}</span>
        </li>
      ))}
    </ul>
  )
}
