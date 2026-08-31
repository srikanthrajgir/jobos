"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getAppUrl } from "@/lib/env";
import { loginSchema, signupSchema } from "@/lib/validation";

export async function signInWithGoogle() {
  const supabase = await createClient();
  const callback = new URL("/auth/callback", getAppUrl());
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callback.toString() },
  });
  if (error || !data.url) redirect("/login?message=Google sign-in is temporarily unavailable");
  redirect(data.url);
}

export async function login(formData: FormData) {
  const result = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!result.success) redirect("/login?message=Enter a valid email and password");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(result.data);
  if (error) redirect("/login?message=Email or password is incorrect");
  redirect("/app");
}

export async function signup(formData: FormData) {
  const result = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!result.success) redirect("/signup?message=Use a valid email and a password of at least 12 characters");

  const supabase = await createClient();
  const callback = new URL("/auth/callback", getAppUrl());
  const { data, error } = await supabase.auth.signUp({
    ...result.data,
    options: { emailRedirectTo: callback.toString() },
  });
  if (error) redirect("/signup?message=Account creation could not be completed");
  if (data.session) redirect("/app");
  redirect("/login?message=Check your email to verify your account");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
