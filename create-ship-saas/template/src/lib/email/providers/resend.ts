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
        // Build email options with conditional properties to avoid undefined values
        const emailOptions: Parameters<typeof resend.emails.send>[0] = {
          from: options.from!,
          to: Array.isArray(options.to) ? options.to : [options.to],
          subject: options.subject,
          html: options.html,
        };

        // Add optional properties only if they exist
        if (options.text) {
          emailOptions.text = options.text;
        }
        if (options.replyTo) {
          emailOptions.replyTo = options.replyTo;
        }
        if (options.cc) {
          emailOptions.cc = Array.isArray(options.cc) ? options.cc : [options.cc];
        }
        if (options.bcc) {
          emailOptions.bcc = Array.isArray(options.bcc) ? options.bcc : [options.bcc];
        }
        if (options.tags) {
          emailOptions.tags = Object.entries(options.tags).map(([name, value]) => ({
            name,
            value,
          }));
        }

        const { data, error } = await resend.emails.send(emailOptions);

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
