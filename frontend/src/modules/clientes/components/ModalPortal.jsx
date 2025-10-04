import { useEffect } from "react";
import * as ReactDOM from "react-dom";

export default function ModalPortal({ open, onClose, children }) {
  // Bloquear scroll del body mientras esté abierto
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && onClose) onClose();
  };

  if (!open) return null;

  return ReactDOM.createPortal(
    <div className="m-overlay" role="dialog" aria-modal="true" onClick={handleOverlayClick}>
      <div className="m-panel">{children}</div>
    </div>,
    document.body
  );
}
