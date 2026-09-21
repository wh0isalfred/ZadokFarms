import { TrainingPage } from "@/components/training/page";

export const metadata = {
  title: "Training | Zadok Farms",
  description:
    "Learn practical agricultural skills through hands-on training programmes at Zadok Farms.",
};

// Production route renders empty state until admin system publishes programmes
export default function Page() {
  return <TrainingPage programmes={[]} />;
}
