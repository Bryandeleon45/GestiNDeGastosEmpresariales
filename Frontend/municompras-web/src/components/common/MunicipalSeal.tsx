import muniLogo from "@/imports/image-14.png"

// ─── Municipal Seal ───────────────────────────────────────────────────────────
export default function MunicipalSeal({
  size = 40,
  onClick,
}: {
  size?: number
  onClick?: () => void
}) {
  const img = (
    <img
      src={muniLogo}
      alt="Escudo Municipalidad de Panajachel"
      width={size}
      height={size}
      className="object-contain shrink-0"
      style={{ width: size, height: size }}
    />
  )
  if (!onClick) return img
  return (
    <button
      onClick={onClick}
      className="shrink-0 transition-transform hover:scale-105 active:scale-95 focus:outline-none rounded-full"
      aria-label="Ir al Dashboard"
      style={{
        width: size,
        height: size,
        padding: 0,
        background: "none",
        border: "none",
      }}
    >
      {img}
    </button>
  )
}
