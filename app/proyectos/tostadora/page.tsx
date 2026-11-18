import type { Metadata } from "next";
import TostadoraView from "@/features/tostadora/TostadoraView";

export const metadata: Metadata = { title: "Tostadora de café · ExpoIngeniería Interactiva" };

export default function Page() {
  return <TostadoraView />;
}
