'use client';

import { useEffect, useState } from 'react';
import { getMoment } from '@/utils';
import { Locale } from '@microrealestate/types';

interface SafeDateProps {
  date: string | Date | null | undefined;
  locale: Locale;
  format?: string;
  fallback?: string;
}

export function SafeDate({ date, locale, format = 'LL', fallback = '-' }: SafeDateProps) {
  const [formattedDate, setFormattedDate] = useState<string>(fallback);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (date) {
      try {
        const moment = getMoment(locale);
        const formatted = moment(date).format(format);
        setFormattedDate(formatted);
      } catch (error) {
        console.error('Error formatting date:', error);
        setFormattedDate(fallback);
      }
    } else {
      setFormattedDate(fallback);
    }
  }, [date, locale, format, fallback]);

  // During SSR and before hydration, show fallback to prevent mismatch
  if (!mounted) {
    return <span suppressHydrationWarning>{fallback}</span>;
  }

  return <span>{formattedDate}</span>;
}
