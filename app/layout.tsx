import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Услугач — услуги рядом",
  description: "Сервис для поиска исполнителей и размещения заявок на услуги.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
