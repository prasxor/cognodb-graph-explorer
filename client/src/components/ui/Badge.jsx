function Badge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-[10px] font-medium ${className}`}
    >
      {children}
    </span>
  );
}

export default Badge;