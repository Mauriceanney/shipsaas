import { generateOTPAuthURL } from "./totp";

/**
 * Lazily generate a QR code data URL
 * QRCode library is only loaded when needed to reduce bundle size
 */
export async function generateQRCodeDataURL(
  email: string,
  secret: string
): Promise<string> {
  const QRCode = await import("qrcode");
  const otpauthURL = generateOTPAuthURL(email, secret);

  return QRCode.toDataURL(otpauthURL, {
    errorCorrectionLevel: "M",
    type: "image/png",
    width: 200,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
}

/**
 * Generate QR code as SVG string (for SSR or custom rendering)
 */
export async function generateQRCodeSVG(
  email: string,
  secret: string
): Promise<string> {
  const QRCode = await import("qrcode");
  const otpauthURL = generateOTPAuthURL(email, secret);

  return QRCode.toString(otpauthURL, {
    type: "svg",
    errorCorrectionLevel: "M",
    width: 200,
    margin: 2,
  });
}
