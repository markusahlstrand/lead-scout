import * as React from 'react'
import { cn } from '@/lib/utils'

export interface DialogProps
  extends React.HTMLAttributes<HTMLDialogElement> {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const Dialog = React.forwardRef<HTMLDialogElement, DialogProps>(
  ({ className, open, onOpenChange, ...props }, ref) => {
    React.useEffect(() => {
      if (ref && typeof ref === 'object' && 'current' in ref) {
        if (open) {
          ref.current?.showModal()
        } else {
          ref.current?.close()
        }
      }
    }, [open, ref])

    const handleClose = () => {
      onOpenChange?.(false)
    }

    return (
      <dialog
        ref={ref}
        className={cn(
          'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-6 text-foreground shadow-xl backdrop:bg-black/50',
          className
        )}
        onCancel={handleClose}
        {...props}
      />
    )
  }
)
Dialog.displayName = 'Dialog'

const DialogTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  }
>(({ onClick, ...props }, ref) => (
  <button ref={ref} onClick={onClick} {...props} />
))
DialogTrigger.displayName = 'DialogTrigger'

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('space-y-4', className)}
    {...props}
  />
))
DialogContent.displayName = 'DialogContent'

const DialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('space-y-2', className)}
    {...props}
  />
))
DialogHeader.displayName = 'DialogHeader'

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
))
DialogTitle.displayName = 'DialogTitle'

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
DialogDescription.displayName = 'DialogDescription'

const DialogFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex justify-end space-x-2', className)}
    {...props}
  />
))
DialogFooter.displayName = 'DialogFooter'

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
}
