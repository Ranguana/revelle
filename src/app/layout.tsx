import type { Metadata, Viewport } from "next";

import { themeCss } from "@/lib/tokens";

import "./fonts.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Revelle Société",
    template: "%s — Revelle Société",
  },
  description:
    "A creative director for your social life. You bring the occasion, we create the experience.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Both surfaces are painted from tokens; telling the browser we handle both
  // stops it inverting form controls out from under the palette.
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#EFE3D2" },
    { media: "(prefers-color-scheme: dark)", color: "#101B23" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <head>
        {/*
          The theme is data (src/lib/tokens.ts) and is rendered to CSS here, in
          the head, before first paint. Inline rather than a stylesheet because
          a world will one day supply its own token set per page and there is
          nothing to link to.
        */}
        <style dangerouslySetInnerHTML={{ __html: themeCss() }} />
        {/*
          The two faces above the fold. Everything else can swap in late; a
          display heading that reflows after the customer has started reading
          is the one visible cost worth spending a preload on.
        */}
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="/fonts/bodoni-moda-regular.29d77437.woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="/fonts/karla-regular.53cf0a3a.woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
