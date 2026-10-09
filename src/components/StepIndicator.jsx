
export default function StepIndicator({ steps, current }) {
    return (
      <ol className="steps" aria-label={`Step ${current} of ${steps.length}`}>
        {steps.map((label, i) => {
          const n = i + 1
          const state = n < current ? 'done' : n === current ? 'current' : 'todo'
          return (
            <li key={label} className={`steps__item steps__item--${state}`} aria-current={state === 'current' ? 'step' : undefined}>
              <span className="steps__num">{n}</span>
              <span className="steps__label">{label}</span>
            </li>
          )
        })}
      </ol>
    )
  }
  