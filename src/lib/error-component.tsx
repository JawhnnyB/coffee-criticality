import type { ErrorComponentProps } from "@tanstack/react-router";
import { PlantPhoneCard, reportFrom } from "@/game/plantPhone";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return <PlantPhoneCard report={reportFrom(error)} />;
}
