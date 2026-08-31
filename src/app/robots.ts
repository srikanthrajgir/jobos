import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const origin = new URL(process.env.NEXT_PUBLIC_APP_URL || "https://jobos.com.au").origin;
  return {
    rules: [{
      userAgent: "*",
      allow: "/",
      disallow: ["/app/", "/admin/", "/api/", "/auth/"],
    }],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
