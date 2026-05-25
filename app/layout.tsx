import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Attendance Module',
  description: 'Attendance dashboard and reports',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
