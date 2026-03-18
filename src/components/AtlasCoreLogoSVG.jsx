/**
 * AtlasCoreLogoSVG
 * variant="light" → fundo branco, ícone azul (#1B3A6B) — para headers em fundo claro
 * variant="dark"  → fundo azul (#1B3A6B), ícone branco — para dark mode / splash / fundo escuro
 * variant="auto"  → usa CSS media query via currentColor para adaptar automaticamente
 */
export default function AtlasCoreLogoSVG({ width = 24, height = 24, className = "", variant = "light" }) {
  const bg = variant === "dark" ? "#1B3A6B" : "white";
  const fg = variant === "dark" ? "white" : "#1B3A6B";
  const rectFill = variant === "dark" ? "#1B3A6B" : "white";

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="100" height="100" fill={bg} />
      <line x1="50" y1="10" x2="10" y2="90" stroke={fg} strokeWidth="10" strokeLinecap="round" />
      <line x1="50" y1="10" x2="90" y2="90" stroke={fg} strokeWidth="10" strokeLinecap="round" />
      <line x1="26" y1="63" x2="74" y2="63" stroke={fg} strokeWidth="10" strokeLinecap="round" />
      <rect x="36" y="56" width="28" height="14" fill={rectFill} />
      <circle cx="50" cy="63" r="7.5" fill={fg} />
    </svg>
  );
}