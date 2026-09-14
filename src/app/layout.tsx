import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { Providers } from "@/components/Providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "Store",
  description: "MVP ecommerce storefront",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="font-sans antialiased bg-paper text-ink">
        <Providers>
          <SiteHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
