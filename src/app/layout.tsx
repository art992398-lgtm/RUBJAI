import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { SettingsProvider } from "@/lib/settings-context";
import { DataProvider } from "@/lib/data-context";
import { ToastProvider } from "@/components/ToastProvider";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const notoThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-thai",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rubjai - บันทึกรายรับรายจ่าย",
  description: "เว็บบันทึกรายรับรายจ่ายส่วนตัว ล็อกอินด้วย Google แยกข้อมูลรายบุคคล",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Rubjai", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#fff5f9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={notoThai.variable}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <SettingsProvider>
            <DataProvider>
              <ToastProvider>{children}</ToastProvider>
            </DataProvider>
          </SettingsProvider>
          <ServiceWorkerRegister />
        </AuthProvider>
      </body>
    </html>
  );
}
