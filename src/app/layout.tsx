import type { Metadata, Viewport } from "next";
import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Only 2 Arabic weights (400 text / 700 bold): each extra weight is a separate
// woff2 download on mobile. Big perceived-speed win for AR users.
const arabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "WASLA — Turn chats into confirmed COD sales, delivered across 58 wilayas",
  description:
    "The COD engine for Algerian sellers: confirm cash-on-delivery orders on WhatsApp in Darija, sync Yalidine, ZR Express, Maystro & NOEST to all 58 wilayas, and publish to Facebook, Instagram, TikTok & WhatsApp in one click.",
  keywords: ["WASLA", "وصة", "e-commerce", "Algeria", "MENA", "multi-channel", "WhatsApp commerce", "COD", "cash on delivery", "Yalidine", "wilayas", "publishing", "SaaS", "الدفع عند الاستلام", "التجارة الإلكترونية الجزائر"],
  authors: [{ name: "WASLA" }],
  icons: { icon: "/wasla-icon.svg" },
  openGraph: {
    title: "WASLA — The COD engine for Algerian sellers",
    description: "WhatsApp COD confirmations in Darija, delivery to all 58 wilayas, one-click publishing to 8 platforms.",
    siteName: "WASLA",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF9F5" },
    { media: "(prefers-color-scheme: dark)", color: "#131A17" },
  ],
};

// set html dir/lang before hydration to avoid RTL flash for returning Arabic users
const localeBoot = `(function(){try{var l=localStorage.getItem('wasla-locale');if(l==='ar'){document.documentElement.dir='rtl';document.documentElement.lang='ar';}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: localeBoot }} />
      </head>
      <body
        className={`${inter.variable} ${arabic.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
