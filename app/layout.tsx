import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import LegalConsentBanner from "@/components/LegalConsentBanner";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
 title:"Услугач — услуги и заявки рядом",
 description:"Маркетплейс услуг: находите специалистов, публикуйте услуги и заявки, общайтесь и выбирайте исполнителя.",
 metadataBase:new URL("https://uslugach-barakacrm.vercel.app"),
 robots:{index:true,follow:true},
 icons:{
  icon:"/icons/logo-mark.svg",
  shortcut:"/icons/logo-mark.svg",
  apple:"/icons/logo-mark.svg",
 },
 openGraph:{title:"Услугач — услуги и заявки рядом",description:"Поиск специалистов и реальные заявки на услуги.",type:"website",locale:"ru_RU",siteName:"Услугач"},
 twitter:{card:"summary_large_image",title:"Услугач — услуги и заявки рядом",description:"Поиск специалистов и реальные заявки на услуги."},
};

export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ru"><body><SiteHeader />{children}<SiteFooter /><LegalConsentBanner /></body></html>;}