import Image from "next/image";
import Link from "next/link";
import { ArrowIcon } from "@/components/icons";
import type { TrainingProgramme } from "@/types/training";

type MoreTrainingsProps = {
  programmes: TrainingProgramme[];
};

function formatDate(date: Date | undefined): string {
  if (!date) return "";
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export function MoreTrainingsGrid({ programmes }: MoreTrainingsProps) {
  if (programmes.length === 0) {
    return null;
  }

  return (
    <section className="more-trainings" aria-labelledby="more-trainings-heading">
      <h2 id="more-trainings-heading">More trainings</h2>

      <div className="trainings-grid">
        {programmes.slice(0, 3).map((programme) => (
          <article key={programme.id} className="training-card">
            <div className="training-card-image">
              <Image
                src={programme.coverImage.src}
                alt={programme.coverImage.alt}
                fill
                sizes="(max-width: 799px) 100vw, (max-width: 1199px) 50vw, 33vw"
              />
              <div className="training-card-overlay" />
              <Link href={`/training/${programme.slug}`} className="training-card-link" aria-label={`View ${programme.title} programme`}>
                <ArrowIcon />
              </Link>
            </div>

            <div className="training-card-content">
              <span className="training-card-status">Open programme</span>
              <h3 className="training-card-title">{programme.title}</h3>
              <p className="training-card-summary">{programme.summary}</p>

              <div className="training-card-meta">
                {programme.startDate && (
                  <div className="training-card-detail">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>{formatDate(programme.startDate)}</span>
                  </div>
                )}

                {programme.location && (
                  <div className="training-card-detail">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{programme.location}</span>
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
