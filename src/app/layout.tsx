import type { Metadata, Viewport } from "next";

import { themeCss } from "@/lib/tokens";

import "./fonts.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Revelle Société",
    template: "%s — Revelle Société",
  },
  // The page's own words, not a description of the service. "You bring the
  // occasion, we create the experience" was approved under the old framing and
  // did not survive host-as-hero — see docs/copy-brief.md.
  description:
    "A société for people who host. WESTHAMPTON, 1976 — vintage summer glamour, very questionable houseguests.",
  // Declared here rather than by the app/icon.svg file convention, because the
  // mark exists in two colourways and the convention has no way to say which
  // one a dark browser chrome should take. Order matters: a browser walks the
  // list and keeps the last one whose media matches, so the light SVG is
  // stated first and the dark overrides it only where it applies. The 32px PNG
  // is the fallback for anything that will not take an SVG.
  icons: {
    icon: [
      { url: "/icons/favicon.svg", type: "image/svg+xml" },
      {
        url: "/icons/favicon-dark.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: dark)",
      },
      { url: "/icons/favicon-32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
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
