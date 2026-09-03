import type { Metadata } from "next";
import "@fontsource/plus-jakarta-sans";
import "@fontsource/dm-serif-display";
import "./globals.css";
import ChatWidget from "@/components/ChatWidget";
import { THEME_BOOTSTRAP_SCRIPT } from "@/lib/theme";

const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL || "https://jobos.com.au");

export const metadata: Metadata = {
  metadataBase: appUrl,
  title: {
    default: "JobOS Australia | Your career command centre",
    template: "%s | JobOS Australia",
  },
  description: "Discover opportunities, research companies, create stronger applications, manage follow-ups and measure your job-search progress with JobOS.",
  applicationName: "JobOS",
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: "/",
    siteName: "JobOS",
    title: "JobOS — Your career command centre",
    description: "Verified opportunities, tailored applications and a clear job-search pipeline in one secure workspace.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "JobOS — Your career command centre" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "JobOS — Your career command centre",
    description: "Verified opportunities, tailored applications and a clear job-search pipeline in one secure workspace.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Dark stays the server-rendered default, so the look is unchanged without
    // JS. suppressHydrationWarning is required because the script below edits
    // these very attributes before React hydrates.
    <html lang="en" className="dark h-full antialiased" data-theme="dark" suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans">
        {/* First thing in the body: applies the stored (or system) theme before
            the browser paints, so a light-mode visitor never sees a dark flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
        {children}
        {/* Mounted in the root layout so it is present on every route — the
            landing page, auth pages, the app shell and admin — and survives
            client navigation without remounting. */}
        <ChatWidget />
      </body>
    </html>
  );
}
