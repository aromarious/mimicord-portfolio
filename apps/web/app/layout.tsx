import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"] })

export const viewport: Viewport = {
  themeColor: "#36393f",
}

export const metadata: Metadata = {
  title: "Mimicord",
  description: "Summarize and browse Discord chat history using RAG.",
  icons: {
    icon: "/favicon/favicon.ico",
    apple: "/favicon/apple-touch-icon.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          inter.className,
          "min-h-screen bg-background font-sans antialiased",
        )}
      >
        {children}
      </body>
    </html>
  )
}
