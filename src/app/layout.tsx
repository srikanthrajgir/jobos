import type { Metadata } from "next";
import "@fontsource/plus-jakarta-sans";
import "@fontsource/dm-serif-display";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";

export const metadata: Metadata = {
  title: "JobOS Australia | AI Career Operating System",
  description: "Discover opportunities, research companies, create stronger applications, manage follow-ups and measure your job-search progress with JobOS.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark h-full antialiased" data-theme="dark">
      <body className="min-h-full flex flex-col font-sans">
        <Navbar />
        <main className="flex-grow pt-24">
          {children}
        </main>
        <Footer />
        <ChatWidget />
      </body>
    </html>
  );
}
