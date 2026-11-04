// src/features/home/components/HomeBackdrop.jsx
//
// Fondo animado muy sutil para el Home. Usa los mismos tonos del proyecto
// (rosas en modo claro, rosa profundo + carmesí en modo oscuro) y baja la
// opacidad para que no compita con el contenido.

import { useTheme } from "../../../shared/context/ThemeContext";
import MoltenMetal from "./MoltenMetal";

const PALETTES = {
  light: {
    colors: ["#FAD2E1", "#EF818A"], // --secundario-1 / --primario-claro
    coreColor: "#f01e2f",
    opacity: 0.5,
    brightness: 1.05,
    glow: 0.8,
    lightMode: true,
  },
  dark: {
    colors: ["#4A303B", "#E63946"], // --secundario-2 / --primario
    coreColor: "#EF818A",
    opacity: 0.4,
    brightness: 1.1,
    glow: 1,
    lightMode: false,
  },
};

export default function HomeBackdrop() {
  const { theme } = useTheme();
  const palette = PALETTES[theme === "dark" ? "dark" : "light"];

  return (
    <div className="home-backdrop" aria-hidden="true">
      <MoltenMetal
        {...palette}
        speed={0.2}
        scale={3}
        detail={3}
        thickness={1}
        haze={0.6}
        swirl={0.8}
        turbulence={0.2}
        grain={0.03}
        drift={0.2}
        mouseStrength={0.35}
        intro
        flareOnClick
        mouseInteraction
      />
    </div>
  );
}
