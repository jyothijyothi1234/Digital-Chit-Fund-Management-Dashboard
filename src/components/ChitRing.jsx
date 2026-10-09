
const MEMBERS = 20
const CURRENT = 6 
const C = 160
const R = 118

export default function ChitRing() {
  const members = Array.from({ length: MEMBERS }, (_, i) => {
    const a = (i / MEMBERS) * Math.PI * 2 - Math.PI / 2
    return {
      i,
      x: C + Math.cos(a) * R,
      y: C + Math.sin(a) * R,
      state: i < CURRENT ? 'done' : i === CURRENT ? 'current' : 'upcoming',
    }
  })

  return (
    <figure className="ring">
      <svg viewBox="0 0 320 320" className="ring__svg" aria-hidden="true">
        <circle cx={C} cy={C} r={R} className="ring__orbit" />
        <circle cx={C} cy={C} r="66" className="ring__pot" />
        <text x={C} y={C + 14} textAnchor="middle" className="ring__rupee">₹</text>
        {members.map((m) => (
          <g key={m.i} className={`ring__member ring__member--${m.state}`} style={{ '--i': m.i }}>
            {m.state === 'current' && <circle cx={m.x} cy={m.y} r="21" className="ring__halo" />}
            <circle cx={m.x} cy={m.y} r={m.state === 'current' ? 13 : 9} className="ring__dot" />
          </g>
        ))}
      </svg>
      <figcaption className="ring__caption">
        Twenty members pay into one pot each month. Every month, one member takes it home.
      </figcaption>
    </figure>
  )
}
