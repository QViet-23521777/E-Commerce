---
name: Nordic Frost
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#3a494b'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#6a7a7b'
  outline-variant: '#b9cacb'
  surface-tint: '#00696f'
  primary: '#00696f'
  on-primary: '#ffffff'
  primary-container: '#00f3ff'
  on-primary-container: '#006b71'
  inverse-primary: '#00dce6'
  secondary: '#4a5e88'
  on-secondary: '#ffffff'
  secondary-container: '#bacfff'
  on-secondary-container: '#435881'
  tertiary: '#4d6268'
  on-tertiary: '#ffffff'
  tertiary-container: '#c9e0e8'
  on-tertiary-container: '#4f646a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#6ff6ff'
  primary-fixed-dim: '#00dce6'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f53'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#b2c6f7'
  on-secondary-fixed: '#001a41'
  on-secondary-fixed-variant: '#32466f'
  tertiary-fixed: '#d0e6ee'
  tertiary-fixed-dim: '#b4cad2'
  on-tertiary-fixed: '#081e24'
  on-tertiary-fixed-variant: '#354a50'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
  button:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

This design system embodies a "Nordic Frost" aesthetic: a high-tech, ultra-clean atmosphere that mimics the clarity of an arctic landscape. The brand personality is clinical, efficient, and uncompromisingly modern. It targets a sophisticated audience that values speed and precision in a high-end shopping environment.

The design style is **High-Contrast Minimalism**. It utilizes a restricted palette and aggressive whitespace to drive focus toward product imagery and data. Structural integrity is maintained through sharp, deep-navy borders rather than soft shadows, creating a UI that feels engineered and structural. The interface should feel cold to the touch, punctuated only by high-energy "Neon Cyan" interaction points that guide the user through the commerce funnel with surgical accuracy.

## Colors

The palette is anchored by a stark white background to ensure maximum luminosity. **Neon Cyan (#00F3FF)** is reserved exclusively for primary actions, success states, and critical paths, acting as a digital "heat signature" in a cold environment. 

**Deep Navy (#001A41)** serves as the structural foundation, used for typography and high-contrast borders. **Ice Blue (#E0F7FF)** provides subtle tonal shifts for secondary surfaces or hover states, preventing the white-on-white layout from feeling depthless. Contrast ratios must never fall below AAA for functional text to maintain the "precision" vibe.

## Typography

This design system uses **Inter** across all levels to maintain a neutral, systematic, and utilitarian feel. The typographic hierarchy is strict. Large display headers use heavy weights and negative letter spacing to feel dense and "tech-forward." 

Utility labels and small metadata should be set in uppercase with increased letter spacing to mimic serial numbers or technical specifications. Body text remains clean and highly legible with generous line heights to preserve the sense of whitespace.

## Layout & Spacing

The layout follows a **Fixed Grid** model on desktop (12 columns) and a fluid 4-column grid on mobile. The spacing rhythm is strictly based on a 4px baseline, but defaults to larger increments (24px/48px) to reinforce the minimal, airy aesthetic.

- **Desktop:** 1280px max-width container, centered.
- **Gutters:** Consistent 24px gutters to create clear vertical channels.
- **Margins:** Aggressive outer margins (40px+) to isolate the content as a "module" within the viewport.
- **Alignment:** All elements must align to the grid edges; avoid "floating" elements that do not snap to the established vertical lines.

## Elevation & Depth

In this design system, depth is achieved through **Bold Borders** and **Tonal Layering** rather than traditional shadows. 

1.  **Level 0 (Base):** Pure White (#FFFFFF).
2.  **Level 1 (Containers/Cards):** White surface with a 1px or 2px Deep Navy (#001A41) border. No shadow.
3.  **Level 2 (Interaction):** When an item is active or hovered, it may receive a subtle "Ice Blue" fill or a thicker Neon Cyan border.
4.  **Overlays:** Modals use a high-opacity white backdrop (90%) to blur out the background, keeping the focus clinical and isolated.

Avoid all blurs or soft glows except for the primary Neon Cyan buttons, which may have a very slight, sharp outer stroke to simulate a light-emissive surface.

## Shapes

The shape language is controlled and "architectural." By using **ROUND_TWO**, we soften the brutalism just enough to feel like a premium consumer product without losing the "engineered" precision.

- **Standard Buttons/Inputs:** 0.5rem (8px) corner radius.
- **Large Cards/Containers:** 1rem (16px) corner radius.
- **Icons:** Use linear, 2px stroke icons with slightly rounded caps to match the border weights of the UI.

## Components

### Buttons
- **Primary:** Neon Cyan background, Deep Navy text. Bold, 14px uppercase. No shadow.
- **Secondary:** Deep Navy border (2px), transparent background, Deep Navy text.
- **Tertiary:** Transparent background, Deep Navy text with a Neon Cyan underline on hover.

### Input Fields
- **Default:** White background, 1px Deep Navy border. Placeholder text in muted Ice Blue-Grey.
- **Focus:** 2px Neon Cyan border. The label shifts to an uppercase "mini-label" above the field.

### Cards
- White background with a 1px Deep Navy border. Product images should be high-key (shot against white or light grey) to blend into the card surface.

### Chips & Tags
- Rectangular with 8px radius. Deep Navy background with Neon Cyan text for "New" or "Sale" alerts.

### Progress Indicators
- Use thin, 2px Neon Cyan lines. Avoid circular loaders; use horizontal "scanning" bars to reinforce the high-tech, precise vibe of the design system.