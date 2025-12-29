/**
 * Resend email provider implementation
 */

import { Resend } from "resend";

import type {
  EmailProvider,
  SendEmailOptions,
  SendEmailResult,
} from "../types";

/**
 * Create a Resend email provider
 * @param apiKey - Resend API key
 * @returns EmailProvider implementation
 */
export function createResendProvider(apiKey: string): EmailProvider {
  const resend = new Resend(apiKey);

  return {
    name: "resend",

    async send(options: SendEmailOptions): Promise<SendEmailResult> {
      try {
        const { data, error } = await resend.emails.send({
          from: options.from!,
          to: Array.isArray(options.to) ? options.to : [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
          replyTo: options.replyTo,
          cc: options.cc
            ? Array.isArray(options.cc)
              ? options.cc
              : [options.cc]
            : undefined,
          bcc: options.bcc
            ? Array.isArray(options.bcc)
              ? options.bcc
              : [options.bcc]
            : undefined,
          tags: options.tags
            ? Object.entries(options.tags).map(([name, value]) => ({
                name,
                value,
              }))
            : undefined,
        });

        if (error) {
          console.error("Resend error:", error);
          return {
            success: false,
            error: error.message,
          };
        }

        return {
          success: true,
          messageId: data?.id,
        };
      } catch (error) {
        console.error("Resend send error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  };
}
