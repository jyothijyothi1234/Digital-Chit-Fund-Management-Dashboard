// Small inline icon set (24px grid, stroke icons) so the auth pages need no icon font.
const PATHS = {
    eye: (
      <>
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    eyeOff: (
      <>
        <path d="M10.6 5.1A9.9 9.9 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-2.6 3.6M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6" />
        <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
        <path d="m3 3 18 18" />
      </>
    ),
    check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
    dot: <circle cx="12" cy="12" r="2.5" />,
    alert: (
      <>
        <circle cx="12" cy="12" r="9.5" />
        <path d="M12 7.5v5.5M12 16.5v.01" />
      </>
    ),
    success: (
      <>
        <circle cx="12" cy="12" r="9.5" />
        <path d="m8 12.3 2.8 2.8L16.3 9.5" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9.5" />
        <path d="M12 11v5.5M12 7.5v.01" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.3 7.5 9.5 4.3-1.2 7.5-4.9 7.5-9.5V6L12 3Z" />
        <path d="m9 12 2.2 2.2L15.5 10" />
      </>
    ),
    back: <path d="M15 5 8 12l7 7" />,
    logout: (
      <>
        <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
        <path d="M9 16l-4-4 4-4M5 12h10" />
      </>
    ),
  }
  
  export default function Icon({ name, size = 18, className = '', strokeWidth = 1.8 }) {
    return (
      <svg
        className={`icon ${className}`}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        {PATHS[name]}
      </svg>
    )
  }
  