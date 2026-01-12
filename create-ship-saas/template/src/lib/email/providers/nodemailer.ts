/**
 * Nodemailer email provider implementation
 */

import nodemailer from "nodemailer";
import type {
  EmailProvider,
  SendEmailOptions,
  SendEmailResult,
} from "../types";

/**
 * Nodemailer SMTP configuration
 */
export interface NodemailerConfig {
  host: string;
  port: number;
  secure: boolean;
  auth?: {
    user: string;
    pass: string;
  };
}

/**
 * Create a Nodemailer email provider
 * @param config - SMTP configuration
 * @returns EmailProvider implementation
 */
export function createNodemailerProvider(
  config: NodemailerConfig
): EmailProvider {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  return {
    name: "nodemailer",

    async send(options: SendEmailOptions): Promise<SendEmailResult> {
      try {
        const info = await transporter.sendMail({
          from: options.from,
          to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
          replyTo: options.replyTo,
          cc: options.cc,
          bcc: options.bcc,
          attachments: options.attachments?.map((att) => ({
            filename: att.filename,
            content: att.content,
            contentType: att.contentType,
          })),
        });

        return {
          success: true,
          messageId: info.messageId,
        };
      } catch (error) {
        console.error("Nodemailer send error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  };
}
