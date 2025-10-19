"use client";
import { useEffect } from 'react';
import { initI18n } from '@/i18n';

export default function I18nProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  useEffect(() => {
    initI18n();
  }, []);

  return <>{children}</>;
}
