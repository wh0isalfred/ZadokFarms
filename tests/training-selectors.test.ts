import { expect, it } from "vitest";
import type { TrainingProgramme } from "../src/types/training";
import { getNextProgramme, getMoreProgrammes, getPreviousProgrammes, getPublishedProgrammes } from "../src/lib/training/selectors";

const now = new Date();
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

const mockProgrammes: TrainingProgramme[] = [
  {
    id: "1",
    slug: "prog-1",
    title: "Greenhouse Farming",
    summary: "Learn greenhouse farming",
    coverImage: { src: "/img1.jpg", alt: "Greenhouse" },
    status: "open",
    startDate: nextWeek,
    endDate: new Date(nextWeek.getTime() + 2 * 24 * 60 * 60 * 1000),
    location: "Omudioga",
    format: "In person",
    published: true,
  },
  {
    id: "2",
    slug: "prog-2",
    title: "Soil Health",
    summary: "Learn soil health",
    coverImage: { src: "/img2.jpg", alt: "Soil" },
    status: "open",
    startDate: nextMonth,
    endDate: new Date(nextMonth.getTime() + 2 * 24 * 60 * 60 * 1000),
    location: "Ikwerre",
    format: "In person",
    published: true,
  },
  {
    id: "3",
    slug: "prog-3",
    title: "Pest Management",
    summary: "Learn pest management",
    coverImage: { src: "/img3.jpg", alt: "Pest" },
    status: "ongoing",
    startDate: yesterday,
    endDate: tomorrow,
    location: "Emuoha",
    format: "In person",
    published: true,
  },
  {
    id: "4",
    slug: "prog-4",
    title: "Past Training",
    summary: "Old training",
    coverImage: { src: "/img4.jpg", alt: "Past" },
    status: "previous",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-01-02"),
    location: "Somewhere",
    format: "In person",
    published: true,
  },
  {
    id: "5",
    slug: "prog-5",
    title: "Unpublished",
    summary: "Not published",
    coverImage: { src: "/img5.jpg", alt: "Unpublished" },
    status: "open",
    startDate: nextWeek,
    endDate: new Date(nextWeek.getTime() + 2 * 24 * 60 * 60 * 1000),
    location: "Unknown",
    format: "In person",
    published: false,
  },
];

it("getPublishedProgrammes filters to only published programmes", () => {
  const published = getPublishedProgrammes(mockProgrammes);
  expect(published).toHaveLength(4);
  expect(published.find((p) => p.id === "5")).toBeUndefined();
  expect(published.find((p) => p.id === "1")).toBeDefined();
});

it("getNextProgramme returns the nearest future open programme", () => {
  const next = getNextProgramme(mockProgrammes);
  expect(next?.id).toBe("1");
  expect(next?.title).toBe("Greenhouse Farming");
});

it("getNextProgramme returns null when there are no future open programmes", () => {
  const noFuture: TrainingProgramme[] = [
    {
      id: "past",
      slug: "past",
      title: "Past",
      summary: "Past",
      coverImage: { src: "/past.jpg", alt: "Past" },
      status: "previous",
      startDate: yesterday,
      endDate: yesterday,
      location: "Somewhere",
      format: "In person",
      published: true,
    },
  ];
  const next = getNextProgramme(noFuture);
  expect(next).toBeNull();
});

it("getNextProgramme ignores unpublished programmes", () => {
  const onlyUnpublished: TrainingProgramme[] = [
    {
      id: "unpub",
      slug: "unpub",
      title: "Unpublished",
      summary: "Not published",
      coverImage: { src: "/unpub.jpg", alt: "Unpublished" },
      status: "open",
      startDate: nextWeek,
      endDate: new Date(nextWeek.getTime() + 1 * 24 * 60 * 60 * 1000),
      location: "Unknown",
      format: "In person",
      published: false,
    },
  ];
  const next = getNextProgramme(onlyUnpublished);
  expect(next).toBeNull();
});

it("getMoreProgrammes returns current/ongoing programmes excluding next", () => {
  const more = getMoreProgrammes(mockProgrammes);
  expect(more).toHaveLength(2);
  expect(more.find((p) => p.id === "1")).toBeUndefined();
  expect(more.find((p) => p.id === "2")).toBeDefined();
  expect(more.find((p) => p.id === "3")).toBeDefined();
  expect(more.map((p) => p.id)).toEqual(["3", "2"]);
});

it("getMoreProgrammes returns empty array when no current/ongoing programmes", () => {
  const limited: TrainingProgramme[] = [
    {
      id: "next",
      slug: "next",
      title: "Next",
      summary: "Next",
      coverImage: { src: "/next.jpg", alt: "Next" },
      status: "open",
      startDate: nextWeek,
      endDate: new Date(nextWeek.getTime() + 1 * 24 * 60 * 60 * 1000),
      location: "Place",
      format: "In person",
      published: true,
    },
  ];
  const more = getMoreProgrammes(limited);
  expect(more).toHaveLength(0);
});

it("getPreviousProgrammes returns archived programmes sorted by end date descending", () => {
  const previous = getPreviousProgrammes(mockProgrammes);
  expect(previous).toHaveLength(1);
  expect(previous[0]?.id).toBe("4");
});

it("getPreviousProgrammes returns multiple programmes sorted correctly", () => {
  const withMultiplePrevious: TrainingProgramme[] = [
    ...mockProgrammes,
    {
      id: "past-2",
      slug: "past-2",
      title: "Older Training",
      summary: "Even older",
      coverImage: { src: "/img-old.jpg", alt: "Older" },
      status: "previous",
      startDate: new Date("2024-06-01"),
      endDate: new Date("2024-06-02"),
      location: "Place",
      format: "In person",
      published: true,
    },
    {
      id: "past-3",
      slug: "past-3",
      title: "Newest Previous",
      summary: "Recent past",
      coverImage: { src: "/img-recent.jpg", alt: "Recent" },
      status: "previous",
      startDate: new Date("2024-09-01"),
      endDate: new Date("2024-09-02"),
      location: "Place",
      format: "In person",
      published: true,
    },
  ];
  const previous = getPreviousProgrammes(withMultiplePrevious);
  expect(previous).toHaveLength(3);
  expect(previous[0]?.id).toBe("past-3");
  expect(previous[1]?.id).toBe("past-2");
  expect(previous[2]?.id).toBe("4");
});

it("getPreviousProgrammes ignores unpublished programmes", () => {
  const withUnpublished: TrainingProgramme[] = [
    ...mockProgrammes,
    {
      id: "unpub-prev",
      slug: "unpub-prev",
      title: "Unpublished Previous",
      summary: "Unpublished",
      coverImage: { src: "/unpub-prev.jpg", alt: "Unpublished" },
      status: "previous",
      startDate: new Date("2024-08-01"),
      endDate: new Date("2024-08-02"),
      location: "Place",
      format: "In person",
      published: false,
    },
  ];
  const previous = getPreviousProgrammes(withUnpublished);
  expect(previous).toHaveLength(1);
  expect(previous.find((p) => p.id === "unpub-prev")).toBeUndefined();
});

it("handles empty programme list", () => {
  const empty: TrainingProgramme[] = [];
  expect(getPublishedProgrammes(empty)).toHaveLength(0);
  expect(getNextProgramme(empty)).toBeNull();
  expect(getMoreProgrammes(empty)).toHaveLength(0);
  expect(getPreviousProgrammes(empty)).toHaveLength(0);
});
