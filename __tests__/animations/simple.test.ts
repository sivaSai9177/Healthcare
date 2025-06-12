/**
 * Simple test to verify animation test setup
 */

import { getAnimationConfig } from '@/lib/design/animation-variants';

describe('Animation Test Setup', () => {
  it('should load animation configuration', () => {
    const config = getAnimationConfig('moderate');
    
    expect(config).toBeDefined();
    expect(config.scale.hover).toBe(1.03);
    expect(config.duration.normal).toBe(300);
  });
  
  it('should have all variant configurations', () => {
    const variants = ['subtle', 'moderate', 'energetic', 'none'] as const;
    
    variants.forEach(variant => {
      const config = getAnimationConfig(variant);
      expect(config).toBeDefined();
      expect(config.scale).toBeDefined();
      expect(config.duration).toBeDefined();
    });
  });
});