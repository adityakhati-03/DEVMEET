import type { Metadata } from "next";
import { Syne } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AuthProvider from "@/context/AuthProvider";
import { Toaster } from "sonner";
import { Providers } from "@/components/Providers";
import SidebarWrapper from "@/components/SidebarWrapper";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"]
});

export const metadata: Metadata = {
  title: "DevMeet",
  description: "place where devs collab",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${syne.variable} ${syne.className} font-sans antialiased text-white bg-[#080a0f] selection:bg-emerald-500/30 overflow-x-hidden relative min-h-screen`}>
        {/* NSOC Global Grid Background */}
        <div className="fixed inset-0 pointer-events-none z-[-1] opacity-50 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <Providers>
              <Header />
              <Toaster position="top-right" richColors />
              {/* Physical spacer — 64px = navbar height */}
              <div style={{ height: '64px', flexShrink: 0 }} aria-hidden="true" />
              <main style={{ minHeight: 'calc(100vh - 64px)' }}>
                <SidebarWrapper>
                  {children}
                </SidebarWrapper>
              </main>
            </Providers>
            <Footer />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}