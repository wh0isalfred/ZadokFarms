import type { TrainingProgramme } from "@/types/training";
import { TrainingHero } from "./hero";
import { NextTrainingFeature } from "./next-training";
import { IdentityInterlude } from "./identity-interlude";
import { MoreTrainingsGrid } from "./more-trainings";
import { PreviousTrainingArchive } from "./previous-training";
import { getNextProgramme, getMoreProgrammes, getPreviousProgrammes } from "@/lib/training/selectors";

type TrainingPageProps = {
  programmes: TrainingProgramme[];
};

export function TrainingPage({ programmes }: TrainingPageProps) {
  const nextProgramme = getNextProgramme(programmes);
  const moreProgrammes = getMoreProgrammes(programmes);
  const previousProgrammes = getPreviousProgrammes(programmes);

  return (
    <main className="training-page" id="training-programmes">
      <div className="page-shell">
        <TrainingHero />
      </div>

      <section className="next-training-section">
        <div className="page-shell">
          <NextTrainingFeature programme={nextProgramme} />
        </div>
      </section>

      <IdentityInterlude />

      {moreProgrammes.length > 0 && (
        <section className="more-trainings-section">
          <div className="page-shell">
            <MoreTrainingsGrid programmes={moreProgrammes} />
          </div>
        </section>
      )}

      {previousProgrammes.length > 0 && (
        <section className="previous-training-section">
          <div className="page-shell">
            <PreviousTrainingArchive programmes={previousProgrammes} />
          </div>
        </section>
      )}
    </main>
  );
}
