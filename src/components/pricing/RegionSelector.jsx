import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { getRegionPricing, setRegionPricing, detectRegion } from '@/lib/regionalPricing';

/**
 * RegionSelector — permite usuário escolher Brasil ou US para preços
 */
export default function RegionSelector({ onRegionChange }) {
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initRegion() {
      const detected = await detectRegion();
      setRegion(detected);
      onRegionChange?.(detected);
      setLoading(false);
    }
    initRegion();
  }, [onRegionChange]);

  const handleChange = (newRegion) => {
    setRegion(newRegion);
    setRegionPricing(newRegion);
    onRegionChange?.(newRegion);
  };

  if (loading) return null;

  const cfg = getRegionPricing(region);

  return (
    <div className="flex items-center gap-2 bg-[hsl(var(--shell))] rounded-lg px-3 py-2">
      <Globe className="w-4 h-4 text-[hsl(var(--fg-2))]" strokeWidth={2} />
      <select
        value={region}
        onChange={(e) => handleChange(e.target.value)}
        className="text-[13px] font-medium bg-transparent border-none outline-none text-[hsl(var(--fg))] cursor-pointer"
      >
        <option value="BR">Brasil (R$)</option>
        <option value="US">USA ($)</option>
      </select>
    </div>
  );
}