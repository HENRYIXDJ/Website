/**
 * ============================================================================
 * HENRY IX DJ WEBSITE — CENTRAL COPY & CONTENT CONFIGURATION
 * ============================================================================
 * 
 * Edit any text in this file to update the copy across the website instantly!
 * All taglines, descriptions, headers, button labels, and section text are 
 * organized below so you can write in your authentic voice.
 * ============================================================================
 */

export const siteContent = {
  // --------------------------------------------------------------------------
  // 1. BRANDING & HERO SECTION
  // --------------------------------------------------------------------------
  hero: {
    title: "HENRY IX",
    subtitle: "ELECTRONIC MUSIC PRODUCER & DJ",
    tagline: "HYBRID LIVE SETS // ANALOG AUDIO DSP // ELECTRONIC MUSIC CULTIVATION",
    location: "LONDON / GLOBAL TRANSMISSIONS",
    statusBadge: "LIVE TRANSMISSION READY",
    deckStatus: "DECK 01 ONLINE",
  },

  // --------------------------------------------------------------------------
  // 2. MAIN NAVIGATION & HEADER
  // --------------------------------------------------------------------------
  navigation: {
    brandName: "HENRY IX",
    tabs: [
      { id: "mixes", label: "MIXES", href: "/mixes" },
      { id: "gallery", label: "GALLERY", href: "/gallery" },
      { id: "live", label: "LIVE", href: "/live" },
      { id: "events", label: "EVENTS", href: "/events" },
      { id: "contact", label: "CONTACT", href: "/contact" },
    ],
  },

  // --------------------------------------------------------------------------
  // 3. MIX ARCHIVE PAGE & SOUNDCLOUD STREAMING
  // --------------------------------------------------------------------------
  mixArchive: {
    sectionTitle: "01 / MIX ARCHIVE",
    description: "Explore live recordings, radio broadcasts, and curated DJ sets. Streaming in high-fidelity 3-band audio.",
    browserHeader: "DECK PLAYLIST BROWSER",
    nowPlayingPrefix: "NOW PLAYING",
    emptyState: "NO MIXES LOADED IN DECK",
    filters: {
      all: "ALL SETS",
      club: "CLUB SETS",
      radio: "RADIO SHOWS",
      live: "LIVE TRANSMISSIONS",
    },
  },

  // --------------------------------------------------------------------------
  // 4. LIVE STREAMING & TRANSMISSION PAGE
  // --------------------------------------------------------------------------
  live: {
    title: "LIVE TRANSMISSION",
    badge: "LIVE BROADCAST",
    offlineMessage: "STUDIO OFFLINE — STANDBY FOR NEXT TRANSMISSION",
    onlineMessage: "LIVE STREAM ACTIVE — HIGH FIDELITY STEREO FEED",
    chatTitle: "TELEMETRY CHAT & COMMENTS",
    chatPlaceholder: "ENTER TRANSMISSION MESSAGE...",
    sendButton: "SEND",
  },

  // --------------------------------------------------------------------------
  // 5. EVENTS & TICKET BOOKING PAGE
  // --------------------------------------------------------------------------
  events: {
    sectionTitle: "UPCOMING DATES & SHOWS",
    description: "Catch upcoming live sets, club nights, and international tour dates.",
    ticketButton: "SECURE TICKET",
    soldOutButton: "CAPACITY REACHED",
    locationLabel: "VENUE / LOCATION",
    dateLabel: "DATE & TIME",
  },

  // --------------------------------------------------------------------------
  // 6. GALLERY & MEDIA PAGE
  // --------------------------------------------------------------------------
  gallery: {
    title: "GALLERY / VISUAL TELEMETRY",
    description: "Behind the scenes, live performances, analog equipment, and stage production snapshots.",
    filterAll: "ALL MEDIA",
    filterLive: "LIVE SHOWS",
    filterStudio: "STUDIO / GEAR",
  },

  // --------------------------------------------------------------------------
  // 7. CONTACT & BOOKING CONSOLE
  // --------------------------------------------------------------------------
  contact: {
    title: "BOOKINGS & INQUIRIES",
    description: "For gig bookings, press inquiries, management, or production collaborations.",
    form: {
      namePlaceholder: "YOUR NAME",
      emailPlaceholder: "YOUR EMAIL ADDRESS",
      subjectPlaceholder: "INQUIRY SUBJECT (e.g. Booking / Remix / Collaboration)",
      messagePlaceholder: "ENTER MESSAGE OR EVENT DETAILS...",
      submitButton: "TRANSMIT INQUIRY",
      successMessage: "INQUIRY TRANSMITTED SUCCESSFULLY. WILL RESPOND SHORTLY.",
    },
    directContacts: {
      managementEmail: "management@henryix.com",
      bookingEmail: "booking@henryix.com",
      location: "London, UK",
    },
  },

  // --------------------------------------------------------------------------
  // 8. INNER CIRCLE / NEWSLETTER SUBSCRIPTION FORM
  // --------------------------------------------------------------------------
  newsletter: {
    title: "THE INNER CIRCLE",
    description: "Subscribe for exclusive mix downloads, secret gig announcements, and unreleased tracks.",
    placeholder: "ENTER EMAIL ADDRESS...",
    buttonText: "JOIN",
    successMessage: "TRANSMISSION RECEIVED — YOU'RE ON THE LIST.",
  },

  // --------------------------------------------------------------------------
  // 9. FOOTER & LEGAL
  // --------------------------------------------------------------------------
  footer: {
    copyright: "© HENRY IX. ALL RIGHTS RESERVED.",
    tagline: "BUILT WITH HIGH FIDELITY AUDIO DSP & RETRO HARDWARE AESTHETICS.",
    links: [
      { label: "PRIVACY POLICY", href: "/privacy" },
      { label: "TERMS", href: "/privacy" },
    ],
  },
};

export default siteContent;
