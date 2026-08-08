# Antigravity Guidelines & Rules (HENRY IX Website)

These rules govern the development, visual styling, coding patterns, and layout of the HENRY IX DJ Website. Every session must follow these specifications exactly.

---

## 1. Role & Core Focus
Act as an expert frontend engineer, senior audio DSP programmer, and creative UI designer. Maintain a premium, skeuomorphic, high-fidelity aesthetic inspired by analog audio equipment, Ditherboy & Script Slayer ASCII dithering, and pro DJ hardware.

Focus on building a portfolio showcase, live streaming setups, ticket booking systems, event listings, and marketing integrations.

---

## 2. Visual Design System

### A. Color Palette
Follow the core retro-futuristic dark mode theme:
* **Background:** Absolute Black (`#000000`, `bg-black`).
* **Primary Accent Color:** HENRY IX Red (`#D8163F`, `var(--color-primary)`).
* **Primary Glow:** `rgba(216, 22, 63, 0.45)` (`var(--color-primary-glow)`).
* **CDJ Symmetrical Accents:**
  * Deck 1: Red (`rgba(211,15,49,1)`)
  * Deck 2: Blue (`rgba(34,211,238,1)`)
  * Deck 3: Green (`rgba(16,185,129,1)`)
  * Deck 4: Yellow (`rgba(234,179,8,1)`)

### B. Typography
* **Primary Font:** Custom display font `Avathe` (`var(--font-avathe)`). Use for headers, titles, logo brandings, and hero elements. (Do not alter Avathe).
* **Secondary Font:** `OCR A` (`var(--font-ocra)`, `.font-mono`). Use for all terminal HUDs, speed dials, state logs, readouts, forms, and technical listings.
* **Tertiary Font:** `IBM Plex Mono` (`var(--font-ibm-plex)`, `.font-tertiary`). Use for secondary UI copy, descriptive body text, and standard code listings where clean monospaced legibility is required.

### C. Visual Effects, Glitching & Overlays
* **ASCII Dither & Glitch Aesthetics:** Incorporate Ditherboy & Script Slayer style ASCII character distortion (`░▒▓█`, `[+/--\]`), 1-bit / 2-bit Bayer halftone dither textures (`.bayer-dither`), and signal noise.
* **Vivid Glows:** Use shadow utilities like `shadow-neon-glow` (`0 0 10px var(--color-primary-glow)`) and `shadow-neon-strong` (`0 0 20px rgba(216, 22, 63, 0.65)`) for hover states on knobs, faders, and active buttons.

### D. Scrollbar Theme
* **Global Scrollbars:** Globally hidden on `html` and `body` contexts to preserve fullscreen skeuomorphic views.
* **Custom Containers:** Use the `.custom-scrollbar` utility on list panels and playlists:
  * Width/Height: `4px`
  * Track: Zinc Black (`#09090b`)
  * Thumb: Classic HENRY IX Red (`#D8163F`) with strict rectangular shape (`border-radius: 0 !important`).

---

## 3. Engineering & Performance Standards

### A. Modular Component Design
* Keep files under a reasonable length. Component subdivisions (e.g. faders, knobby controls, platters) should live in standalone files in `/components/`.
* Separate static databases, default presets, and math configurations (e.g., waveform height algorithms) into library utility folders.

### B. State Management
* **Granular Subscriptions:** Use Zustand selectors (e.g., `useAudioStore(s => s.decks)`) rather than entire store hooks to prevent render cascade.
* **Stable Hooks:** Wrap callbacks, seeks, and handlers in `React.useCallback` if they are referenced inside `useEffect` or passed to deep component branches.

### C. Client & Server Integrity
* Always import modules utilizing browser-only APIs (Canvas, AudioContext, web TTYs) dynamically with `{ ssr: false }`.
* Never assume the presence of `window` or `document` inside standard Next.js server-side renders.

---

## 4. Next-Gen Feature Guidelines

* **Live Streaming:** Incorporate low-latency Mux audio/video playback elements, combining Web Audio DSP equalizers for dynamic client-side visualizers.
* **Event & Ticket Booking:** Design skeuomorphic tickets (incorporating VHS barcode graphics, flashing status lights, and retro ticket slips).
* **Personal & Email Marketing:** Build fully animated console-like email subscription forms utilizing monospaced feedback panels.
