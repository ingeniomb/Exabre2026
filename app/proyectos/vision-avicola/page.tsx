import type { Metadata } from "next";
import VisionView from "@/features/vision-avicola/VisionView";

export const metadata: Metadata = { title: "Visión artificial avícola · ExpoIngeniería Interactiva" };

export default function Page() {
  return <VisionView />;
}
