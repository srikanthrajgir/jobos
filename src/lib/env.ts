import "server-only";

function requireValue(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getSupabasePublicConfig() {
  return {
    url: requireValue("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: requireValue("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

export function getSupabaseAdminConfig() {
  return {
    ...getSupabasePublicConfig(),
    serviceRoleKey: requireValue("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

export function getAppUrl(): URL {
  const raw = requireValue("NEXT_PUBLIC_APP_URL");
  const url = new URL(raw);
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_APP_URL must use HTTPS in production");
  }
  return url;
}

// Read at runtime through requireValue's dynamic process.env access rather than
// letting the client bundle inline `process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
// at build time. Next inlines NEXT_PUBLIC_* literals during `next build`, and
// the Dockerfile builds with no env at all, so an inlined read would bake in
// `undefined` no matter what Coolify sets at runtime. The server page reads this
// and passes it down instead. Optional: a missing key degrades to a message
// rather than throwing, so the rest of the page still works.
export function getGoogleMapsApiKey(): string | null {
  const name = "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY";
  return process.env[name]?.trim() || null;
}

export function getOpenAIConfig() {
  return {
    apiKey: requireValue("OPENAI_API_KEY"),
    model: process.env.OPENAI_MODEL?.trim() || "gpt-5.6-terra",
    baseUrl: (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, ""),
  };
}

export function getResendConfig() {
  return {
    apiKey: requireValue("RESEND_API_KEY"),
    from: requireValue("APPLICATION_FROM_EMAIL"),
  };
}

export function getCronSecret(): string {
  return requireValue("CRON_SECRET");
}
