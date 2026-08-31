import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getAppUrl } from "@/lib/env";
import { safeRedirectPath } from "@/lib/security";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeRedirectPath(requestUrl.searchParams.get("next"));
  const baseUrl = process.env.NODE_ENV === "development" ? requestUrl.origin : getAppUrl().origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${baseUrl}${next}`);
  }

  return NextResponse.redirect(`${baseUrl}/login?message=Could not verify email`);
}
