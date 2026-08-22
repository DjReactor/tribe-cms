import type { Metadata } from "next";
import "./globals.css";

// NOTE: do not add `export const dynamic = 'force-dynamic'` here. It sat on this
// root layout and cascaded to every route in the app, so nothing was ever
// cached. Segments that genuinely must stay dynamic declare it themselves
// (`dashboard/layout.tsx`, the API route handlers, `login`, `sitemap*`).

export const metadata: Metadata = {
  title: {
    default: 'Website',
    template: '%s',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
