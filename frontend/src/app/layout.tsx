import type { Metadata } from "next";
import { Dancing_Script } from "next/font/google";
import "./globals.css";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-dancing",
});

export const metadata: Metadata = {
  title: "Travelet",
  description: "Commute on your vibe.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={dancingScript.variable}>
      <body className="bg-slate-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
