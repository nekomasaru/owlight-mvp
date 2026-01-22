import type { Metadata } from "next";
import "./globals.css";
import Link from 'next/link';

export const metadata: Metadata = {
  title: "OWLight MVP",
  description: "Simple Chat & Engagement App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased min-h-screen flex flex-col">
        <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-lg border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex-shrink-0 flex items-center">
                <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  OWLight
                </span>
              </div>
              <nav className="flex space-x-8">
                <Link
                  href="/"
                  className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Chat
                </Link>
                <Link
                  href="/engagement"
                  className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Engagement
                </Link>
              </nav>
            </div>
          </div>
        </header>
        <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
          {children}
        </main>
      </body>
    </html>
  );
}
