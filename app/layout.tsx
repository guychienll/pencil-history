import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PencilHistory.xyz - Git 歷史視覺化檢視器",
  description: "檢視 GitHub .pen 設計檔案的 commit 歷史，視覺化呈現每個版本的設計內容",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col h-dvh overflow-hidden`}
      >
        <ErrorBoundary>
          <Header />
          <main className="flex-1 bg-gray-50 overflow-hidden">{children}</main>
        </ErrorBoundary>
      </body>
    </html>
  );
}
