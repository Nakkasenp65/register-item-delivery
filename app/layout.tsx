import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "../components/providers/Provider";

export const metadata: Metadata = {
  title: "ลงทะเบียนคืนกล่องสินค้า",
  description: "ระบบลงทะเบียนคืนกล่องสินค้า",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
