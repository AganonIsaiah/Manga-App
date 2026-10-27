"use client";
import { useEffect, useRef, type ReactNode } from "react";

export default function Modal({
  children,
  onClose,
  ...props
}: {
  children: ReactNode;
  onClose: () => void;
  "aria-label": string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="reader-dialog"
      {...props}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      {children}
    </dialog>
  );
}
