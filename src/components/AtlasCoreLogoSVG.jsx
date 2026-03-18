const BRAND_BLUE = '#1B3A6B';

/**
 * variant="light" → ícone azul para fundos claros
 * variant="dark"  → tile azul com ícone branco para splash/app icon/fundos escuros
 */
export default function AtlasCoreLogoSVG({ width = 24, height = 24, className = '', variant = 'light' }) {
  const stroke = variant === 'dark' ? '#FFFFFF' : BRAND_BLUE;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {variant === 'dark' && (
        <rect x="0" y="0" width="128" height="128" rx="28" fill={BRAND_BLUE} />
      )}

      <path
        d="M6 74H24L38 46L50 96L60 22L74 96L88 74H102L114 62"
        stroke={stroke}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M92 34L114 42L106 62"
        stroke={stroke}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
