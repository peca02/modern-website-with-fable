/** All site copy. Server components render it; nothing here is placeholder text. */

export const HERO = {
  eyebrow: "Stellarator programme · Leith Docks, Edinburgh",
  title: "A star, held by thread.",
  lead: "Skein winds magnetic fields into a bottle for a 150-million-degree plasma. Steady, for weeks, with no current in the plasma to snap.",
  definition: {
    word: "skein",
    phonetic: "/skeɪn/",
    partOfSpeech: "noun",
    meaning: "A length of thread, loosely coiled and twisted.",
  },
  stats: [
    { value: "150,000,000", unit: "°C", label: "Plasma temperature" },
    { value: "9.2", unit: "T", label: "Field on axis" },
    { value: "31", unit: "days", label: "Continuous burn, design target" },
  ],
  scrollHint: "Scroll to pull the thread",
} as const;

export const TENSION = {
  title: "Plasma does not want to be held.",
  statements: [
    {
      heading: "The sun cheats.",
      body: "It confines its fuel with gravity: two thousand billion billion billion kilograms of it. We have a building.",
    },
    {
      heading: "So we use a field.",
      body: "Charged particles follow magnetic field lines the way beads follow a wire. Close the wire into a ring and the bead stays put. Almost.",
    },
    {
      heading: "Almost is the whole problem.",
      body: "In a plain ring, particles drift out within milliseconds. Tokamaks stop the drift by driving a vast current through the plasma itself. When that current kinks, the machine takes a blow measured in tonnes. We twist the field instead.",
    },
  ],
  comparison: {
    label: "Energy confinement time",
    before: { value: "4", unit: "ms", caption: "Plain ring, no twist" },
    after: { value: "2.1", unit: "s", caption: "Skein field, measured 2025" },
  },
  quote: "Twist the bottle, not the plasma.",
} as const;

export const WINDING = {
  title: "Six layers between a star and a Tuesday afternoon.",
  intro: "Everything in the machine exists to keep one thing off the walls. Scroll to open it.",
  layers: [
    {
      name: "Plasma",
      spec: "150,000,000 °C",
      body: "Deuterium and tritium, ten times hotter than the sun's core, at a millionth of the density of air.",
    },
    {
      name: "First wall",
      spec: "Tungsten · 12 mm",
      body: "The only solid thing that ever sees the plasma. Takes 0.9 megawatts per square metre without flinching.",
    },
    {
      name: "Breeding blanket",
      spec: "Lithium–lead · TBR 1.14",
      body: "Catches the neutrons, turns them into heat, and breeds the tritium for tomorrow's fuel.",
    },
    {
      name: "Vacuum vessel",
      spec: "10⁻¹⁰ atm",
      body: "Double-walled steel, pumped down to a ten-billionth of an atmosphere so the plasma meets nothing but itself.",
    },
    {
      name: "Field coils",
      spec: "50 coils · 9.2 T · 20 K",
      body: "Non-planar windings of REBCO superconducting tape, no two neighbours alike, placed to within 0.4 millimetres.",
    },
    {
      name: "Cryostat",
      spec: "−253 °C",
      body: "The thermos. It keeps the coils colder than deep space, one metre from the hottest place in the solar system.",
    },
  ],
  closing: {
    value: "150,000,253",
    unit: "°C",
    caption: "Temperature difference across 1.1 metres of machine.",
  },
} as const;

export const IGNITION = {
  title: "Hold to heat.",
  intro: "Heating a plasma is not a switch. It is a held note. Press and hold, or keep scrolling.",
  button: { idle: "Hold to heat", holding: "Heating", done: "Burning" },
  peakTemperature: 150_000_000,
  stages: [
    { at: 0, name: "Cold gas", detail: "Deuterium at room temperature. Nothing to see." },
    { at: 0.12, name: "Breakdown", detail: "10,000 °C. Electrons leave their atoms: the gas becomes a plasma." },
    { at: 0.36, name: "Microwave heating", detail: "Twelve gyrotrons at 140 GHz pour 15 megawatts into the electrons." },
    { at: 0.66, name: "Neutral beams", detail: "Fast atoms are fired across the field to heat the ions directly." },
    { at: 0.94, name: "Burn", detail: "Fusion heats itself. The gyrotrons throttle back. The plasma is its own furnace." },
  ],
  readouts: [
    { label: "Fusion power", peak: 480, unit: "MW", decimals: 0 },
    { label: "Gain, Q", peak: 12, unit: "", decimals: 1 },
  ],
  ignited: "It holds.",
} as const;

export const INSIDE = {
  title: "Inside the thread.",
  facts: [
    { lead: "You are inside the plasma.", body: "It is mostly nothing: a millionth of the density of air." },
    { lead: "46 microseconds.", body: "One lap of the ring for a deuterium ion. It makes 21,000 a second." },
    { lead: "No current to kink.", body: "The field is wound into the coils, not driven through the fuel. There is nothing here to disrupt." },
    { lead: "Five turns, then home.", body: "Each line of force closes on itself to within the width of a hair." },
  ],
  exit: "Then the fusion starts.",
} as const;

export const YIELD = {
  title: "Unwound, it is just power.",
  intro: "A stellarator has no pulse. It runs like a river, not a drum. What comes out is flat, boring, bankable heat.",
  stats: [
    { value: "480", unit: "MW", label: "Thermal output" },
    { value: "190", unit: "MW", label: "Delivered to the grid" },
    { value: "94", unit: "%", label: "Availability target" },
    { value: "0", unit: "g", label: "CO₂ at the stack" },
  ],
  roadmapLabel: "The thread so far",
  milestones: [
    {
      year: "2021",
      name: "First coil",
      body: "Coil A-01 is wound in a rented shipyard hall. It meets the 0.4 mm tolerance on the third attempt.",
      plate: "winding",
      status: "Done",
    },
    {
      year: "2024",
      name: "Skein Zero",
      body: "A fifth-scale field cage with no plasma, built to prove the magnetic surfaces close. They do, to one part in 100,000.",
      plate: "poincare",
      status: "Done",
    },
    {
      year: "2027",
      name: "First plasma",
      body: "Skein One lights hydrogen for a hundred seconds. Then a thousand.",
      plate: "thermal",
      status: "In build",
    },
    {
      year: "2030",
      name: "The long burn",
      body: "Thirty-one days of continuous deuterium plasma: the longest ever held by anyone.",
      plate: "trace",
      status: "Planned",
    },
    {
      year: "2034",
      name: "On the grid",
      body: "Skein Two at Hunterston delivers 190 megawatts to 400,000 homes, around the clock.",
      plate: "grid",
      status: "Planned",
    },
  ],
} as const;

export type PlateKind = (typeof YIELD.milestones)[number]["plate"];

export const TIE_IN = {
  title: "Take a thread.",
  intro: "Four times a year we brief utilities, heavy industry and the plainly curious. Leave a name and we will tie you in.",
  dragHint: "Drag to turn the star",
  form: {
    name: { label: "Name", error: "Tell us what to call you." },
    email: { label: "Work email", error: "That address does not look complete." },
    organisation: { label: "Organisation", optional: "Optional" },
    interest: {
      label: "What would you power?",
      options: ["A city", "A steel mill", "A data centre", "Just curious"],
      error: "Pick the closest one.",
    },
    submit: "Tie me in",
    sending: "Winding",
    privacy: "Nothing leaves this page. This is a concept site with no backend.",
  },
  success: {
    title: "You are on the loom.",
    body: "A thread is reserved in your name. Nothing was sent anywhere, but the star is real: it is 150 million kilometres away and has been burning for 4.6 billion years.",
    referenceLabel: "Thread reference",
    reset: "Tie in someone else",
  },
} as const;

export const FOOTER = {
  copyright: "© 2026 Skein Fusion Systems",
  creditLabel: "Designed & built by",
  top: "Back to the first thread",
} as const;
