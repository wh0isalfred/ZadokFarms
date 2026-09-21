import { TrainingPage } from "@/components/training/page";
import { trainingFixtures } from "@/data/training-fixtures";

export const metadata = {
  title: "Training | Zadok Farms",
  description:
    "Learn practical agricultural skills through hands-on training programmes at Zadok Farms. Farmer training, crop production, greenhouse farming, and more.",
};

export default function Page() {
  return <TrainingPage programmes={trainingFixtures} />;
}
