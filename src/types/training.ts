export type TrainingProgrammeStatus = "open" | "ongoing" | "previous";

export interface TrainingProgramme {
  id: string;
  slug: string;
  title: string;
  summary: string;
  coverImage: {
    src: string;
    alt: string;
  };
  status: TrainingProgrammeStatus;
  startDate?: Date;
  endDate?: Date;
  location?: string;
  format?: string;
  published: boolean;
}
