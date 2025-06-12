/**
 * Animation Variants System Tests
 * Tests for animation variant configurations and utilities
 */

import {
  AnimationVariant,
  AnimationVariantConfig,
  AnimationPreferences,
  getAnimationConfig,
  mergeAnimationConfig,
  getAdjustedAnimation,
  animationVariants,
  animationPresets,
  defaultAnimationPreferences,
} from '@/lib/design/animation-variants';

describe('Animation Variants System', () => {
  describe('getAnimationConfig', () => {
    it('should return correct config for each variant', () => {
      const variants: AnimationVariant[] = ['subtle', 'moderate', 'energetic', 'none'];
      
      variants.forEach(variant => {
        const config = getAnimationConfig(variant);
        expect(config).toBeDefined();
        expect(config).toBe(animationVariants[variant]);
      });
    });
    
    it('should return moderate config by default', () => {
      const config = getAnimationConfig();
      expect(config).toBe(animationVariants.moderate);
    });
    
    it('should have correct subtle variant values', () => {
      const config = getAnimationConfig('subtle');
      
      expect(config.scale.hover).toBe(1.01);
      expect(config.scale.press).toBe(0.99);
      expect(config.duration.normal).toBe(250);
      expect(config.spring.damping).toBe(20);
      expect(config.entrance.fade).toBe(true);
      expect(config.entrance.scale).toBe(false);
    });
    
    it('should have correct moderate variant values', () => {
      const config = getAnimationConfig('moderate');
      
      expect(config.scale.hover).toBe(1.03);
      expect(config.scale.press).toBe(0.97);
      expect(config.duration.normal).toBe(300);
      expect(config.spring.damping).toBe(15);
      expect(config.entrance.fade).toBe(true);
      expect(config.entrance.scale).toBe(true);
    });
    
    it('should have correct energetic variant values', () => {
      const config = getAnimationConfig('energetic');
      
      expect(config.scale.hover).toBe(1.05);
      expect(config.scale.press).toBe(0.95);
      expect(config.duration.normal).toBe(400);
      expect(config.spring.damping).toBe(10);
      expect(config.entrance.fade).toBe(true);
      expect(config.entrance.scale).toBe(true);
      expect(config.entrance.slide).toBe(true);
    });
    
    it('should have zero values for none variant', () => {
      const config = getAnimationConfig('none');
      
      expect(config.scale.hover).toBe(1);
      expect(config.scale.press).toBe(1);
      expect(config.duration.normal).toBe(0);
      expect(config.entrance.fade).toBe(false);
      expect(config.entrance.scale).toBe(false);
      expect(config.entrance.slide).toBe(false);
    });
  });
  
  describe('mergeAnimationConfig', () => {
    it('should return base config when no overrides', () => {
      const result = mergeAnimationConfig('moderate');
      expect(result).toEqual(animationVariants.moderate);
    });
    
    it('should merge scale overrides', () => {
      const result = mergeAnimationConfig('moderate', {
        scale: { hover: 1.1 },
      });
      
      expect(result.scale.hover).toBe(1.1);
      expect(result.scale.press).toBe(0.97); // Original value
    });
    
    it('should merge duration overrides', () => {
      const result = mergeAnimationConfig('subtle', {
        duration: { fast: 100, slow: 600 },
      });
      
      expect(result.duration.fast).toBe(100);
      expect(result.duration.slow).toBe(600);
      expect(result.duration.normal).toBe(250); // Original value
    });
    
    it('should merge spring overrides', () => {
      const result = mergeAnimationConfig('energetic', {
        spring: { damping: 25, mass: 2 },
      });
      
      expect(result.spring.damping).toBe(25);
      expect(result.spring.mass).toBe(2);
      expect(result.spring.stiffness).toBe(150); // Original value
    });
    
    it('should merge entrance overrides', () => {
      const result = mergeAnimationConfig('subtle', {
        entrance: { scale: true, distance: 50 },
      });
      
      expect(result.entrance.scale).toBe(true);
      expect(result.entrance.distance).toBe(50);
      expect(result.entrance.fade).toBe(true); // Original value
    });
    
    it('should handle partial overrides', () => {
      const result = mergeAnimationConfig('moderate', {
        scale: { hover: 1.1 },
        duration: { instant: 50 },
      });
      
      expect(result.scale.hover).toBe(1.1);
      expect(result.duration.instant).toBe(50);
      // Other values remain unchanged
      expect(result.spring).toEqual(animationVariants.moderate.spring);
      expect(result.stagger).toEqual(animationVariants.moderate.stagger);
    });
  });
  
  describe('getAdjustedAnimation', () => {
    const defaultPrefs: AnimationPreferences = {
      variant: 'moderate',
      reducedMotion: false,
      deviceTier: 'high',
    };
    
    it('should return none when reduced motion is enabled', () => {
      const prefs = { ...defaultPrefs, reducedMotion: true };
      
      expect(getAdjustedAnimation('energetic', prefs)).toBe('none');
      expect(getAdjustedAnimation('moderate', prefs)).toBe('none');
      expect(getAdjustedAnimation('subtle', prefs)).toBe('none');
    });
    
    it('should downgrade animations on low-tier devices', () => {
      const prefs = { ...defaultPrefs, deviceTier: 'low' as const };
      
      expect(getAdjustedAnimation('energetic', prefs)).toBe('subtle');
      expect(getAdjustedAnimation('moderate', prefs)).toBe('subtle');
      expect(getAdjustedAnimation('subtle', prefs)).toBe('subtle');
    });
    
    it('should partially downgrade on medium-tier devices', () => {
      const prefs = { ...defaultPrefs, deviceTier: 'medium' as const };
      
      expect(getAdjustedAnimation('energetic', prefs)).toBe('moderate');
      expect(getAdjustedAnimation('moderate', prefs)).toBe('moderate');
      expect(getAdjustedAnimation('subtle', prefs)).toBe('subtle');
    });
    
    it('should preserve animations on high-tier devices', () => {
      const prefs = { ...defaultPrefs, deviceTier: 'high' as const };
      
      expect(getAdjustedAnimation('energetic', prefs)).toBe('energetic');
      expect(getAdjustedAnimation('moderate', prefs)).toBe('moderate');
      expect(getAdjustedAnimation('subtle', prefs)).toBe('subtle');
    });
    
    it('should handle none variant', () => {
      const prefs = { ...defaultPrefs };
      
      expect(getAdjustedAnimation('none', prefs)).toBe('none');
    });
  });
  
  describe('Animation Presets', () => {
    it('should have correct button presets', () => {
      expect(animationPresets.buttonSubtle).toEqual({
        variant: 'subtle',
        type: 'scale',
      });
      
      expect(animationPresets.buttonModerate).toEqual({
        variant: 'moderate',
        type: 'scale',
      });
      
      expect(animationPresets.buttonEnergetic).toEqual({
        variant: 'energetic',
        type: 'ripple',
      });
    });
    
    it('should have correct card presets', () => {
      expect(animationPresets.cardHover).toEqual({
        variant: 'subtle',
        type: 'lift',
      });
      
      expect(animationPresets.cardInteractive).toEqual({
        variant: 'moderate',
        type: 'tilt',
      });
    });
    
    it('should have correct list presets', () => {
      expect(animationPresets.listSubtle).toEqual({
        variant: 'subtle',
        type: 'stagger',
      });
      
      expect(animationPresets.listDynamic).toEqual({
        variant: 'energetic',
        type: 'cascade',
      });
    });
  });
  
  describe('Default Animation Preferences', () => {
    it('should have correct default values', () => {
      expect(defaultAnimationPreferences).toEqual({
        variant: 'moderate',
        reducedMotion: false,
        deviceTier: 'high',
      });
    });
  });
  
  describe('Animation Configuration Integrity', () => {
    it('should have all required properties for each variant', () => {
      const variants: AnimationVariant[] = ['subtle', 'moderate', 'energetic', 'none'];
      
      variants.forEach(variant => {
        const config = animationVariants[variant];
        
        // Check scale
        expect(config.scale).toBeDefined();
        expect(config.scale.hover).toBeGreaterThanOrEqual(0.95);
        expect(config.scale.hover).toBeLessThanOrEqual(1.05);
        expect(config.scale.press).toBeGreaterThanOrEqual(0.95);
        expect(config.scale.press).toBeLessThanOrEqual(1);
        
        // Check duration
        expect(config.duration).toBeDefined();
        expect(config.duration.instant).toBeGreaterThanOrEqual(0);
        expect(config.duration.fast).toBeGreaterThanOrEqual(0);
        expect(config.duration.normal).toBeGreaterThanOrEqual(0);
        expect(config.duration.slow).toBeGreaterThanOrEqual(0);
        
        // Check spring
        expect(config.spring).toBeDefined();
        expect(config.spring.damping).toBeGreaterThan(0);
        expect(config.spring.stiffness).toBeGreaterThan(0);
        
        // Check stagger
        expect(config.stagger).toBeDefined();
        expect(config.stagger.base).toBeGreaterThanOrEqual(0);
        expect(config.stagger.multiplier).toBeGreaterThanOrEqual(0);
        
        // Check entrance
        expect(config.entrance).toBeDefined();
        expect(typeof config.entrance.fade).toBe('boolean');
        expect(typeof config.entrance.scale).toBe('boolean');
        expect(typeof config.entrance.slide).toBe('boolean');
        expect(config.entrance.distance).toBeGreaterThanOrEqual(0);
        
        // Check easing
        expect(config.easing).toBeDefined();
        expect(Array.isArray(config.easing.standard)).toBe(true);
        expect(Array.isArray(config.easing.accelerate)).toBe(true);
        expect(Array.isArray(config.easing.decelerate)).toBe(true);
      });
    });
    
    it('should have progressive duration values', () => {
      const variants: AnimationVariant[] = ['subtle', 'moderate', 'energetic'];
      
      variants.forEach(variant => {
        const config = animationVariants[variant];
        
        expect(config.duration.instant).toBeLessThan(config.duration.fast);
        expect(config.duration.fast).toBeLessThan(config.duration.normal);
        expect(config.duration.normal).toBeLessThan(config.duration.slow);
      });
    });
  });
});