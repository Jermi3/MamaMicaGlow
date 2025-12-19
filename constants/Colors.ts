/**
 * MamaMicaGlow - Vibrant & Gentle Theme Constants
 */

export const Colors = {
  light: {
    text: '#1F2937',
    background: '#FAF8FF', // Subtle violet-tinted white
    tint: '#8B5CF6',
    icon: '#6B7280',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#8B5CF6',
  },
  dark: {
    text: '#F9FAFB',
    background: '#111827',
    tint: '#A78BFA',
    icon: '#9CA3AF',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#A78BFA',
  },
  // Vibrant Palette
  primary: '#8B5CF6',  // Violet 500
  secondary: '#EC4899', // Pink 500
  accent: '#FBBF24',   // Amber 400
  success: '#34D399',  // Emerald 400
  warning: '#F87171',  // Red 400

  // Soft / Gentle Palette
  soft: {
    primary: '#DDD6FE',  // Violet 200
    secondary: '#FBCFE8', // Pink 200
    accent: '#FDE68A',   // Amber 200
    success: '#A7F3D0',  // Emerald 200
    warning: '#FECACA',  // Red 200
    surface: '#FEFCFF',  // Very light violet-white
    background: '#FAF8FF', // Subtle violet-tinted
  },

  // Light mode blob colors (violet-based)
  lightBlobs: {
    primary: '#EDE9FE',   // Violet 100
    secondary: '#DDD6FE', // Violet 200
    tertiary: '#F3E8FF',  // Fuchsia 100
  },

  // Gradients (Start/End tuples)
  gradients: {
    primary: ['#A78BFA', '#8B5CF6'] as const,
    secondary: ['#F472B6', '#EC4899'] as const,
    accent: ['#FCD34D', '#FBBF24'] as const,
    bg: ['#F3F4F6', '#FFFFFF'] as const,
    glow: ['#DDD6FE', '#FBCFE8', '#FDE68A'] as const, // The "Glow" tri-color
  },

  // Neutrals
  white: '#FFFFFF',
  gray: {
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  }
};

export const Layout = {
  radius: {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32, // Super rounded "Squircle" vibe
    xxl: 48, // For giant cards
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  shadows: {
    small: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 3.84,
      elevation: 2,
    },
    medium: {
      shadowColor: "#8B5CF6", // Purple tint
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    soft: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 10,
    },
    large: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 16,
    }
  }
};
