/**
 * Z Founders Design System
 * Complete theme configuration with colors, typography, spacing, and component tokens
 */

export const colors = {
    // Primary palette
    primary: {
        50: '#F5F3FF',
        100: '#EDE9FE',
        200: '#DDD6FE',
        300: '#C4B5FD',
        400: '#A78BFA',
        500: '#8B5CF6', // Main primary - Electric Purple
        600: '#7C3AED',
        700: '#6D28D9',
        800: '#5B21B6',
        900: '#4C1D95',
    },

    // Secondary - Deep Navy
    secondary: {
        50: '#F8FAFC',
        100: '#F1F5F9',
        200: '#E2E8F0',
        300: '#CBD5E1',
        400: '#94A3B8',
        500: '#64748B',
        600: '#475569',
        700: '#334155',
        800: '#1E293B', // Main secondary
        900: '#0F172A',
    },

    // Accent - Coral
    accent: {
        50: '#FFF7ED',
        100: '#FFEDD5',
        200: '#FED7AA',
        300: '#FDBA74',
        400: '#FB923C',
        500: '#F97316', // Main accent
        600: '#EA580C',
        700: '#C2410C',
        800: '#9A3412',
        900: '#7C2D12',
    },

    // Semantic colors
    success: {
        light: '#D1FAE5',
        main: '#10B981',
        dark: '#059669',
    },
    warning: {
        light: '#FEF3C7',
        main: '#F59E0B',
        dark: '#D97706',
    },
    error: {
        light: '#FFE4E6',
        main: '#F43F5E',
        dark: '#E11D48',
    },
    info: {
        light: '#DBEAFE',
        main: '#3B82F6',
        dark: '#2563EB',
    },

    // Neutral
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',

    // Background
    background: {
        primary: '#0F172A',
        secondary: '#1E293B',
        tertiary: '#334155',
        card: '#1E293B',
        elevated: '#334155',
    },

    // Text
    text: {
        primary: '#F8FAFC',
        secondary: '#94A3B8',
        tertiary: '#64748B',
        disabled: '#475569',
        inverse: '#0F172A',
    },

    // Border
    border: {
        light: '#334155',
        medium: '#475569',
        dark: '#64748B',
    },

    // Account type badges
    badges: {
        founder: '#8B5CF6',
        builder: '#10B981',
        investor: '#F59E0B',
        verified: '#3B82F6',
    },
};

export const typography = {
    // Font families
    fontFamily: {
        regular: 'Inter-Regular',
        medium: 'Inter-Medium',
        semiBold: 'Inter-SemiBold',
        bold: 'Inter-Bold',
    },

    // Font sizes
    fontSize: {
        xs: 10,
        sm: 12,
        md: 14,
        base: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
        '5xl': 48,
    },

    // Line heights
    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },

    // Pre-defined text styles
    styles: {
        h1: {
            fontFamily: 'Inter-Bold',
            fontSize: 30,
            lineHeight: 36,
        },
        h2: {
            fontFamily: 'Inter-Bold',
            fontSize: 24,
            lineHeight: 32,
        },
        h3: {
            fontFamily: 'Inter-SemiBold',
            fontSize: 20,
            lineHeight: 28,
        },
        h4: {
            fontFamily: 'Inter-SemiBold',
            fontSize: 18,
            lineHeight: 24,
        },
        body: {
            fontFamily: 'Inter-Regular',
            fontSize: 16,
            lineHeight: 24,
        },
        bodyMedium: {
            fontFamily: 'Inter-Medium',
            fontSize: 16,
            lineHeight: 24,
        },
        small: {
            fontFamily: 'Inter-Regular',
            fontSize: 14,
            lineHeight: 20,
        },
        caption: {
            fontFamily: 'Inter-Regular',
            fontSize: 12,
            lineHeight: 16,
        },
        button: {
            fontFamily: 'Inter-SemiBold',
            fontSize: 16,
            lineHeight: 24,
        },
    },
};

export const spacing = {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
    24: 96,
};

export const borderRadius = {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    full: 9999,
};

export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 16,
    },
    glow: {
        shadowColor: colors.primary[500],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
    },
};

// Component-specific tokens
export const components = {
    button: {
        height: {
            sm: 36,
            md: 44,
            lg: 52,
        },
        paddingHorizontal: {
            sm: 12,
            md: 20,
            lg: 28,
        },
    },
    input: {
        height: 52,
        paddingHorizontal: 16,
        borderWidth: 1,
    },
    card: {
        padding: 16,
        borderRadius: 16,
    },
    avatar: {
        sizes: {
            sm: 32,
            md: 44,
            lg: 64,
            xl: 96,
        },
    },
    video: {
        aspectRatio: 9 / 16, // Vertical video
        borderRadius: 16,
    },
};

// Animation durations
export const animation = {
    fast: 150,
    normal: 300,
    slow: 500,
};

export default {
    colors,
    typography,
    spacing,
    borderRadius,
    shadows,
    components,
    animation,
};
