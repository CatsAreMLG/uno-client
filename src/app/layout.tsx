import { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import "./App.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Uno",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/uno/logo.png" sizes="any" />
        <link rel="favicon" href="/logo.ico" sizes="any" />
        <link rel="apple-icon" href="/uno/logo.png" sizes="any" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
