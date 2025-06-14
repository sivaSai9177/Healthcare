// @ts-expect-error - no types
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import nativewind from "nativewind/preset";
import { hairlineWidth } from "nativewind/theme";

export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  presets: [require("nativewind/preset")],
  theme: {
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderWidth: {
  			hairline: 'hairlineWidth()'
  		},
  		// Animation durations
  		transitionDuration: {
  			'instant': '0ms',
  			'fast': '150ms',
  			'normal': '300ms',
  			'slow': '500ms',
  			'slower': '700ms',
  			'slowest': '1000ms',
  		},
  		
  		// Animation timings
  		transitionTimingFunction: {
  			'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  			'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
  			'snappy': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  		},
  		
  		// Animation delays for stagger effects
  		transitionDelay: {
  			'stagger-1': '50ms',
  			'stagger-2': '100ms',
  			'stagger-3': '150ms',
  			'stagger-4': '200ms',
  			'stagger-5': '250ms',
  			'stagger-6': '300ms',
  		},
  		
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			// Fade animations
  			fadeIn: {
  				'0%': { opacity: '0' },
  				'100%': { opacity: '1' },
  			},
  			fadeOut: {
  				'0%': { opacity: '1' },
  				'100%': { opacity: '0' },
  			},
  			// Scale animations
  			scaleIn: {
  				'0%': { opacity: '0', transform: 'scale(0.95)' },
  				'100%': { opacity: '1', transform: 'scale(1)' },
  			},
  			scaleOut: {
  				'0%': { opacity: '1', transform: 'scale(1)' },
  				'100%': { opacity: '0', transform: 'scale(0.95)' },
  			},
  			// Slide animations
  			slideInUp: {
  				'0%': { opacity: '0', transform: 'translateY(20px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' },
  			},
  			slideInDown: {
  				'0%': { opacity: '0', transform: 'translateY(-20px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' },
  			},
  			slideInLeft: {
  				'0%': { opacity: '0', transform: 'translateX(-20px)' },
  				'100%': { opacity: '1', transform: 'translateX(0)' },
  			},
  			slideInRight: {
  				'0%': { opacity: '0', transform: 'translateX(20px)' },
  				'100%': { opacity: '1', transform: 'translateX(0)' },
  			},
  			// Combined animations
  			scaleFadeIn: {
  				'0%': { opacity: '0', transform: 'scale(0.95)' },
  				'100%': { opacity: '1', transform: 'scale(1)' },
  			},
  			slideAndFade: {
  				'0%': { opacity: '0', transform: 'translateY(10px) scale(0.98)' },
  				'100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
  			},
  			// Special effects
  			shake: {
  				'0%, 100%': { transform: 'translateX(0)' },
  				'10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
  				'20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
  			},
  			bounce: {
  				'0%, 100%': { 
  					transform: 'translateY(0)',
  					animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
  				},
  				'50%': { 
  					transform: 'translateY(-25%)',
  					animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
  				},
  			},
  			pulse: {
  				'0%, 100%': { opacity: '1' },
  				'50%': { opacity: '.5' },
  			},
  			spin: {
  				to: { transform: 'rotate(360deg)' },
  			},
  			// Loading animations
  			shimmer: {
  				'0%': {
  					backgroundPosition: '-200% 0',
  				},
  				'100%': {
  					backgroundPosition: '200% 0',
  				},
  			},
  			wave: {
  				'0%, 100%': { transform: 'translateY(0)' },
  				'50%': { transform: 'translateY(-10px)' },
  			},
  			// Interaction animations
  			liftUp: {
  				'0%': { transform: 'translateY(0) scale(1)', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' },
  				'100%': { transform: 'translateY(-2px) scale(1.01)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
  			},
  			pressDown: {
  				'0%': { transform: 'scale(1)' },
  				'100%': { transform: 'scale(0.98)' },
  			},
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			// Fade animations
  			'fade-in': 'fadeIn 300ms ease-out',
  			'fade-out': 'fadeOut 300ms ease-out',
  			'fade-in-fast': 'fadeIn 150ms ease-out',
  			'fade-in-slow': 'fadeIn 500ms ease-out',
  			// Scale animations
  			'scale-in': 'scaleIn 300ms ease-out',
  			'scale-out': 'scaleOut 300ms ease-out',
  			'scale-in-fast': 'scaleIn 150ms ease-out',
  			'scale-in-slow': 'scaleIn 500ms ease-out',
  			// Slide animations
  			'slide-in-up': 'slideInUp 300ms ease-out',
  			'slide-in-down': 'slideInDown 300ms ease-out',
  			'slide-in-left': 'slideInLeft 300ms ease-out',
  			'slide-in-right': 'slideInRight 300ms ease-out',
  			// Special effects
  			'shake': 'shake 300ms ease-in-out',
  			'bounce': 'bounce 1s infinite',
  			'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  			'spin': 'spin 1s linear infinite',
  			// Combined animations
  			'scale-fade-in': 'scaleFadeIn 300ms ease-out',
  			'slide-and-fade': 'slideAndFade 400ms cubic-bezier(0.4, 0, 0.2, 1)',
  			// Loading animations
  			'shimmer': 'shimmer 2s ease-in-out infinite',
  			'wave': 'wave 1.5s ease-in-out infinite',
  			// Interaction animations
  			'lift-up': 'liftUp 200ms ease-out forwards',
  			'press-down': 'pressDown 150ms ease-out',
  			// Custom timing variants
  			'none': 'none',
  		}
  	}
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require("tailwindcss-animate")],
} satisfies import("tailwindcss").Config;
