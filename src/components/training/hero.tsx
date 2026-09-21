"use client";

export function TrainingHero() {
  return (
    <section className="training-hero" aria-label="Training at Zadok hero">
      <svg
        className="training-hero-bands"
        viewBox="0 0 1440 300"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 80 L1440 20" stroke="currentColor" strokeWidth="16" opacity="0.25" />
        <path d="M0 120 L1440 60" stroke="currentColor" strokeWidth="16" opacity="0.28" />
        <path d="M0 160 L1440 100" stroke="currentColor" strokeWidth="16" opacity="0.24" />
        <path d="M0 200 L1440 140" stroke="currentColor" strokeWidth="16" opacity="0.26" />
      </svg>

      <div className="training-hero-content">
        <p className="training-hero-eyebrow">Training at Zadok</p>
        <h1 className="training-hero-heading">Practical learning on the farm.</h1>
        <p className="training-hero-subtitle">
          Hands-on training for farmers, grower groups and anyone who wants to build practical skills for a more
          productive and sustainable future.
        </p>
      </div>
    </section>
  );
}
