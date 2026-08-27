function Button({
  children,
  variant = "default",
  className = "",
  ...props
}) {
  const variants = {
    default:
      "bg-[var(--surface)] text-[var(--text-primary)] hover:opacity-80",
    primary:
      "bg-[var(--accent)] text-white hover:opacity-90",
    ghost:
      "text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]",
  };

  return (
    <button
      className={`rounded-lg px-4 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;