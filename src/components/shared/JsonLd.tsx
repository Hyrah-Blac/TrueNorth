import { headers } from "next/headers";

export async function JsonLd({ data }: { data: Record<string, unknown> }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  // JSON.stringify does not escape "</script>", "<!--", or the
  // U+2028/U+2029 line separators, so admin-editable content flowing
  // into this schema (company name/description, aircraft name, etc.)
  // could otherwise break out of this <script> tag and inject live
  // markup/script. Escaping "<" is sufficient to prevent that breakout
  // and is valid inside a JSON string, so it doesn't change the parsed
  // value on the consuming (search engine) side.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}