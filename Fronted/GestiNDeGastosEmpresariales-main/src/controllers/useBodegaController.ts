import { useState } from "react"
import { OC_ITEMS, type VerifState } from "@/models/bodega"

export function useBodegaController() {
  const [verifStates, setVerifStates] = useState<Record<string, VerifState>>({})
  const [showNuevaRec, setShowNuevaRec] = useState(false)
  const [showFinalizar, setShowFinalizar] = useState(false)

  const setVerif = (id: string, val: VerifState) =>
    setVerifStates((prev) => ({ ...prev, [id]: prev[id] === val ? null : val }))

  const allVerified = OC_ITEMS.every((i) => verifStates[i.id] != null)

  return {
    verifStates,
    setVerif,
    showNuevaRec,
    setShowNuevaRec,
    showFinalizar,
    setShowFinalizar,
    allVerified,
  }
}
