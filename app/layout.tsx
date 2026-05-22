import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RemiTrainer",
  description: "Household workouts that remember, adapt, and stay aligned.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
