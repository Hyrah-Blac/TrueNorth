import "server-only";
import QRCode from "qrcode";

/**
 * Renders a QR code for the given URL as a PNG data URI, generated
 * locally (no external QR-code API — see Phase 2 requirements). Used
 * both for the on-screen ticket (an <img> tag can use a data URI
 * directly) and inside the PDF (react-pdf's <Image> also accepts a
 * data URI directly, so the same helper serves both).
 */
export async function generateQrCodeDataUrl(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 480,
    color: {
      dark: "#0b1622", // navy-950, matches the site's brand color (see src/styles/variables.css)
      light: "#ffffff",
    },
  });
}
