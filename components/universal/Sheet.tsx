import React from 'react';
import { Platform } from 'react-native';
import { Drawer } from './Drawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './Dialog';
import { cn } from '@/lib/core/utils';

// Sheet component that uses Dialog on web and Drawer on mobile
export interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  modal?: boolean;
}

export function Sheet({ open, onOpenChange, children, defaultOpen, modal = true }: SheetProps) {
  // For mobile, we need to handle the drawer state internally
  // Must call hooks before any conditional returns
  const [isOpen, setIsOpen] = React.useState(defaultOpen || false);
  
  if (Platform.OS === 'web') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange} defaultOpen={defaultOpen} modal={modal}>
        {children}
      </Dialog>
    );
  }
  const visible = open !== undefined ? open : isOpen;
  const handleClose = () => {
    if (onOpenChange) {
      onOpenChange(false);
    } else {
      setIsOpen(false);
    }
  };

  return (
    <Drawer visible={visible} onClose={handleClose}>
      {children}
    </Drawer>
  );
}

export interface SheetContentProps {
  children?: React.ReactNode;
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  onOpenAutoFocus?: (event: Event) => void;
  onCloseAutoFocus?: (event: Event) => void;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: PointerEvent) => void;
  onInteractOutside?: (event: PointerEvent) => void;
}

export function SheetContent({ 
  children, 
  className, 
  side = 'right',
  ...props 
}: SheetContentProps) {
  if (Platform.OS === 'web') {
    return (
      <DialogContent 
        className={cn(
          "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
          side === 'left' && "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
          side === 'right' && "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
          side === 'top' && "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
          side === 'bottom' && "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          className
        )}
        {...props}
      >
        {children}
      </DialogContent>
    );
  }

  // For mobile, DrawerContent is already handled by Drawer
  return <>{children}</>;
}

export interface SheetHeaderProps {
  children?: React.ReactNode;
  className?: string;
}

export function SheetHeader({ children, className }: SheetHeaderProps) {
  if (Platform.OS === 'web') {
    return <DialogHeader className={className}>{children}</DialogHeader>;
  }
  
  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      {children}
    </div>
  );
}

export interface SheetTitleProps {
  children?: React.ReactNode;
  className?: string;
}

export function SheetTitle({ children, className }: SheetTitleProps) {
  if (Platform.OS === 'web') {
    return <DialogTitle className={className}>{children}</DialogTitle>;
  }
  
  return (
    <h2 className={cn("text-lg font-semibold", className)}>
      {children}
    </h2>
  );
}

export interface SheetDescriptionProps {
  children?: React.ReactNode;
  className?: string;
}

export function SheetDescription({ children, className }: SheetDescriptionProps) {
  if (Platform.OS === 'web') {
    return <DialogDescription className={className}>{children}</DialogDescription>;
  }
  
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </p>
  );
}

// Export trigger components
export { DialogTrigger as SheetTrigger } from './Dialog';
export { DialogClose as SheetClose } from './Dialog';
export { DialogPortal as SheetPortal } from './Dialog';
export { DialogOverlay as SheetOverlay } from './Dialog';