import type { Metadata } from "next";
import { Inter, Noto_Sans_JP, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-jp'
});
const outfit = Outfit({
  subsets: ["latin"],
  variable: '--font-outfit'
});

export const metadata: Metadata = {
  title: "OWLight | Autonomous Governance",
  description: "Beyond the Manual.",
};

import { UserProvider } from "@/contexts/UserContext";
import { ToastProvider } from "@/contexts/ToastContext";

import AppShell from "@/components/Layout/AppShell";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.variable} ${notoSansJP.variable} ${outfit.variable} font-sans antialiased min-h-screen bg-slate-50`}>
        <UserProvider>
          <ToastProvider>
            <AppShell>
              {children}
            </AppShell>
          </ToastProvider>
        </UserProvider>
      </body>
    </html>
  );
}
