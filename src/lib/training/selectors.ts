import type { TrainingProgramme } from "@/types/training";

function isValidDate(date: Date | undefined): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}

export function getPublishedProgrammes(programmes: TrainingProgramme[]): TrainingProgramme[] {
  return programmes.filter((p) => p.published);
}

export function getNextProgramme(programmes: TrainingProgramme[]): TrainingProgramme | null {
  const published = getPublishedProgrammes(programmes);
  const now = new Date();
  const future = published.filter((p) => p.status === "open" && isValidDate(p.startDate) && p.startDate! > now);

  if (future.length === 0) return null;

  return future.sort((a, b) => a.startDate!.getTime() - b.startDate!.getTime())[0];
}

export function getMoreProgrammes(programmes: TrainingProgramme[]): TrainingProgramme[] {
  const published = getPublishedProgrammes(programmes);
  const next = getNextProgramme(programmes);
  const now = new Date();

  return published
    .filter((p) => {
      if (p.id === next?.id) return false;
      if (p.status === "ongoing") return isValidDate(p.startDate);
      if (p.status === "open" && isValidDate(p.startDate) && p.startDate! > now) return true;
      return false;
    })
    .sort((a, b) => a.startDate!.getTime() - b.startDate!.getTime());
}

export function getPreviousProgrammes(programmes: TrainingProgramme[]): TrainingProgramme[] {
  const published = getPublishedProgrammes(programmes);

  return published
    .filter((p) => p.status === "previous" && isValidDate(p.endDate))
    .sort((a, b) => b.endDate!.getTime() - a.endDate!.getTime());
}
