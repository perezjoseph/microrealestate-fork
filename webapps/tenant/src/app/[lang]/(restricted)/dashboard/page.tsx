import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContractCard } from '@/components/contract-card';
import getServerSession from '@/utils/session/server/getsession';
import getTranslation from '@/utils/i18n/server/getTranslation';
import Request from '@/utils/request';

export default async function Home() {
  const { t } = await getTranslation();
  const session = await getServerSession();
  if (!session || !session.email) {
    return null;
  }

  try {
    const leases = await Request.fetchAllTenants();

    if (!leases || leases.length === 0) {
      return (
        <main className="flex flex-col gap-10">
          <Card>
            <CardHeader>
              <CardTitle>{t('No contract found')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                {t(
                  'There is no contract associated with your account. Please contact your landlord for more information.'
                )}
              </p>
            </CardContent>
          </Card>
        </main>
      );
    }

    return (
      <main className="flex flex-col gap-10">
        {leases.map((lease) => (
          <ContractCard key={lease.tenant.id} lease={lease} />
        ))}
      </main>
    );
  } catch (error) {
    console.error('Error fetching tenant data:', error);
    return (
      <main className="flex flex-col gap-10">
        <Card>
          <CardHeader>
            <CardTitle>{t('No contract found')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              {t(
                'There is no contract associated with your account. Please contact your landlord for more information.'
              )}
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }
}
