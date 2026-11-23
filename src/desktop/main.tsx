import { createRoot } from "react-dom/client";
import { GameApp } from "../game/GameApp";
import { PlantPhoneBoundary, PlantPhoneWatch } from "../game/plantPhone";
import "../styles.css";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <PlantPhoneBoundary>
      <GameApp />
      <PlantPhoneWatch />
    </PlantPhoneBoundary>,
  );
}
