import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthKitProvider } from '@workos-inc/authkit-nextjs/components';
import { MCPServerInit } from '@/components/mcp-server-init';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { ToastProvider } from '@/components/ui/toast';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProfileBase | Be Discovered by AI Agents Worldwide via MCP",
  description: "Register your profile to be discoverable by AI agents globally through MCP (Model Context Protocol). Connect with intelligent systems worldwide at https://profilebase.ai/mcp",
};

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
        <MCPServerInit />
        <ErrorBoundary>
          <ToastProvider>
            <AuthKitProvider>
              {children}
            </AuthKitProvider>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
