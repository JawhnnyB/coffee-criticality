import { createRoot } from "react-dom/client";
import { GameApp } from "../game/GameApp";
import { PlantPhoneBoundary, PlantPhoneWatch } from "../game/plantPhone";
import { bootWindow } from "../game/windowMode";
import "../styles.css";

void bootWindow();

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <PlantPhoneBoundary>
      <GameApp />
      <PlantPhoneWatch />
    </PlantPhoneBoundary>,
  );
}