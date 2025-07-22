// TODO: remove momentjs and use date-fns
// TODO: import only the locale needed
import 'moment/locale/fr';
import 'moment/locale/pt';
import 'moment/locale/de';
import 'moment/locale/es';
import { type ClassValue, clsx } from 'clsx';
import { LeaseTimeRange, Locale, TenantAPI } from '@microrealestate/types';
import { Lease } from '@/types';
import moment from 'moment';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getMoment(locale: Locale) {
  const lang = locale.split('-')[0];
  return (date: Date | string, pattern?: string) => {
    if (pattern) {
      return moment(date, pattern).locale(lang);
    }
    return moment(date).locale(lang);
  };
}

export function getFormatTimeRange(locale: Locale, timeRange: LeaseTimeRange) {
  const m = getMoment(locale);
  return (term: number) => {
    const momentTerm = m(String(term), 'YYYYMMDDHH');
    switch (timeRange) {
      case 'days':
        return momentTerm.format('LL');
      case 'weeks':
        return momentTerm.format('Wo');
      case 'months':
        return momentTerm.format('MMMM YYYY');
      case 'years':
        return momentTerm.format('YYYY');
      default:
        return String(term);
    }
  };
}

export function toUILease(tenant: TenantAPI.TenantDataType): Lease {
  try {
    return {
      landlord: tenant.landlord || {
        name: '',
        addresses: [],
        contacts: [],
        currency: 'USD',
        locale: 'en'
      },
      tenant: tenant.tenant || {
        id: '',
        name: '',
        contacts: [],
        addresses: []
      },
      name: tenant.lease?.name || 'No contract',
      beginDate: tenant.lease?.beginDate
        ? new Date(tenant.lease.beginDate)
        : undefined,
      endDate: tenant.lease?.endDate ? new Date(tenant.lease.endDate) : undefined,
      terminationDate: tenant.lease?.terminationDate
        ? new Date(tenant.lease.terminationDate)
        : undefined,
      timeRange: tenant.lease?.timeRange || 'months',
      status: tenant.lease?.status || 'active',
      rent: tenant.lease?.rent || {
        totalPreTaxAmount: 0,
        totalChargesAmount: 0,
        totalVatAmount: 0,
        totalAmount: 0
      },
      remainingIterations: tenant.lease?.remainingIterations || 0,
      remainingIterationsToPay: tenant.lease?.remainingIterationsToPay || 0,
      properties: tenant.lease?.properties?.map((property) => ({
        id: property.id || '',
        name: property.name || '',
        description: property.description || '',
        type: property.type || ''
      })) || [],
      balance: tenant.lease?.balance || 0,
      deposit: tenant.lease?.deposit || 0,
      invoices: tenant.lease?.invoices?.map((invoice) => ({
        id: String(invoice.term || ''),
        term: invoice.term || 0,
        grandTotal: invoice.grandTotal || 0,
        payment: invoice.payment || 0,
        status: invoice.status || 'unpaid',
        methods: invoice.methods || []
      })) || [],
      documents: []
    };
  } catch (error) {
    console.error('Error in toUILease:', error);
    // Return a minimal valid lease object
    return {
      landlord: {
        name: '',
        addresses: [],
        contacts: [],
        currency: 'USD',
        locale: 'en'
      },
      tenant: {
        id: '',
        name: '',
        contacts: [],
        addresses: []
      },
      name: 'No contract',
      beginDate: new Date(),
      endDate: new Date(),
      timeRange: 'months',
      status: 'active',
      rent: {
        totalPreTaxAmount: 0,
        totalChargesAmount: 0,
        totalVatAmount: 0,
        totalAmount: 0
      },
      remainingIterations: 0,
      remainingIterationsToPay: 0,
      properties: [],
      balance: 0,
      deposit: 0,
      invoices: [],
      documents: []
    };
  }
}
