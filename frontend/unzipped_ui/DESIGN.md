---
name: Vivid Noir Light
colors:
  surface: '#f9f9fe'
  surface-dim: '#d9dade'
  surface-bright: '#f9f9fe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f8'
  surface-container: '#ededf2'
  surface-container-high: '#e8e8ed'
  surface-container-highest: '#e2e2e7'
  on-surface: '#1a1c1f'
  on-surface-variant: '#414755'
  inverse-surface: '#2e3034'
  inverse-on-surface: '#f0f0f5'
  outline: '#717786'
  outline-variant: '#c1c6d7'
  surface-tint: '#005bc1'
  primary: '#0058bc'
  on-primary: '#ffffff'
  primary-container: '#0070eb'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#5f5e60'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfe1'
  on-secondary-container: '#636264'
  tertiary: '#5b5c60'
  on-tertiary: '#ffffff'
  tertiary-container: '#747479'
  on-tertiary-container: '#fefcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#e4e2e4'
  secondary-fixed-dim: '#c8c6c8'
  on-secondary-fixed: '#1b1b1d'
  on-secondary-fixed-variant: '#474649'
  tertiary-fixed: '#e3e2e7'
  tertiary-fixed-dim: '#c6c6cb'
  on-tertiary-fixed: '#1a1b1f'
  on-tertiary-fixed-variant: '#46464b'
  background: '#f9f9fe'
  on-background: '#1a1c1f'
  surface-variant: '#e2e2e7'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 56px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.25'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: '0'
  title-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: '0'
  body-lg:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system embodies a premium, high-fidelity aesthetic that merges the clarity of modern minimalism with the sophisticated depth of glassmorphism. It targets a discerning audience that values precision, luxury, and a seamless user experience. The emotional response is one of calm authority and technological refinement.

The style utilizes a "Light Noir" approach: a predominantly white and light-grey environment punctuated by deep, high-contrast accents and vibrant primary highlights. Frosted glass surfaces, subtle background blurs, and pin-sharp typography create a sense of multi-dimensional space that feels both ethereal and grounded.

## Colors

The palette is anchored by a pure, luminous white background, allowing the primary "Electric Blue" to act as a precision tool for interaction. The secondary "Noir" provides the necessary weight for structural elements and primary text, ensuring a high-contrast, accessible experience. 

- **Primary**: A vibrant, high-saturation blue used for calls to action and active states.
- **Secondary**: A deep, near-black grey for primary headers and high-emphasis icons.
- **Tertiary**: A neutral mid-grey for secondary information and disabled states.
- **Neutral**: A series of soft, cool greys used for subtle layering and container backgrounds.

## Typography

This design system leverages **Inter** to replicate a systematic, high-end editorial feel characteristic of premium OS interfaces. The type scale is built on a tight hierarchy with generous leading to ensure legibility and a sense of "breathable" luxury.

Key typographic principles:
- **Optical Sizing**: Use tighter letter-spacing and heavier weights for display sizes to maintain impact.
- **Tracking**: Small labels and captions utilize increased tracking to maintain clarity at reduced scales.
- **Contrast**: Bold weights are reserved for headers and critical UI labels, while body text remains in regular weight for maximum comfort during long-reading sessions.

## Layout & Spacing

The design system employs a **fluid grid** logic with fixed maximum widths for content containers to ensure readability on ultra-wide displays. A strict 4px base unit governs all spatial relationships.

- **Desktop**: 12-column grid with 24px gutters. Margins scale with viewport width but cap at 64px.
- **Tablet**: 8-column grid with 20px gutters and 32px margins.
- **Mobile**: 4-column grid with 16px gutters and 16px margins.

Vertical rhythm is maintained through standardized "Stack" units, ensuring consistent white space between logical sections of the interface.

## Elevation & Depth

Depth is articulated through **Glassmorphism** and **Tonal Layers** rather than heavy shadows. This maintains a light, airy feel even when multiple layers are active.

- **Level 0 (Base)**: Solid neutral-100 or white.
- **Level 1 (Cards/Lists)**: Subtle 1px inside border (opacity 10% Noir) or a very soft, high-diffusion shadow (0px 4px 20px, 5% Noir).
- **Level 2 (Modals/Popovers)**: 20px Backdrop blur with a semi-transparent white fill (70-80% opacity). A crisp 0.5px "hairline" border is used to define the edge against the background.
- **Interactions**: On hover, elements slightly increase in scale (102%) and the backdrop blur intensity increases, creating a tactile "lifting" effect.

## Shapes

The shape language is consistently "Rounded," avoiding the playfulness of pill shapes while shunning the severity of sharp corners. 

- **Base Radius**: 0.5rem (8px) for standard buttons and input fields.
- **Large Radius**: 1rem (16px) for cards, modals, and container elements.
- **Extra Large Radius**: 1.5rem (24px) reserved for large hero sections or featured promotional containers.

Consistent corner smoothing is encouraged to replicate the "squircle" look found in premium hardware and software ecosystems.

## Components

### Buttons
Primary buttons use a solid primary color with white text. Secondary buttons utilize a subtle glass effect (blur + semi-transparent grey) with secondary color text. All buttons have a fixed height (e.g., 44px for touch targets) and 0.5rem rounded corners.

### Input Fields
Fields are defined by a light grey fill (neutral-200) and no border in their rest state. On focus, they transition to a white background with a 1px primary color border and a subtle "glow" shadow.

### Cards
Cards are the primary container. They should use a white background or a high-blur glass effect depending on the background complexity. Content within cards follows the standard 16px or 24px internal padding rules.

### Chips & Tags
Chips are small, highly rounded (pill-shaped) elements used for categorization. They use the `label-sm` typography and a low-contrast background to avoid distracting from primary actions.

### Lists
Lists use thin horizontal dividers (0.5px, 10% Noir) that stop short of the container edge to create a refined, "inset" look. Leading icons should be monochrome and high-precision.