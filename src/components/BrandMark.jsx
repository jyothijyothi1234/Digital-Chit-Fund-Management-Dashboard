import { APP_NAME } from '../config'

// A miniature of the chit ring: eight members around the pot, one taking this month's turn.
export default function BrandMark({ tone = 'light' }) {
  const dots = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2
    return { x: 16 + Math.cos(a) * 11, y: 16 + Math.sin(a) * 11, current: i === 2 }
  })
  return (
    <span className={`brand brand--${tone}`}>
      <svg className="brand__mark" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="11" fill="none" className="brand__orbit" />
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.current ? 3.4 : 2.4} className={d.current ? 'brand__current' : 'brand__dot'} />
        ))}
        <circle cx="16" cy="16" r="4.5" className="brand__pot" />
      </svg>
      <span className="brand__name">{APP_NAME}</span>
    </span>
  )
}
