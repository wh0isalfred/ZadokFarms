import Image from "next/image";
import Link from "next/link";
import { ArrowIcon } from "@/components/icons";
import type { TrainingProgramme } from "@/types/training";

type NextTrainingProps = {
  programme: TrainingProgramme | null;
};

function formatDate(date: Date | undefined): string {
  if (!date) return "";
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export function NextTrainingFeature({ programme }: NextTrainingProps) {
  if (!programme) {
    return (
      <section className="next-training" aria-labelledby="next-training-heading">
        <h2 id="next-training-heading">Next training</h2>
        <div className="next-training-empty">
          <p>More training programmes coming soon. Check back later for opportunities to learn at Zadok.</p>
        </div>
      </section>
    );
  }

  const startDateStr = formatDate(programme.startDate);
  const endDateStr = formatDate(programme.endDate);

  return (
    <section className="next-training" aria-labelledby="next-training-heading">
      <h2 id="next-training-heading">Next training</h2>

      <article className="next-training-feature">
        <div className="next-training-image">
          <Image src={programme.coverImage.src} alt={programme.coverImage.alt} fill sizes="(max-width: 799px) 100vw, 55vw" />
        </div>

        <div className="next-training-content">
          <div className="training-meta">
            <span className="training-status">Open programme</span>
          </div>

          <h3 className="training-title">{programme.title}</h3>
          <p className="training-summary">{programme.summary}</p>

          <div className="training-details">
            {programme.startDate && (
              <div className="training-detail">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>
                  {startDateStr}
                  {endDateStr && ` – ${endDateStr}`}
                </span>
              </div>
            )}

            {programme.location && (
              <div className="training-detail">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{programme.location}</span>
              </div>
            )}

            {programme.format && (
              <div className="training-detail">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>{programme.format}</span>
              </div>
            )}
          </div>

          <Link href={`/training/${programme.slug}`} className="training-action">
            View programme <ArrowIcon />
          </Link>
        </div>
      </article>
    </section>
  );
}
