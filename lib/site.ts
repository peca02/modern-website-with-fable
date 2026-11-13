export const SITE = {
  name: "Skein",
  legalName: "Skein Fusion Systems",
  tagline: "A star, held by thread.",
  description:
    "Skein builds stellarators: twisted magnetic bottles that hold a 150-million-degree plasma steady, continuously, without the current that tears other machines apart.",
  url: "https://skein-fusion.example",
  credit: "Your Name",
  conceptNote: "Fictional concept site. Skein is not a real company.",
} as const;

export const CHAPTERS = [
  { id: "thread", index: "01", label: "Thread" },
  { id: "tension", index: "02", label: "Tension" },
  { id: "winding", index: "03", label: "Winding" },
  { id: "ignition", index: "04", label: "Ignition" },
  { id: "inside", index: "05", label: "Inside" },
  { id: "yield", index: "06", label: "Yield" },
  { id: "tie-in", index: "07", label: "Tie-in" },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]["id"];

export const CHAPTER_COUNT = CHAPTERS.length;

export function chapterIndex(id: ChapterId): number {
  return CHAPTERS.findIndex((chapter) => chapter.id === id);
}
