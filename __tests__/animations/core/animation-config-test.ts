/**
 * Animation configuration tests
 * Migrated to jest-expo patterns
 */

import { getAnimationConfig } from '@/lib/design/animation-variants';

describe('Animation Configuration', () => {
  describe('getAnimationConfig', () => {
    it('should load animation configuration for moderate variant', () => {
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
        expect(config.spring).toBeDefined();
        expect(config.stagger).toBeDefined();
        expect(config.entrance).toBeDefined();
        expect(config.easing).toBeDefined();
      });
    });

    it('should have correct values for subtle variant', () => {
      const config = getAnimationConfig('subtle');
      
      expect(config.scale.hover).toBe(1.01);
      expect(config.scale.press).toBe(0.99);
      expect(config.duration.fast).toBe(150);
      expect(config.duration.normal).toBe(250);
    });

    it('should have correct values for energetic variant', () => {
      const config = getAnimationConfig('energetic');
      
      expect(config.scale.hover).toBe(1.05);
      expect(config.scale.press).toBe(0.95);
      expect(config.duration.fast).toBe(250);
      expect(config.duration.normal).toBe(400);
    });

    it('should have disabled animations for none variant', () => {
      const config = getAnimationConfig('none');
      
      expect(config.scale.hover).toBe(1);
      expect(config.scale.press).toBe(1);
      expect(config.duration.fast).toBe(0);
      expect(config.duration.normal).toBe(0);
    });
  });
});