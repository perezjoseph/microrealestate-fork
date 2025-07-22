import {
  DEFAULT_LOCALE,
  getLocaleFromPathname,
  LOCALES
} from '@/utils/i18n/common';
import getServerEnv from './utils/env/server';
import { Locale } from '@microrealestate/types';
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const GATEWAY_URL =
  getServerEnv('DOCKER_GATEWAY_URL') ||
  getServerEnv('GATEWAY_URL') ||
  'http://localhost';

export async function middleware(request: NextRequest) {
  let nextResponse = injectLocale(request);
  if (nextResponse) {
    return nextResponse;
  }

  if (getServerEnv('DEMO_MODE') !== 'true') {
    nextResponse = await redirectSignIn(request);
    if (nextResponse) {
      return nextResponse;
    }
  }

  nextResponse = redirectDashboard(request);
  if (nextResponse) {
    return nextResponse;
  }

  return injectXPathHeader(request);
}

export const config = {
  matcher: [
    // Skip all paths which do not need to be localized
    '/((?!api|health|_next/static|_next/image|favicon.svg|welcome.svg).*)',
    '/'
  ]
};

function getRequestLocale(request: NextRequest) {
  const requestHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    requestHeaders[key] = value;
  });
  
  // Get languages from request headers
  let languages = new Negotiator({ headers: requestHeaders }).languages();
  
  // Debug logging to help diagnose issues
  console.debug('Available locales:', LOCALES);
  console.debug('Browser languages:', languages);
  
  // Filter out invalid language values
  languages = languages.filter(lang => lang !== '*' && lang !== undefined && lang !== null);
  
  // If no valid languages, use default
  if (!languages.length) {
    console.debug('No valid languages found, using default:', DEFAULT_LOCALE);
    return DEFAULT_LOCALE;
  }
  
  try {
    // Try to match the browser language to our available locales
    const matchedLocale = match(languages, LOCALES, DEFAULT_LOCALE) as Locale;
    console.debug('Matched locale:', matchedLocale);
    return matchedLocale;
  } catch (error) {
    console.error('Error matching locale:', error);
    return DEFAULT_LOCALE;
  }
}

function injectLocale(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestLocale = getRequestLocale(request);
  const pathnameLocale = getLocaleFromPathname(pathname);
  const locale = pathnameLocale || requestLocale;

  // If no locale in pathname, redirect to include the locale
  if (!pathnameLocale) {
    // Handle root path specially
    const newPath = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
    request.nextUrl.pathname = newPath;
    console.debug('====>', pathname, 'redirected to', request.nextUrl.pathname);
    return NextResponse.redirect(request.nextUrl);
  }
  
  // If the locale in the pathname is not valid, redirect to the default locale
  if (pathnameLocale && !LOCALES.includes(pathnameLocale as any)) {
    const newPath = pathname.replace(`/${pathnameLocale}`, `/${DEFAULT_LOCALE}`);
    request.nextUrl.pathname = newPath;
    console.debug('Invalid locale redirect:', pathname, 'to', request.nextUrl.pathname);
    return NextResponse.redirect(request.nextUrl);
  }
}

async function redirectSignIn(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale = getLocaleFromPathname(pathname);

  if (
    [`/${locale}/signin`, `/${locale}/otp`].some(
      (p) => pathname.indexOf(p) !== -1
    )
  ) {
    return;
  }

  let session = null;
  try {
    const response = await fetch(
      `${GATEWAY_URL}/api/v2/authenticator/tenant/session`,
      {
        headers: {
          cookie: `sessionToken=${
            request.cookies.get('sessionToken')?.value || ''
          }`
        }
      }
    );
    if (response.status === 200) {
      session = await response.json();
    }
  } catch (error) {
    console.error(error);
  }

  if (!session) {
    request.nextUrl.pathname = '/signin';
    return NextResponse.redirect(request.nextUrl);
  }
}

function redirectDashboard(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale = getLocaleFromPathname(pathname);

  if (pathname === '/' || pathname === `/${locale}`) {
    request.nextUrl.pathname = `/${locale}/dashboard`;
    console.debug('====>', pathname, 'redirected to', request.nextUrl.pathname);
    return NextResponse.redirect(request.nextUrl);
  }
}

function injectXPathHeader(request: NextRequest) {
  // The x-path header is used to determine the current locale from the server side components
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-path', pathname);
  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });
}
