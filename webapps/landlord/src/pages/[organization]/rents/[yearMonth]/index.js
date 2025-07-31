import { fetchRents, QueryKeys } from '../../../../utils/restcalls';
import { LuAlertTriangle, LuChevronDown, LuSend } from 'react-icons/lu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '../../../../components/ui/popover';
import { useCallback, useContext, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BsWhatsapp } from 'react-icons/bs';
import { GrDocumentPdf } from 'react-icons/gr';
import { LuRotateCw } from 'react-icons/lu';
import moment from 'moment';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { toast } from 'sonner';

import { withAuthentication } from '../../../../components/Authentication';
import ConfirmDialog from '../../../../components/ConfirmDialog';
import Page from '../../../../components/Page';
import { RentOverview } from '../../../../components/rents/RentOverview';
import RentTable from '../../../../components/rents/RentTable';
import { List } from '../../../../components/ResourceList';
import { Alert } from '../../../../components/ui/alert';
import { Button } from '../../../../components/ui/button';

import { StoreContext } from '../../../../store';

function _filterData(data, filters) {
  let filteredItems =
    filters.statuses?.length > 0
      ? data.rents.filter(({ status }) => filters.statuses.includes(status))
      : data.rents;

  if (filters.searchText) {
    const regExp = /\s|\.|-/gi;
    const cleanedSearchText = filters.searchText
      .toLowerCase()
      .replace(regExp, '');

    filteredItems = filteredItems.filter(
      ({ occupant: { isCompany, name, manager, contacts }, payments }) => {
        // Search match name
        let found =
          name.replace(regExp, '').toLowerCase().indexOf(cleanedSearchText) !=
          -1;

        // Search match manager
        if (!found && isCompany) {
          found =
            manager
              .replace(regExp, '')
              .toLowerCase()
              .indexOf(cleanedSearchText) != -1;
        }

        // Search match contact
        if (!found) {
          found = !!contacts
            ?.map(({ contact = '', email = '', phone = '' }) => ({
              contact: contact.replace(regExp, '').toLowerCase(),
              email: email.toLowerCase(),
              phone: phone.replace(regExp, '')
            }))
            .filter(
              ({ contact, email, phone }) =>
                contact.indexOf(cleanedSearchText) != -1 ||
                email.indexOf(cleanedSearchText) != -1 ||
                phone.indexOf(cleanedSearchText) != -1
            ).length;
        }

        // Search match in payment references
        if (!found) {
          found = !!payments?.find(
            ({ reference = '' }) =>
              reference
                .replace(regExp, '')
                .toLowerCase()
                .indexOf(cleanedSearchText) != -1
          );
        }

        return found;
      }
    );
  }
  return filteredItems;
}

function Actions({ values, onDone }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [sending, setSending] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [showConfirmDlg, setShowConfirmDlg] = useState(false);
  const [showWhatsAppConfirmDlg, setShowWhatsAppConfirmDlg] = useState(false);
  const [selectedWhatsAppDocument, setSelectedWhatsAppDocument] =
    useState(null);
  const [selectedDocumentName, setSelectedDocumentName] = useState(null);
  const disabled = !values?.length;

  // Get tenants with WhatsApp numbers
  const getTenantsWithWhatsApp = useCallback(() => {
    return values.filter((rent) => {
      const tenant = rent.occupant;
      return tenant.contacts?.some(
        (contact) =>
          (contact.phone1 && contact.whatsapp1) ||
          (contact.phone2 && contact.whatsapp2)
      );
    });
  }, [values]);

  const tenantsWithWhatsApp = getTenantsWithWhatsApp();
  const hasWhatsAppTenants = tenantsWithWhatsApp.length > 0;

  const handleAction = useCallback(
    (docName) => async () => {
      setSelectedDocumentName(docName);
      setShowConfirmDlg(true);
    },
    [setSelectedDocumentName, setShowConfirmDlg]
  );

  const handleWhatsAppAction = useCallback((documentType) => {
    setSelectedWhatsAppDocument(documentType);
    setShowWhatsAppConfirmDlg(true);
  }, []);

  const handleConfirm = useCallback(async () => {
    try {
      setSending(true);

      const sendStatus = await store.rent.sendEmail({
        document: selectedDocumentName,
        tenantIds: values.map((r) => r._id),
        terms: values.map((r) => r.term)
      });

      if (sendStatus !== 200) {
        return toast.error(t('Email delivery service cannot send emails'));
      }

      const response = await store.rent.fetch();
      if (response.status !== 200) {
        return toast.error(t('Cannot fetch rents from server'));
      }

      onDone?.();
    } finally {
      setSending(false);
    }
  }, [onDone, selectedDocumentName, store.rent, t, values]);

  const handleWhatsAppConfirm = useCallback(async () => {
    if (!hasWhatsAppTenants || sendingWhatsApp || !selectedWhatsAppDocument)
      return;

    setSendingWhatsApp(true);
    try {
      let totalApiSuccess = 0;
      let totalUrlFallback = 0;

      for (const rent of tenantsWithWhatsApp) {
        const tenant = rent.occupant;

        // Get WhatsApp numbers for this tenant
        const whatsappNumbers = [];
        tenant.contacts?.forEach((contact) => {
          if (contact.phone1 && contact.whatsapp1) {
            whatsappNumbers.push(contact.phone1);
          }
          if (contact.phone2 && contact.whatsapp2) {
            whatsappNumbers.push(contact.phone2);
          }
        });

        if (whatsappNumbers.length === 0) continue;

        // Calculate days overdue for payment notices
        const termDate = moment(rent.term.toString(), 'YYYYMMDDHH');
        const today = moment();
        const daysOverdue = Math.max(0, today.diff(termDate, 'days'));
        const dueDate = termDate.endOf('month').format('DD/MM/YYYY');

        // Calculate balance (net amount owed) for WhatsApp messages
        const grandTotal =
          rent.grandTotal || rent.totalAmount || rent.total || 0;
        const payment = rent.payment || 0;
        const netBalance = grandTotal - payment;

        // Only send payment reminders for positive balances (money owed)
        const finalAmount = Math.max(0, netBalance);

        console.log('WhatsApp Balance Debug:', {
          tenantName: tenant.name,
          grandTotal,
          payment,
          netBalance,
          finalAmount,
          status:
            netBalance > 0
              ? 'PAYMENT DUE'
              : netBalance === 0
                ? 'PAID'
                : 'OVERPAID',
          rentObject: rent
        });

        // Skip WhatsApp message if tenant doesn't owe money
        if (finalAmount <= 0) {
          console.log(
            `⏭️ Skipping WhatsApp for ${tenant.name} - Account current or overpaid`
          );
          continue;
        }

        // Prepare template data based on selected document type
        const templateData = {
          templateName: selectedWhatsAppDocument,
          phoneNumbers: whatsappNumbers,
          tenantName: tenant.name,
          invoicePeriod: moment(rent.term.toString(), 'YYYYMMDDHH').format(
            'MMMM YYYY'
          ),
          totalAmount: finalAmount,
          currency: store.organization.selected.currency || '$',
          organizationName:
            store.organization.selected.name || 'MicroRealEstate',
          dueDate: dueDate,
          daysOverdue: daysOverdue
        };

        // Add document URL for all document types
        templateData.invoiceUrl = `${window.location.origin}/api/v2/documents/${selectedWhatsAppDocument}/${tenant._id}/${rent.term}`;

        try {
          // Call WhatsApp service API (handles both Business API and URL fallback automatically)
          const response = await fetch('/api/v2/whatsapp/send-invoice', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${store.user.token}`,
              organizationId: store.organization.selected._id
            },
            body: JSON.stringify({
              phoneNumbers: whatsappNumbers,
              tenantName: tenant.name,
              invoicePeriod: moment(rent.term.toString(), 'YYYYMMDDHH').format(
                'MMMM YYYY'
              ),
              totalAmount: finalAmount,
              currency: store.organization.selected.currency || 'RD$',
              organizationName:
                store.organization.selected.name || 'MicroRealEstate',
              invoiceUrl: `${window.location.origin}/api/v2/documents/${selectedWhatsAppDocument}/${tenant._id}/${rent.term}`,
              locale: store.organization.selected.locale || 'es-CO',
              templateName: selectedWhatsAppDocument,
              dueDate: dueDate,
              daysOverdue: daysOverdue
            })
          });

          const result = await response.json();

          if (result.success && result.results) {
            // Handle both API and URL fallback results
            const apiResults = result.results.filter(
              (r) => r.method === 'api' && r.success
            );
            const urlResults = result.results.filter(
              (r) => r.method === 'url' && r.success
            );

            // Open WhatsApp URLs for fallback results with delays
            urlResults.forEach((urlResult, index) => {
              setTimeout(
                () => {
                  window.open(urlResult.whatsappURL, '_blank');
                },
                (totalApiSuccess + totalUrlFallback + index) * 1000
              );
            });

            totalApiSuccess += apiResults.length;
            totalUrlFallback += urlResults.length;

            console.log(
              `${selectedWhatsAppDocument} processed for ${tenant.name}:`,
              {
                apiSent: apiResults.length,
                urlGenerated: urlResults.length,
                failed: result.results.filter((r) => !r.success).length
              }
            );
          } else {
            console.error(
              `WhatsApp service failed for ${tenant.name}:`,
              result.error
            );
            totalUrlFallback += whatsappNumbers.length;
          }
        } catch (apiError) {
          console.error(`WhatsApp API error for ${tenant.name}:`, apiError);
          totalUrlFallback += whatsappNumbers.length;
        }
      }

      // Show success messages
      if (totalApiSuccess > 0) {
        toast.success(
          t('WhatsApp messages sent to {{count}} contact(s)', {
            count: totalApiSuccess
          })
        );
      }

      if (totalUrlFallback > 0) {
        toast.info(
          t('Opening WhatsApp for {{count}} contact(s)', {
            count: totalUrlFallback
          })
        );
      }
    } catch (error) {
      console.error('WhatsApp send error:', error);
      toast.error(
        t('Error sending WhatsApp messages: {{error}}', {
          error: error.message
        })
      );
    } finally {
      setSendingWhatsApp(false);
    }
  }, [
    hasWhatsAppTenants,
    sendingWhatsApp,
    selectedWhatsAppDocument,
    tenantsWithWhatsApp,
    store.organization.selected,
    store.user.token,
    t
  ]);

  return (
    <>
      {sending || sendingWhatsApp ? (
        <div className="flex items-center gap-1 text-muted-foreground">
          <LuRotateCw className="animate-spin size-4" />
          {sending ? t('Sending...') : t('Opening WhatsApp...')}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Email Actions */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="secondary" disabled={disabled}>
                <LuSend className="mr-2" />
                {t('Send by email')}
                <LuChevronDown className="ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="p-0.5 m-0 w-auto">
              <div className="flex flex-col">
                <Button
                  variant="ghost"
                  onClick={handleAction('invoice')}
                  disabled={disabled}
                  className="justify-start w-full rounded-none"
                >
                  <GrDocumentPdf className="mr-2" /> {t('Invoice')}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleAction('rentcall')}
                  disabled={disabled}
                  className="justify-start w-full rounded-none"
                >
                  <GrDocumentPdf className="mr-2" /> {t('First payment notice')}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleAction('rentcall_reminder')}
                  className="justify-start w-full rounded-none text-warning"
                >
                  <GrDocumentPdf className="mr-2 " />{' '}
                  {t('Second payment notice')}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleAction('rentcall_last_reminder')}
                  className="justify-start w-full rounded-none text-destructive"
                >
                  <GrDocumentPdf className="mr-2" /> {t('Last payment notice')}
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* WhatsApp Actions */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                disabled={disabled || !hasWhatsAppTenants}
                className="border-green-500 text-green-600 hover:bg-green-50"
              >
                <BsWhatsapp className="mr-2" />
                {t('Send via WhatsApp')} ({tenantsWithWhatsApp.length})
                <LuChevronDown className="ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="p-0.5 m-0 w-auto">
              <div className="flex flex-col">
                <Button
                  variant="ghost"
                  onClick={() => handleWhatsAppAction('invoice')}
                  disabled={disabled || !hasWhatsAppTenants}
                  className="justify-start w-full rounded-none text-green-600"
                >
                  <GrDocumentPdf className="mr-2" /> {t('Invoice')}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleWhatsAppAction('rentcall')}
                  disabled={disabled || !hasWhatsAppTenants}
                  className="justify-start w-full rounded-none text-green-600"
                >
                  <GrDocumentPdf className="mr-2" /> {t('First payment notice')}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleWhatsAppAction('rentcall_reminder')}
                  disabled={disabled || !hasWhatsAppTenants}
                  className="justify-start w-full rounded-none text-orange-600"
                >
                  <GrDocumentPdf className="mr-2" />{' '}
                  {t('Second payment notice')}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleWhatsAppAction('rentcall_last_reminder')}
                  disabled={disabled || !hasWhatsAppTenants}
                  className="justify-start w-full rounded-none text-red-600"
                >
                  <GrDocumentPdf className="mr-2" /> {t('Last payment notice')}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Email Confirmation Dialog */}
      {selectedDocumentName ? (
        <ConfirmDialog
          title={t('Are you sure to send "{{docName}}"?', {
            docName: t(selectedDocumentName)
          })}
          open={showConfirmDlg}
          setOpen={setShowConfirmDlg}
          data={selectedDocumentName}
          onConfirm={handleConfirm}
        >
          <div className="mb-2">{t('Tenants selected')}</div>
          <div className="flex flex-col gap-1 pl-4 text-sm max-h-48 overflow-auto">
            {values.map((tenant) => (
              <div key={tenant._id}>{tenant.occupant.name}</div>
            ))}
          </div>
        </ConfirmDialog>
      ) : null}

      {/* WhatsApp Confirmation Dialog */}
      <ConfirmDialog
        title={t('Send "{{templateName}}" via WhatsApp?', {
          templateName: t(selectedWhatsAppDocument || 'document')
        })}
        open={showWhatsAppConfirmDlg}
        setOpen={setShowWhatsAppConfirmDlg}
        onConfirm={handleWhatsAppConfirm}
      >
        <div className="space-y-4">
          <div>
            <div className="mb-2 font-medium">{t('Document Type')}</div>
            <div className="text-sm text-muted-foreground">
              {t(selectedWhatsAppDocument || 'document')}
            </div>
          </div>

          <div>
            <div className="mb-2 font-medium">{t('Recipients')}</div>
            <div className="flex flex-col gap-1 pl-4 text-sm max-h-48 overflow-auto">
              {tenantsWithWhatsApp.map((rent) => (
                <div key={rent._id} className="flex justify-between">
                  <span>{rent.occupant.name}</span>
                  <span className="text-muted-foreground">
                    {
                      rent.occupant.contacts?.filter(
                        (c) =>
                          (c.phone1 && c.whatsapp1) || (c.phone2 && c.whatsapp2)
                      ).length
                    }{' '}
                    WhatsApp
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            {t('WhatsApp will open in new tabs for each contact')}
          </div>
        </div>
      </ConfirmDialog>
    </>
  );
}

function Rents() {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const store = useContext(StoreContext);
  const router = useRouter();
  const { yearMonth } = router.query;
  const { data, isError, isLoading } = useQuery({
    queryKey: [QueryKeys.RENTS, yearMonth],
    queryFn: () => fetchRents(store, yearMonth)
  });
  const [rentSelected, setRentSelected] = useState([]);

  const handleActionDone = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [QueryKeys.RENTS, yearMonth] });
    setRentSelected([]);
  }, [queryClient, yearMonth]);

  const period = useMemo(
    () =>
      router.query.yearMonth ? moment(router.query.yearMonth, 'YYYY.MM') : null,
    [router.query.yearMonth]
  );

  if (isError) {
    toast.error(t('Error fetching rents'));
  }

  return (
    <Page loading={isLoading} dataCy="rentsPage">
      <div className="my-4">
        <RentOverview data={{ period, ...data?.overview }} />
      </div>

      {!store.organization.canSendEmails ? (
        <Alert variant="warning" className="mb-4">
          <div className="flex items-center gap-4">
            <LuAlertTriangle className="size-6" />
            <div className="text-sm">
              {t(
                'Unable to send documents by email without configuring the mail service in Settings page'
              )}
            </div>
          </div>
        </Alert>
      ) : null}
      <List
        data={data}
        filters={[
          { id: 'notpaid', label: t('Not paid') },
          { id: 'partiallypaid', label: t('Partially paid') },
          { id: 'paid', label: t('Paid') }
        ]}
        filterFn={_filterData}
        renderActions={() =>
          store.organization.canSendEmails ? (
            <Actions values={rentSelected} onDone={handleActionDone} />
          ) : null
        }
        renderList={({ data }) => (
          <RentTable
            rents={data}
            selected={rentSelected}
            setSelected={setRentSelected}
          />
        )}
      />
    </Page>
  );
}

export default withAuthentication(Rents);
