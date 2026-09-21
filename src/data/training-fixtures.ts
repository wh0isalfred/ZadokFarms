import type { TrainingProgramme } from "@/types/training";

export const trainingFixtures: TrainingProgramme[] = [
  {
    id: "prog-001",
    slug: "practical-greenhouse-farming-nov-2024",
    title: "Practical greenhouse farming",
    summary:
      "Learn how to set up and manage a low-cost greenhouse, raise healthy seedlings and grow vegetables all year round using practical, proven methods.",
    coverImage: {
      src: "/images/training/greenhouse-farming.jpg",
      alt: "Hands-on training in a greenhouse with participants learning vegetable cultivation",
    },
    status: "open",
    startDate: new Date("2024-11-12"),
    endDate: new Date("2024-11-14"),
    location: "Omudioga, Rivers",
    format: "In person",
    published: true,
  },
  {
    id: "prog-002",
    slug: "soil-health-composting-nov-2024",
    title: "Soil health and composting",
    summary:
      "Learn practical ways to improve soil health using organic materials and on-farm resources.",
    coverImage: {
      src: "/images/training/soil-health.jpg",
      alt: "Hands holding dark, nutrient-rich soil at Zadok Farms",
    },
    status: "open",
    startDate: new Date("2024-11-26"),
    endDate: new Date("2024-11-27"),
    location: "Ikwerre, Rivers",
    format: "In person",
    published: true,
  },
  {
    id: "prog-003",
    slug: "vegetable-production-dec-2024",
    title: "Vegetable production for small farms",
    summary:
      "Hands-on training on land preparation, planting, care and harvesting for higher yields.",
    coverImage: {
      src: "/images/training/vegetable-production.jpg",
      alt: "A farmer demonstrating vegetable cultivation techniques",
    },
    status: "open",
    startDate: new Date("2024-12-05"),
    endDate: new Date("2024-12-06"),
    location: "Emuoha, Rivers",
    format: "In person",
    published: true,
  },
  {
    id: "prog-004",
    slug: "farm-business-market-dec-2024",
    title: "Farm business and market access",
    summary:
      "Learn how to plan, price and sell your produce, and connect to real market opportunities.",
    coverImage: {
      src: "/images/training/farm-business.jpg",
      alt: "A farmer reviewing produce records and market information",
    },
    status: "open",
    startDate: new Date("2024-12-17"),
    endDate: new Date("2024-12-18"),
    location: "Port Harcourt, Rivers",
    format: "In person",
    published: true,
  },
  {
    id: "prog-005",
    slug: "integrated-pest-management-sept-2024",
    title: "Integrated pest management",
    summary: "Practical, low-cost methods to keep your crops healthy.",
    coverImage: {
      src: "/images/training/pest-management.jpg",
      alt: "Farmers working together on crop health and pest management",
    },
    status: "previous",
    startDate: new Date("2024-09-14"),
    endDate: new Date("2024-09-15"),
    location: "Emuoha, Rivers",
    format: "In person",
    published: true,
  },
  {
    id: "prog-006",
    slug: "poultry-production-july-2024",
    title: "Small-scale poultry production",
    summary: "Care, feeding and management for better results.",
    coverImage: {
      src: "/images/training/poultry.jpg",
      alt: "Hands-on poultry care and management training",
    },
    status: "previous",
    startDate: new Date("2024-07-20"),
    endDate: new Date("2024-07-21"),
    location: "Ikwerre, Rivers",
    format: "In person",
    published: true,
  },
];
