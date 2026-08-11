# HENRY IX DJ Website — Asset Requirements & Sourcing Checklist

> [!IMPORTANT]
> **Strict Content Policy:** NO AI-generated images, NO AI-generated sound effects, and NO AI-generated written text are allowed on this website. All media and text must be authentic, original, or manually sourced/rendered by Henry.

---

## 1. Required Image Assets & Specifications

Below is the complete list of images required for browser icons, mobile PWA support, social media sharing cards, and page hero elements.

| Asset Name | Required File Path | Dimensions (Pixels) | Aspect Ratio | Format | Description & Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Favicon Icon** | `/public/favicon.ico` | `32x32` & `16x16` | 1:1 Square | `.ico` | Main browser tab icon. Clean, high-contrast HENRY IX DJ logo. |
| **Vector App Logo** | `/public/icon.svg` | Scalable Vector | Any | `.svg` | Vector logo used for crisp rendering across retina displays. |
| **Apple Touch Icon** | `/public/apple-icon.png` | `180x180` | 1:1 Square | `.png` | Displayed when users bookmark the website to iOS Home Screen. |
| **Android PWA Icon (Standard)**| `/public/icon-192.png` | `192x192` | 1:1 Square | `.png` | PWA web app launcher icon for Android mobile devices. |
| **Android PWA Icon (High-Res)** | `/public/icon-512.png` | `512x512` | 1:1 Square | `.png` | High-density PWA splash screen & app icon. |
| **Main OpenGraph Social Card** | `/public/og-image.jpg` | `1200x630` | 1.91:1 | `.jpg` / `.png` | Displayed on Twitter, iMessage, WhatsApp, Facebook, and LinkedIn when sharing `henryix.com`. |
| **Default Mix Social Card** | `/public/og-mix-default.jpg` | `1200x630` | 1.91:1 | `.jpg` / `.png` | Fallback social sharing card for DJ mix links when specific track artwork is unavailable. |
| **Default Mix Artwork** | `/public/images/mix-placeholder.jpg` | `1000x1000` | 1:1 Square | `.jpg` / `.png` | High-quality dark/skeuomorphic placeholder for sets without custom artwork. |
| **Hero DJ Booth Photo** | `/public/images/henry-profile-hero.jpg`| `1200x1600` | 3:4 Portrait | `.jpg` | High-resolution DJ booth / performance photo of HENRY IX for home page hero. |

---

## 2. Required Sound Effects & Audio Specifications

Below is the complete list of UI sound effects used or required across the skeuomorphic CDJ decks, knobs, faders, and navigation HUD.

| Sound ID | Target File Path | Ideal Length | Character & Sonic Description | Trigger Location |
| :--- | :--- | :--- | :--- | :--- |
| **`click`** | `/public/sounds/click.wav` | `30ms – 50ms` | Crisp, tactile mechanical switch click (Pioneer CDJ Cue/Play button snap). | CDJ Cue/Play buttons, mode toggles, tactile buttons. |
| **`tick`** | `/public/sounds/tick.wav` | `15ms – 25ms` | High-frequency rotary encoder step click (CDJ track browse knob tick). | Parameter knobs, jog wheel ticks, volume steps. |
| **`degauss`** | `/public/sounds/degauss.wav` | `800ms – 1000ms` | CRT monitor power-on magnetic coil hum with sub-bass drop & high laser sweep. | Deck power-on sequence, full system reset. |
| **`lockout`** | `/public/sounds/lockout.wav` | `300ms – 400ms` | Low resonant warning blip / analog buzz. | Invalid cueing attempt, locked deck interaction. |
| **`swoosh`** | `/public/sounds/swoosh.wav` | `400ms – 600ms` | Smooth analog noise filter sweep / tape swoosh. | Drawer slide, modal opening, page transitions. |
| **`tab-click`** | `/public/sounds/tab-click.wav` | `50ms – 80ms` | Clean synth relay click or subtle needle drop tick. | Crate tab switches, filter category toggles. |
| **`scratch-brake`** | `/public/sounds/scratch-brake.wav`| `200ms – 500ms` | Authentic vinyl brake / platter touch scratch backspin audio. | Jog wheel platter touch grab & release. |

---

## 3. Developer & User TODO Notes (`NOTES.md`)

* **EPK (Electronic Press Kit):** Henry is manually designing his own press materials. Finalized PDF should be placed in `/public/Henry_IX_EPK.pdf`.
* **Custom Video Visualizers:** Henry will create and render his own video visualizers. The website audio player will support loading user-uploaded `.mp4` / `.webm` background visualizer loops.
* **Tour / Gig Dates:** Gig map disabled for now until official event dates are announced.
