import type { Metadata, Viewport } from "next";
import { DemoProvider } from "@/lib/demo-store";
import { SessionProvider } from "@/lib/session";
import { SiteProvider } from "@/lib/sites";
import "./globals.css";
import "./workforce.css";
import "./operations.css";
import "./refinements.css";

export const metadata: Metadata = {
  title: "Navbea Workforce | Saha Yönetimi",
  description: "Navbea Workforce: görev atama, ekip yönetimi, üretim ve gün sonu kayıtları.",
  icons: { icon: "/icon.svg" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#101e37" };

const themeScript = `(function(){try{var t=localStorage.getItem('navbea-theme');document.documentElement.dataset.theme=t==='dark'?'dark':'light'}catch(e){}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <SessionProvider>
          <SiteProvider>
            <DemoProvider>{children}</DemoProvider>
          </SiteProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
