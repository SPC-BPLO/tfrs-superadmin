import type { Metadata } from "next";
import "./globals.css";
import "./refined.css";
import "./bplo-theme.css";
import "./admin-login.css";

export const metadata: Metadata = {
  title: "TFRS · Super Admin",
  description:
    "Centralized administration for the Tricycle Franchising and Renewal System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
