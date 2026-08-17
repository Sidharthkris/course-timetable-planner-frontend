interface ConfirmButtonProps {
  label: string
  confirmMessage: string
  onConfirm: () => void
  className?: string
}

export function ConfirmButton({ label, confirmMessage, onConfirm, className }: ConfirmButtonProps) {
  return (
    <button
      type="button"
      className={className ?? 'link-button danger'}
      onClick={() => {
        if (window.confirm(confirmMessage)) {
          onConfirm()
        }
      }}
    >
      {label}
    </button>
  )
}
