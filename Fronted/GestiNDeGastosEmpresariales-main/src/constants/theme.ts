// ─── Design tokens ────────────────────────────────────────────────────────────
// Color institucional consciente del tema (ver index.css para :root y dark).
export const G = "var(--brand)"
export const GL = "var(--brand-light)"
export const GB = "var(--brand-border)"
// Valor hex fijo para contextos que no admiten var() (parseo de color, sufijos
// de alpha en hex, atributos SVG de recharts, etc.).
export const BRAND_HEX = "#1E5E2F"

export const ACCENT_PALETTE = [
  { name: "Forest Green", hex: "#1E5E2F" },
  { name: "Ocean Blue", hex: "#1D4ED8" },
  { name: "Purple", hex: "#7C3AED" },
  { name: "Orange", hex: "#B45309" },
  { name: "Teal", hex: "#0F766E" },
  { name: "Crimson", hex: "#BE123C" },
]
