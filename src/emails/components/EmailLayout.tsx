import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Link,
} from "@react-email/components";
import type { ReactNode } from "react";

const colors = {
  navy: "#0e2138",
  sky: "#2f8fdb",
  slate: "#475467",
  slateLight: "#98a2b3",
  border: "#e4e7ec",
  bg: "#f5f7fa",
};

export function EmailLayout({
  previewText,
  heading,
  children,
}: {
  previewText: string;
  heading: string;
  children: ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={{ backgroundColor: colors.bg, fontFamily: "Helvetica, Arial, sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: "32px 24px" }}>
          <Section style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: colors.navy,
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              True North Charters
            </Text>
          </Section>

          <Section
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 12,
              border: `1px solid ${colors.border}`,
              padding: "32px 28px",
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: 700, color: colors.navy, margin: "0 0 16px" }}>
              {heading}
            </Text>
            {children}
          </Section>

          <Section style={{ marginTop: 24 }}>
            <Hr style={{ borderColor: colors.border, margin: "0 0 16px" }} />
            <Text style={{ fontSize: 12, color: colors.slateLight, margin: 0, lineHeight: "18px" }}>
              True North Charters · Wilson Airport, Nairobi, Kenya
              <br />
              <Link href="mailto:operations@truenorthcharters.co.ke" style={{ color: colors.sky }}>
                operations@truenorthcharters.co.ke
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function EmailText({ children }: { children: ReactNode }) {
  return <Text style={{ fontSize: 14, color: colors.slate, lineHeight: "22px", margin: "0 0 16px" }}>{children}</Text>;
}

export function EmailButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Section style={{ margin: "24px 0" }}>
      <Link
        href={href}
        style={{
          backgroundColor: colors.sky,
          color: "#ffffff",
          padding: "12px 24px",
          borderRadius: 999,
          fontSize: 14,
          fontWeight: 600,
          textDecoration: "none",
          display: "inline-block",
        }}
      >
        {children}
      </Link>
    </Section>
  );
}

export function EmailDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Section style={{ borderBottom: `1px solid ${colors.border}`, padding: "10px 0" }}>
      <table width="100%" cellPadding={0} cellSpacing={0}>
        <tbody>
          <tr>
            <td style={{ fontSize: 13, color: colors.slateLight }}>{label}</td>
            <td style={{ fontSize: 13, color: colors.navy, fontWeight: 600, textAlign: "right" }}>{value}</td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
}

export const emailColors = colors;
