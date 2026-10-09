export default function Button({ loading = false, loadingText, children, variant = 'primary', className = '', disabled, ...rest }) {
    return (
      <button
        type="submit"
        className={`btn btn--${variant} ${className}`}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...rest}
      >
        {loading && <span className="btn__spinner" aria-hidden="true" />}
        <span>{loading && loadingText ? loadingText : children}</span>
      </button>
    )
  }
  