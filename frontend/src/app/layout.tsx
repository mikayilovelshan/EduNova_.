import type { Metadata } from "next";
import { JetBrains_Mono, Poppins } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

// Both families were checked for full Azerbaijani coverage (ə Ə ğ ı İ ş ç ö ü).
// Poppins carries body text and headings alike.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "EduNova", template: "%s · EduNova" },
  description: "Empowering the Future of Education. A Unified Academic Management Platform",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="az"
      suppressHydrationWarning
      className={`${poppins.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
