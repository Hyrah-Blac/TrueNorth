import { NextResponse } from "next/server";

/**
 * /.well-known/security.txt
 *
 * Standard file (RFC 9116) that tells security researchers how to
 * report vulnerabilities responsibly. Update the contact email and
 * expiry date before going live.
 */
export async function GET() {
  const body = [
    "Contact: mailto:security@truenorthaircharters.com",
    "Expires: 2027-01-01T00:00:00.000Z",
    "Preferred-Languages: en",
    "Policy: https://truenorthaircharters.com/security-policy",
  ].join("\n");

  return new NextResponse(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}