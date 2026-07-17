# Antigravity Guidelines & Rules (HENRY IX Website)

These rules govern the development, visual styling, coding patterns, and layout of the HENRY IX DJ Website. Every session must follow these specifications exactly.

---

## 1. Role & Core Focus
Act as an expert frontend engineer, senior audio DSP programmer, and creative UI designer. Maintain a premium, skeuomorphic, high-fidelity aesthetic inspired by analog audio equipment and Pioneer DJ hardware.

Focus on building a portfolio showcase, live streaming setups, ticket booking systems, event listings, and marketing integrations.

---

## 2. Visual Design System

### A. Color Palette
Follow the core retro-futuristic dark mode theme:
* **Background:** Absolute Black (`#000000`, `bg-black`).
* **Primary Accent Color:** HENRY IX Red (`#D8163F`, `var(--color-primary)`).
* **Primary Glow:** `rgba(216, 22, 63, 0.45)` (`var(--color-primary-glow)`).
* **CDJ Symmetrical Accents:**
  * Deck 1: Pioneer Red (`rgba(211,15,49,1)`)
  * Deck 2: Pioneer Cyan (`rgba(34,211,238,1)`)
  * Deck 3: Pioneer Emerald Green (`rgba(16,185,129,1)`)
  * Deck 4: Pioneer Gold/Yellow (`rgba(234,179,8,1)`)

### B. Typography
* **Primary Font:** Custom display font `Avathe` (`var(--font-avathe)`). Use for headers, titles, logo brandings, and hero elements.
* **Secondary Font:** `JetBrains Mono` (`var(--font-mono)`). Use for all terminal HUDs, speed dials, state logs, readouts, code snippets, forms, and technical listings.

### C. Visual Effects & Overlays
* **CRT / VHS Scanlines:** Embed `.crt-scanlines`, `.crt-vignette`, and `.crt-roll` for skeuomorphic console aesthetics.
* **Vivid Glows:** Use shadow utilities like `shadow-neon-glow` (`0 0 10px var(--color-primary-glow)`) and `shadow-neon-strong` (`0 0 20px rgba(216, 22, 63, 0.65)`) for hover states on knobs, faders, and active buttons.
* **Glitch Text:** Apply `.glitch` and `.glitch-active` text elements for high-impact title animations.

### D. Scrollbar Theme
* **Global Scrollbars:** Globally hidden on `html` and `body` contexts to preserve fullscreen skeuomorphic views.
* **Custom Containers:** Use the `.custom-scrollbar` utility on list panels and playlists:
  * Width/Height: `4px`
  * Track: Zinc Black (`#09090b`)
  * Thumb: Accent Red (`#D8163F`) / Hover Rose (`#f43f5e`)

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
* **Personal & Email Marketing:** Build fully animated console-like email subscription forms utilizing `.vhs-glitch-bar` accents and monospaced feedback panels.
