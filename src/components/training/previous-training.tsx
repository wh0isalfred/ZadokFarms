import Image from "next/image";
import Link from "next/link";
import { ArrowIcon } from "@/components/icons";
import type { TrainingProgramme } from "@/types/training";

type PreviousTrainingProps = {
  programmes: TrainingProgramme[];
};

function formatDate(date: Date | undefined): string {
  if (!date) return "";
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export function PreviousTrainingArchive({ programmes }: PreviousTrainingProps) {
  if (programmes.length === 0) {
    return null;
  }

  return (
    <section className="previous-training" aria-labelledby="previous-training-heading">
      <h2 id="previous-training-heading">Previous training</h2>

      <div className="training-archive">
        {programmes.map((programme) => (
          <article key={programme.id} className="archive-row">
            <div className="archive-thumbnail">
              <Image src={programme.coverImage.src} alt={programme.coverImage.alt} fill sizes="80px" />
            </div>

            <div className="archive-content">
              <h3 className="archive-title">{programme.title}</h3>
              <p className="archive-meta">
                {formatDate(programme.startDate)}
                {programme.location && ` · ${programme.location}`}
              </p>
            </div>

            <Link href={`/training/${programme.slug}`} className="archive-link" aria-label={`View ${programme.title} programme`}>
              <ArrowIcon />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
