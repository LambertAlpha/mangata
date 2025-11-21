import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Mangata - Decentralized Content Subscription",
  description: "去中心化内容订阅平台 - 基于 Sui, Walrus 和 Seal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
