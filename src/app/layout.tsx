import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { Providers } from "@/components/Providers";
import { RecentlyViewed } from "@/components/RecentlyViewed";
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
          <RecentlyViewed />
          <footer className="border-t border-line bg-ink text-paper">
            <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
              <div>
                <p className="font-serif text-2xl">Store</p>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-paper/70">
                  Considered pieces for everyday life, chosen with care.
                </p>
              </div>
              <div>
                <h2 className="text-sm font-medium">Shop</h2>
                <nav className="mt-4 flex flex-col gap-2 text-sm text-paper/70">
                  <a href="/search" className="hover:text-paper">All products</a>
                  <a href="/account/orders" className="hover:text-paper">Orders</a>
                  <a href="/account/wishlist" className="hover:text-paper">Wishlist</a>
                </nav>
              </div>
              <div>
                <h2 className="text-sm font-medium">Account</h2>
                <nav className="mt-4 flex flex-col gap-2 text-sm text-paper/70">
                  <a href="/account" className="hover:text-paper">My account</a>
                  <a href="/account/settings" className="hover:text-paper">Settings</a>
                  <a href="/login" className="hover:text-paper">Sign in</a>
                </nav>
              </div>
            </div>
            <div className="border-t border-paper/15 px-4 py-5 text-center text-xs text-paper/50">
              © {new Date().getFullYear()} MVP Store. All rights reserved.
            </div>
            <div className="border-t border-paper/15 px-4 py-5 text-center text-xs text-paper/50">
              <a href="https://okafor-i-collins-portfolio-next-js.vercel.app" className="underline hover:text-paper">Ifechukwu Okafor</a>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
