import type { Metadata } from "next";
import MotorView from "@/features/motor/MotorView";

export const metadata: Metadata = { title: "Motor eléctrico · ExpoIngeniería Interactiva" };

export default function Page() {
  return <MotorView />;
}
