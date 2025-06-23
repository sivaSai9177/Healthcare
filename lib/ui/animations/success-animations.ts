import { Easing } from 'react-native-reanimated';

// Success animation configurations
export const successAnimationConfig = {
  checkmark: {
    duration: 600,
    easing: Easing.out(Easing.cubic),
    scale: {
      from: 0,
      to: 1,
      overshoot: 1.1,
    },
  },
  circle: {
    duration: 800,
    strokeWidth: 4,
    radius: 50,
    color: '#10b981',
  },
  particles: {
    count: 12,
    duration: 1000,
    spread: 360,
    distance: 120,
    colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
  },
  container: {
    entranceDuration: 300,
    exitDuration: 200,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  text: {
    delayIn: 400,
    duration: 300,
  },
};

// Particle animation paths
export const generateParticlePath = (index: number, totalParticles: number) => {
  const angle = (360 / totalParticles) * index;
  const radian = (angle * Math.PI) / 180;
  
  return {
    angle,
    radian,
    startX: 0,
    startY: 0,
    endX: Math.cos(radian) * successAnimationConfig.particles.distance,
    endY: Math.sin(radian) * successAnimationConfig.particles.distance,
  };
};

// Easing functions for different animation phases
export const successEasings = {
  entrance: Easing.out(Easing.back(1.5)),
  checkmark: Easing.out(Easing.cubic),
  particles: Easing.out(Easing.quad),
  exit: Easing.in(Easing.cubic),
};

// Animation sequence timings
export const successSequence = {
  containerFadeIn: 0,
  circleStart: 100,
  checkmarkStart: 400,
  particlesStart: 600,
  textFadeIn: 700,
  autoHideDelay: 2000,
  fadeOutDuration: 200,
};