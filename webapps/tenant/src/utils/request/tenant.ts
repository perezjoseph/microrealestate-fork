import * as Mocks from '@/mocks/api';
import getApiFetcher from '../fetch/server';
import getServerEnv from '../env/server';
import { Lease } from '@/types';
import { TenantAPI } from '@microrealestate/types';
import { toUILease } from '..';

export async function fetchOneTenant(tenantId: string): Promise<Lease | null> {
  let data;
  if (getServerEnv('DEMO_MODE') === 'true') {
    data = Mocks.getOneTenant;
  } else {
    try {
      const response =
        await getApiFetcher().get<TenantAPI.GetOneTenant.Response>(
          `/tenantapi/tenant/${tenantId}`
        );
      data = response.data;
    } catch (error) {
      console.error('Error fetching tenant:', error);
      return null;
    }
  }

  if (data.error) {
    console.error(data.error);
    return null;
  }

  if (!data.results?.length) {
    return null;
  }

  return toUILease(data.results[0]);
}

export async function fetchAllTenants(): Promise<Lease[]> {
  let data;
  if (getServerEnv('DEMO_MODE') === 'true') {
    data = Mocks.getAllTenants;
  } else {
    try {
      const response =
        await getApiFetcher().get<TenantAPI.GetAllTenants.Response>(
          `/tenantapi/tenants`
        );
      data = response.data;

      // Check if the response indicates no contract
      if (data.status === 'no_contract') {
        console.log('No contract associated with this account');
        return [];
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
      return [];
    }
  }

  if (data.error) {
    console.error(data.error);
    return [];
  }

  if (!data.results) {
    return [];
  }

  try {
    const leases: Lease[] = data.results.map(toUILease) || [];
    return leases;
  } catch (error) {
    console.error('Error processing tenant data:', error);
    return [];
  }
}
