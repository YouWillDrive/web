import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { AuthProvider } from "@/contexts/auth-context";
import { NavigationWrapper } from "@/components/layout/navigation-wrapper";
import { AuthLayout } from "@/components/auth/auth-layout";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YouWillDrive",
  description: "Веб-интерфейс для администраторов",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();

  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <AuthLayout>
              <div className="min-h-screen flex flex-col">
                <NavigationWrapper />
                <main className="flex-1">{children}</main>
              </div>
            </AuthLayout>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
