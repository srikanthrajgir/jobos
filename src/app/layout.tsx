import type { Metadata } from "next";
import "@fontsource/plus-jakarta-sans";
import "@fontsource/dm-serif-display";
import "./globals.css";
import ChatWidget from "@/components/ChatWidget";
import Script from "next/script";

export const metadata: Metadata = {
  title: "JobOS Australia | AI Job Operating System",
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
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-5LMQW7518B"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-5LMQW7518B');
          `}
        </Script>
        
        {children}

        <ChatWidget />
      </body>
    </html>
  );
}
