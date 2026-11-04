import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew"],
  variable: "--font-heebo",
});

export const metadata: Metadata = {
  title: "LawCRM",
  description: "מערכת ניהול לקוחות לעורכי דין",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} h-full antialiased`}
    >
      <body className={`min-h-full flex flex-col ${heebo.className}`}>{children}</body>
    </html>
  );
}
