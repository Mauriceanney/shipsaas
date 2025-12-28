import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env["SMTP_HOST"] || "localhost",
  port: parseInt(process.env["SMTP_PORT"] || "1025", 10),
  secure: false,
  auth:
    process.env["SMTP_USER"] && process.env["SMTP_PASS"]
      ? {
          user: process.env["SMTP_USER"],
          pass: process.env["SMTP_PASS"],
        }
      : undefined,
});

const appName = process.env["NEXT_PUBLIC_APP_NAME"] || "SaaS Boilerplate";
const appUrl = process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000";
const fromEmail = process.env["EMAIL_FROM"] || "noreply@localhost";

export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<void> {
  const verificationUrl = `${appUrl}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"${appName}" <${fromEmail}>`,
    to: email,
    subject: `Verify your email for ${appName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your email</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${appName}</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="margin-top: 0;">Verify your email address</h2>
            <p>Thanks for signing up! Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                Verify Email
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p style="background: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">${verificationUrl}</p>
            <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; margin-bottom: 0;">If you didn't create an account, you can safely ignore this email.</p>
          </div>
        </body>
      </html>
    `,
    text: `
Verify your email for ${appName}

Thanks for signing up! Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.
    `,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"${appName}" <${fromEmail}>`,
    to: email,
    subject: `Reset your password for ${appName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset your password</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${appName}</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="margin-top: 0;">Reset your password</h2>
            <p>We received a request to reset your password. Click the button below to choose a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p style="background: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">${resetUrl}</p>
            <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; margin-bottom: 0;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          </div>
        </body>
      </html>
    `,
    text: `
Reset your password for ${appName}

We received a request to reset your password. Click the link below to choose a new password:

${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
    `,
  });
}

export async function sendPasswordChangedEmail(email: string): Promise<void> {
  await transporter.sendMail({
    from: `"${appName}" <${fromEmail}>`,
    to: email,
    subject: `Your password has been changed - ${appName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password changed</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${appName}</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="margin-top: 0;">Password Changed</h2>
            <p>Your password has been successfully changed.</p>
            <p>If you did not make this change, please contact support immediately and secure your account.</p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; margin-bottom: 0;">This is an automated security notification from ${appName}.</p>
          </div>
        </body>
      </html>
    `,
    text: `
Password Changed - ${appName}

Your password has been successfully changed.

If you did not make this change, please contact support immediately and secure your account.

This is an automated security notification from ${appName}.
    `,
  });
}
