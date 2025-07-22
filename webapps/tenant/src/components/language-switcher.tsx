'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Locale } from '@microrealestate/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select';
import { LOCALES } from '@/utils/i18n/common';

const languageNames: Record<string, string> = {
  'en': 'English',
  'fr-FR': 'Français',
  'pt-BR': 'Português',
  'de-DE': 'Deutsch',
  'es-CO': 'Español (Colombia)',
  'es-DO': 'Español (República Dominicana)'
};

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  
  // Extract the current locale from the pathname
  const currentLocale = pathname.split('/')[1] as Locale;
  
  // Function to change the locale
  const handleLocaleChange = (newLocale: string) => {
    // Replace the current locale in the pathname with the new one
    const newPath = pathname.replace(`/${currentLocale}/`, `/${newLocale}/`);
    router.push(newPath);
  };

  return (
    <Select value={currentLocale} onValueChange={handleLocaleChange}>
      <SelectTrigger className="w-full bg-card border-secondary-foreground/25 hover:bg-accent hover:text-accent-foreground focus:ring-1 focus:ring-ring">
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent className="bg-card border-secondary-foreground/25">
        {LOCALES.map((locale) => (
          <SelectItem 
            key={locale} 
            value={locale}
            className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          >
            {languageNames[locale] || locale}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
