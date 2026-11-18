import type { Metadata } from "next";
import RecirculacionView from "@/features/recirculacion/RecirculacionView";

export const metadata: Metadata = { title: "Recirculación de agua · ExpoIngeniería Interactiva" };

export default function Page() {
  return <RecirculacionView />;
}
