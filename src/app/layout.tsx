import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import I18nProvider from '@/components/I18nProvider';
import { SchedulerProvider } from '@/components/scheduler-provider';
import { Inter as FontSans } from "next/font/google"
import { cn } from '@/lib/utils';
import { initialItems, initialGroups } from '@/lib/data';

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: 'Planificador Mensual',
  description: 'Una aplicación completa de planificación mensual.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={cn("font-sans antialiased", fontSans.variable)}>
        <I18nProvider>
          <SchedulerProvider items={initialItems} groups={initialGroups}>
            {children}
            <Toaster />
          </SchedulerProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
