import { Analytics } from "@vercel/analytics/next"
import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Land the Interview",
  description: "Tailor your resume to any job posting with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          <ClerkProvider>
          <header className="flex justify-between items-center px-6 h-16 border-b border-neutral-100">
            <span className="font-semibold text-sm tracking-tight">
              Land the Interview
            </span>
            <div className="flex items-center gap-4">
              <Show when="signed-out">
                <SignInButton />
                <SignUpButton>
                  <button className="bg-black text-white rounded-lg font-medium text-sm px-4 py-2 cursor-pointer hover:bg-neutral-800 transition-colors">
                    Sign Up
                  </button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </div>
          </header>
          {children}
        </ClerkProvider>
        </body>
        <Analytics />
      </html>
  );
}
