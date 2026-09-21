import type { TrainingProgramme } from "@/types/training";

export function getPublishedProgrammes(programmes: TrainingProgramme[]): TrainingProgramme[] {
  return programmes.filter((p) => p.published);
}

export function getNextProgramme(programmes: TrainingProgramme[]): TrainingProgramme | null {
  const published = getPublishedProgrammes(programmes);
  const future = published.filter((p) => p.status === "open" && p.startDate && p.startDate > new Date());

  if (future.length === 0) return null;

  return future.sort((a, b) => (a.startDate || new Date()).getTime() - (b.startDate || new Date()).getTime())[0];
}

export function getMoreProgrammes(programmes: TrainingProgramme[]): TrainingProgramme[] {
  const published = getPublishedProgrammes(programmes);
  const next = getNextProgramme(programmes);

  return published
    .filter((p) => (p.status === "open" || p.status === "ongoing") && p.id !== next?.id)
    .sort((a, b) => (a.startDate || new Date()).getTime() - (b.startDate || new Date()).getTime());
}

export function getPreviousProgrammes(programmes: TrainingProgramme[]): TrainingProgramme[] {
  const published = getPublishedProgrammes(programmes);

  return published
    .filter((p) => p.status === "previous")
    .sort((a, b) => (b.endDate || new Date()).getTime() - (a.endDate || new Date()).getTime());
}
