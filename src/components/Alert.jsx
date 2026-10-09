import Icon from './Icon'

const ICONS = { error: 'alert', success: 'success', info: 'info' }

/** Inline message above a form. Errors are announced immediately to screen readers. */
export default function Alert({ tone = 'info', children, action }) {
  return (
    <div className={`alert alert--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon name={ICONS[tone]} size={20} className="alert__icon" />
      <div className="alert__body">
        <div>{children}</div>
        {action && <div className="alert__action">{action}</div>}
      </div>
    </div>
  )
}
