import { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react'

type ToastType = 'success' | 'error' | 'info'
interface ToastItem { id: number; message: string; type: ToastType }
interface ToastCtx { toast: (message: string, type?: ToastType) => void }

const ToastContext = createContext<ToastCtx>({ toast: () => {} })

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++counter.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const colors = { success: 'bg-emerald-600', error: 'bg-red-500', info: 'bg-blue-600' }
  const icons  = { success: '✓', error: '✕', info: 'ℹ' }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`${colors[t.type]} text-white text-sm font-medium px-4 py-2.5
                        rounded-xl shadow-lg flex items-center gap-2.5 pointer-events-auto`}
          >
            <span className="text-xs font-bold">{icons[t.type]}</span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
