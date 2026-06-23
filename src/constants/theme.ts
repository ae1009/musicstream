export const colors = {
  // Paleta principal — tomada del ícono "10"
  background:      '#F4FBF4',   // verde muy suave
  surface:         '#FFFFFF',   // tarjetas blancas
  surfaceVariant:  '#E8F5E9',   // verde claro para chips/tags
  primary:         '#4CAF50',   // verde del fondo del ícono
  primaryDark:     '#388E3C',
  secondary:       '#E8708A',   // rosa de los brazos/corazón
  secondaryLight:  '#FCE4EC',
  tertiary:        '#90B8D8',   // azul claro de los números
  tertiaryLight:   '#E3F2FD',

  // Texto
  text:            '#1A2E1A',   // verde oscuro legible
  textSecondary:   '#4A6A4A',
  textMuted:       '#8AA88A',
  textOnPrimary:   '#FFFFFF',

  // UI
  border:          '#C8E6C9',
  tabBar:          '#FFFFFF',
  card:            '#FFFFFF',
  error:           '#E53935',
  warning:         '#FB8C00',
  overlay:         'rgba(0,0,0,0.4)',

  // Gradiente para el header/hero
  gradientStart:   '#4CAF50',
  gradientEnd:     '#81C784',
} as const;

export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

export const fontSizes = {
  xs:   11,
  sm:   13,
  md:   15,
  lg:   18,
  xl:   22,
  xxl:  28,
  hero: 36,
} as const;

export const borderRadius = {
  sm:   6,
  md:   12,
  lg:   18,
  xl:   24,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;
