/**
 * Lazy QR Code Generator
 *
 * Dynamically imports the qrcode library only when needed,
 * reducing initial bundle size by ~50KB for users who don't use 2FA.
 */

import type QRCodeType from "qrcode";

// Module cache
let qrcodeModule: typeof QRCodeType | null = null;

/**
 * Load the QR code module (cached after first load)
 */
async function loadQRCode(): Promise<typeof QRCodeType> {
  if (qrcodeModule) {
    return qrcodeModule;
  }

  const qrModule = await import("qrcode");
  qrcodeModule = qrModule.default;
  return qrModule.default;
}

/**
 * Generate a QR code data URL (lazy loads qrcode library)
 *
 * @param otpauthUri - The otpauth:// URI to encode
 * @returns Data URL of the generated QR code
 */
export async function generateQRCodeLazy(otpauthUri: string): Promise<string> {
  const QRCode = await loadQRCode();

  return QRCode.toDataURL(otpauthUri, {
    errorCorrectionLevel: "M",
    type: "image/png",
    margin: 2,
    width: 256,
  });
}
