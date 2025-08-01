'use client'

import { Toaster } from '@/components/ui/sonner'

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          border: '1px solid hsl(var(--border))',
        },
      }}
      closeButton
      richColors
      expand
      visibleToasts={5}        
    />
  )
}