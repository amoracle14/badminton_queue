import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const notoSansThai = localFont({
  src: [
    {
      path: "../public/fonts/NotoSansThai-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/NotoSansThai-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/NotoSansThai-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/NotoSansThai-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-noto-sans-thai",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AceCourt",
  description: "Badminton court queue and scoring interface",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${notoSansThai.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
