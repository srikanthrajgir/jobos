import "server-only";

import { getResendConfig } from "@/lib/env";
import { emailSchema } from "@/lib/validation";
import { normalizeHeaderText } from "@/lib/security";

type Attachment = {
  filename: string;
  content: string;
};

type SendApplicationEmailInput = {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
  idempotencyKey: string;
  attachments?: Attachment[];
};

export async function sendApplicationEmail(input: SendApplicationEmailInput): Promise<string> {
  const config = getResendConfig();
  const to = emailSchema.parse(input.to);
  const replyTo = input.replyTo ? emailSchema.parse(input.replyTo) : undefined;
  const subject = normalizeHeaderText(input.subject, 200);
  const text = input.text.trim().slice(0, 20_000);
  if (!subject || !text) throw new Error("Application email subject and body are required");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify({
      from: config.from,
      to: [to],
      subject,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
      ...(input.attachments?.length ? { attachments: input.attachments } : {}),
      tags: [{ name: "message_type", value: "job_application" }],
    }),
    signal: AbortSignal.timeout(30_000),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Email provider request failed with status ${response.status}`);
  const payload = await response.json() as { id?: string };
  if (!payload.id) throw new Error("Email provider returned no delivery id");
  return payload.id;
}
