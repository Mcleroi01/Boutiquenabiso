import "./globals.css";
import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import { VisitorTracker } from "@/components/visitor-tracker";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BOUTIQUE NA BISO - Achat en Chine, livraison à Kinshasa",
  description:
    "Votre intermédiaire de confiance pour acheter des produits en Chine (Pinduoduo, 1688, Alibaba). iPhones, accessoires, électronique et plus. Livraison à Kinshasa.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <VisitorTracker />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
