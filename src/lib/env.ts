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
