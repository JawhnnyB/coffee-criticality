import { createRoot } from "react-dom/client";
import { GameApp } from "../game/GameApp";
import { PlantPhoneBoundary, PlantPhoneWatch } from "../game/plantPhone";
import { bootWindow } from "../game/windowMode";
import { hydrateDeskSaves } from "./saveBridge";
import "../styles.css";

async function start() {
  await hydrateDeskSaves();
  void bootWindow();
  const root = document.getElementById("root");
  if (!root) return;
  createRoot(root).render(
    <PlantPhoneBoundary>
      <GameApp />
      <PlantPhoneWatch />
    </PlantPhoneBoundary>,
  );
}

void start();
