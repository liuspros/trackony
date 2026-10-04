import { Lexend } from "next/font/google";
import "./globals.css";

const lexend = Lexend({ subsets: ["latin"], variable: "--font-lexend" });

export const metadata = {
  title: "Trackony — share your live location",
  description: "Share your live GPS location with people you trust, on a satellite map.",
};
export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#7a1f33" };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={lexend.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
