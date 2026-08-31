import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = new URL(process.env.NEXT_PUBLIC_APP_URL || "https://jobos.com.au").origin;
  return [{ url: origin, lastModified: new Date(), changeFrequency: "weekly", priority: 1 }];
}
