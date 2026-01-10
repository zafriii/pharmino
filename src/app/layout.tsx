import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "next-themes";
import NextTopLoader from "nextjs-toploader";
import { startCronJobs } from "@/lib/cron-service";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "Pharmino",
    absolute: "Pharmino",
  },
  description:
    "",
};

// Initialize cron jobs on server startup
if (typeof window === "undefined") {
  startCronJobs();
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* TOP PAGE LOADER  */}
        <NextTopLoader
          color="linear-gradient(to right, #3b82f6, #06b6d4)"
          height={3}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px rgba(59,130,246,0.4)"
        />

        {/* Theme Provider */}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
