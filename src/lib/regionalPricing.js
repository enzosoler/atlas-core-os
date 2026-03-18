/**
 * Regional Pricing — preços por região/moeda
 * BR (BRL) e US (USD) primeiro
 */

export const REGIONAL_PRICING = {
  'BR': {
    region: 'Brasil',
    currency: 'BRL',
    symbol: 'R$',
    stripe_prices: {
      free: null,
      athlete_pro: 'price_1Q5tJxLJhPVfVPqNjXYZ', // R$ 29/month
      athlete_performance: 'price_1Q5tJxLJhPVfVPqNjABC', // R$ 59/month
      coach: 'price_1Q5tJxLJhPVfVPqNjDEF', // R$ 99/month
      nutritionist: 'price_1Q5tJxLJhPVfVPqNjGHI', // R$ 79/month
      clinician: 'price_1Q5tJxLJhPVfVPqNjJKL', // R$ 129/month
    },
    prices: {
      free: 0,
      athlete_pro: 29,
      athlete_performance: 59,
      coach: 99,
      nutritionist: 79,
      clinician: 129,
    },
  },
  'US': {
    region: 'United States',
    currency: 'USD',
    symbol: '$',
    stripe_prices: {
      free: null,
      athlete_pro: 'price_1Q5tJxLJhPVfVPqNkXYZ', // $9/month
      athlete_performance: 'price_1Q5tJxLJhPVfVPqNkABC', // $19/month
      coach: 'price_1Q5tJxLJhPVfVPqNkDEF', // $29/month
      nutritionist: 'price_1Q5tJxLJhPVfVPqNkGHI', // $24/month
      clinician: 'price_1Q5tJxLJhPVfVPqNkJKL', // $39/month
    },
    prices: {
      free: 0,
      athlete_pro: 9,
      athlete_performance: 19,
      coach: 29,
      nutritionist: 24,
      clinician: 39,
    },
  },
};

/**
 * Detec region baseado em:
 * 1. localStorage (user preference)
 * 2. geolocalização (IP)
 * 3. default: US
 */
export async function detectRegion() {
  // Check localStorage
  const saved = localStorage.getItem('atlas_region');
  if (saved && REGIONAL_PRICING[saved]) return saved;
  
  // Try geolocation (pode falhar, é ok)
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    const countryCode = data.country_code;
    
    if (countryCode === 'BR') return 'BR';
    if (countryCode === 'US') return 'US';
  } catch (e) {
    // Silently fail
  }
  
  return 'US'; // default
}

export function setRegionPricing(region) {
  if (REGIONAL_PRICING[region]) {
    localStorage.setItem('atlas_region', region);
  }
}

// Alias para compatibilidade
export function setRegionPreference(region) {
  return setRegionPricing(region);
}

export function getRegionPricing(region = 'US') {
  return REGIONAL_PRICING[region] || REGIONAL_PRICING['US'];
}

export function formatPrice(price, region = 'US') {
  const cfg = getRegionPricing(region);
  return `${cfg.symbol} ${price.toFixed(2).replace('.', cfg.currency === 'BRL' ? ',' : '.')}`;
}