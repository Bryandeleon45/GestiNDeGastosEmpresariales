import { useState } from "react"

export function useProformasController() {
  const [winner, setWinner] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [adjudicado, setAdjudicado] = useState(false)
  const [hoveredCol, setHoveredCol] = useState<string | null>(null)

  return {
    winner,
    setWinner,
    showConfirm,
    setShowConfirm,
    adjudicado,
    setAdjudicado,
    hoveredCol,
    setHoveredCol,
  }
}
