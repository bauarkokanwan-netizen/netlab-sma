import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NetLab SMA",
  description: "Simulator jaringan sederhana untuk praktik anak SMA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
