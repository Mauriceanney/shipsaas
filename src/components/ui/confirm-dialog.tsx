"use client";

import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ConfirmDialogProps {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmText?: string;
  confirmVariant?: "default" | "destructive";
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmText = "Confirm",
  confirmVariant = "destructive",
  cancelText = "Cancel",
  onConfirm,
  disabled = false,
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  async function handleConfirm() {
    setIsLoading(true);
    try {
      await onConfirm();
      setIsOpen(false);
    } catch (error) {
      console.error("[ConfirmDialog] Error during confirm:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild disabled={disabled}>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void handleConfirm();
            }}
            disabled={isLoading}
            className={cn(buttonVariants({ variant: confirmVariant }))}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
