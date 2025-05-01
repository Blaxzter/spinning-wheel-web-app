import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spinning Wheel - Fabraham",
  description: "A simple tool to create and spin a wheel of options",
  generator: "v0.dev",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
