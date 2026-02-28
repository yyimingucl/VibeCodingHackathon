import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Route Ranker",
  description: "Find the best transit route in London, ranked for you.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
