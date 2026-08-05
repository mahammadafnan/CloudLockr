---
name: Lumina Systems
colors:
  surface: '#faf9fe'
  surface-dim: '#dad9df'
  surface-bright: '#faf9fe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f8'
  surface-container: '#eeedf3'
  surface-container-high: '#e9e7ed'
  surface-container-highest: '#e3e2e7'
  on-surface: '#1a1b1f'
  on-surface-variant: '#414755'
  inverse-surface: '#2f3034'
  inverse-on-surface: '#f1f0f5'
  outline: '#717786'
  outline-variant: '#c1c6d7'
  surface-tint: '#005bc1'
  primary: '#0058bc'
  on-primary: '#ffffff'
  primary-container: '#0070eb'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#4c4aca'
  on-secondary: '#ffffff'
  secondary-container: '#6664e4'
  on-secondary-container: '#fffbff'
  tertiary: '#9e3d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#c64f00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c2c1ff'
  on-secondary-fixed: '#0c006a'
  on-secondary-fixed-variant: '#3631b4'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb595'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7c2e00'
  background: '#faf9fe'
  on-background: '#1a1b1f'
  surface-variant: '#e3e2e7'
typography:
  display-lg:
    fontFamily: system-ui
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: system-ui
    fontSize: 34px
    fontWeight: '700'
    lineHeight: 41px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: system-ui
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: system-ui
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: 0em
  body-lg:
    fontFamily: system-ui
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: system-ui
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  label-lg:
    fontFamily: system-ui
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: system-ui
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 13px
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 20px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style
The design system is built on a foundation of "Precision Elegance." It targets a sophisticated audience that values clarity, performance, and a premium feel. The visual language is deeply rooted in **Modern Minimalism** with a slight lean towards **Glassmorphism** for depth. 

The emotional response should be one of calm confidence and technological mastery. Every interaction should feel intentional, with generous white space and a strict adherence to a grid that conveys order and reliability. The aesthetic is clean, high-end, and frictionless, mirroring the quality of top-tier hardware integration.

## Colors
This design system utilizes a palette centered around "System Blue" and "System Indigo," ensuring immediate familiarity for users within high-performance ecosystems. 

- **Primary**: A vibrant, accessible blue used for primary actions and active states.
- **Secondary**: A deep indigo used for accentuating secondary features or specialized data visualizations.
- **Neutral**: A refined scale of grays that prioritize legibility and subtle structural separation.
- **Backgrounds**: Pure white for primary content areas, with an off-white/very light gray used for grouping elements and background depth.

## Typography
The typography leverages `system-ui` (San Francisco on Apple platforms) to achieve a native, premium aesthetic that feels integrated with the user's OS. 

The type hierarchy is designed for maximum clarity and scanability. Large display titles use tight letter spacing and heavy weights to command attention, while body text uses a slightly larger base size (17px) for optimal readability on high-resolution screens. Functional labels use medium and semi-bold weights to ensure they remain distinct even at smaller scales. Always prioritize vertical rhythm by aligning text to a 4px baseline grid.

## Layout & Spacing
The design system utilizes a **Fluid Grid** model with fixed maximum widths for content readability. 

- **Desktop**: A 12-column grid with 20px gutters and 64px side margins. 
- **Tablet**: An 8-column grid with 20px gutters and 32px side margins.
- **Mobile**: A 4-column grid with 16px gutters and 16px side margins.

Spacing follows an 8px linear scale to maintain consistent proportions. Use `md` (16px) for standard internal component padding and `lg` (24px) for vertical spacing between distinct content sections.

## Elevation & Depth
Depth is communicated through **Tonal Layers** and **Ambient Shadows**. 

Surfaces are elevated using subtle background color shifts (from white to light gray) and extremely soft, diffused shadows. Shadows should never be pure black; instead, use a 10-15% opacity of the primary neutral color with a large blur radius (e.g., `box-shadow: 0 4px 20px rgba(142, 142, 147, 0.15)`). 

For floating elements like modals or menus, apply a background-blur (Backdrop Filter) of 20px combined with 80% opacity on the surface color to create a sophisticated glass effect that maintains context of the layer beneath.

## Shapes
The shape language is consistently "Rounded," reflecting a modern and approachable feel without appearing overly playful. 

Standard components like buttons and input fields utilize a 0.5rem (8px) corner radius. Larger containers, such as cards or modals, transition to `rounded-lg` (16px) or `rounded-xl` (24px) to create a visual hierarchy of containment. This progressive rounding ensures that smaller internal elements feel nested naturally within larger parent containers.

## Components
- **Buttons**: Use high-contrast fills for primary actions. Corners must be 8px. Use semi-bold text. For secondary actions, use a subtle gray fill or an outline.
- **Cards**: Minimalist containers with a 1px soft border (#E5E5EA) and a very light ambient shadow. Use 16px corner radius.
- **Inputs**: 8px rounded corners with a 1px border. In the focused state, the border thickens or changes to the Primary Blue with a soft glow effect.
- **Chips/Badges**: Fully rounded (pill-shaped) with low-contrast background tints and dark text for categorizations.
- **Lists**: Clean, borderless rows separated by a hairline divider (0.5px) that does not span the full width (inset from the left to align with text).
- **Segmented Controls**: A signature component; use a light gray container with a white sliding "thumb" to indicate selection, mirroring native system controls.