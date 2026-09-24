import { useState, useEffect } from "react"
import { G, GL } from "@/constants/theme"

export default function ForgotPasswordModal({
  onClose,
}: {
  onClose: () => void
}) {
  const [visible, setVisible] = useState(false)
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState("")
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])
  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 280)
  }
  return (
    <>
      <div
        className="fixed inset-0 z-[200]"
        onClick={handleClose}
        style={{
          backgroundColor: `rgba(0,0,0,${visible ? 0.55 : 0})`,
          backdropFilter: "blur(4px)",
          transition: "background-color 0.28s",
        }}
      />
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto"
          style={{ animation: "modalIn 0.22s cubic-bezier(.16,1,.3,1)" }}
        >
          {!sent ? (
            <>
              <div className="px-8 pt-8 pb-2 text-center">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: GL }}
                >
                  <svg
                    className="w-7 h-7"
                    fill="none"
                    stroke={G}
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
                <h2 className="text-xl font-extrabold text-gray-900">
                  Recuperar Contraseña
                </h2>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  Ingrese su correo institucional y le enviaremos las
                  instrucciones para restablecer su acceso.
                </p>
              </div>
              <div className="px-8 py-5">
                <label className="text-xs font-bold text-gray-600 block mb-1.5">
                  Correo Institucional
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@munipanajachel.gob.gt"
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none transition-colors"
                  style={{ borderColor: email ? G : undefined }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = G)}
                  onBlur={(e) => {
                    if (!email) e.currentTarget.style.borderColor = ""
                  }}
                />
              </div>
              <div className="flex gap-3 px-8 pb-8">
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (email) setSent(true)
                  }}
                  className="flex-1 py-3 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm"
                  style={{ backgroundColor: G, opacity: !email ? 0.5 : 1 }}
                >
                  Enviar Instrucciones
                </button>
              </div>
            </>
          ) : (
            <div className="px-8 py-10 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-emerald-50">
                <svg
                  className="w-7 h-7 text-emerald-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-xl font-extrabold text-gray-900">
                Correo enviado
              </h2>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                Revise su bandeja <b className="text-gray-700">{email}</b>. Si
                la cuenta existe, recibirá las instrucciones en los próximos
                minutos.
              </p>
              <button
                onClick={handleClose}
                className="mt-6 w-full py-3 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm"
                style={{ backgroundColor: G }}
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
