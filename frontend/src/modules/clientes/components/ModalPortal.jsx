import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function ModalPortal({ open, onClose, children }) {
  
  // Bloquear scroll de fondo mientras está abierto
  useEffect(() => {
  if (!open) return null;
  const prev = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  return () => { document.body.style.overflow = prev; };
}, [open]);


  const handleOverlayClick = (e) => {
    // cierra solo si clic fuera del panel
    if (e.target === e.currentTarget && onClose) onClose();
  };

  if (!open) return null;

  return createPortal(
    <div className="m-overlay" role="dialog" aria-modal="true" onClick={handleOverlayClick}>
      <div className="m-panel">
        {children}
      </div>
    </div>,
    document.body
  );
}
