import { useCallback, useContext, useState } from 'react';
import { BsWhatsapp } from 'react-icons/bs';
import { GrDocumentPdf } from 'react-icons/gr';
import { LuChevronDown, LuRotateCw } from 'react-icons/lu';
import moment from 'moment';
import { toast } from 'sonner';
import useTranslation from 'next-translate/useTranslation';

import ConfirmDialog from '../ConfirmDialog';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

import { StoreContext } from '../../store';

// WhatsApp template configurations matching email functionality
const WHATSAPP_TEMPLATES = {
  invoice: {
    name: 'invoice',
    description: 'Monthly rent invoice',
    color: 'text-green-600',
    icon: GrDocumentPdf
  },
  rentcall: {
    name: 'First payment notice',
    description: 'Initial payment reminder',
    color: 'text-blue-600',
    icon: GrDocumentPdf
  },
  rentcall_reminder: {
    name: 'Second payment notice',
    description: 'Follow-up payment reminder',
    color: 'text-orange-600',
    icon: GrDocumentPdf
  },
  rentcall_last_reminder: {
    name: 'Last payment notice',
    description: 'Final payment notice',
    color: 'text-red-600',
    icon: GrDocumentPdf
  }
};

function WhatsAppActions({ values, onDone }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [sending, setSending] = useState(false);
  const [showConfirmDlg, setShowConfirmDlg] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

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

  // Handle template selection
  const handleTemplateAction = useCallback((templateName) => {
    setSelectedTemplate(templateName);
    setShowConfirmDlg(true);
  }, []);

  // Calculate days overdue for payment notices
  const calculateDaysOverdue = (rent) => {
    const termDate = moment(rent.term.toString(), 'YYYYMMDDHH');
    const today = moment();
    return Math.max(0, today.diff(termDate, 'days'));
  };

  // Generate due date (typically end of month for the term)
  const generateDueDate = (rent) => {
    const termDate = moment(rent.term.toString(), 'YYYYMMDDHH');
    return termDate.endOf('month').format('DD/MM/YYYY');
  };

  // Send WhatsApp messages using selected template
  const handleConfirm = useCallback(async () => {
    if (!selectedTemplate || !hasWhatsAppTenants || sending) return;

    setSending(true);
    try {
      let totalSuccess = 0;
      let totalFailed = 0;

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

        // Calculate balance (net amount owed) for WhatsApp messages
        const grandTotal =
          rent.grandTotal || rent.totalAmount || rent.total || 0;
        const payment = rent.payment || 0;
        const netBalance = grandTotal - payment;

        // Only send payment reminders for positive balances (money owed)
        const finalAmount = Math.max(0, netBalance);

        console.log('WhatsApp Actions Balance Debug:', {
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

        // Prepare template data
        const templateData = {
          templateName: selectedTemplate,
          phoneNumbers: whatsappNumbers,
          tenantName: tenant.name,
          invoicePeriod: moment(rent.term.toString(), 'YYYYMMDDHH').format(
            'MMMM YYYY'
          ),
          totalAmount: finalAmount,
          currency: store.organization.selected.currency || 'RD$',
          organizationName:
            store.organization.selected.name || 'MicroRealEstate',
          dueDate: generateDueDate(rent),
          daysOverdue: calculateDaysOverdue(rent)
        };

        // Add invoice URL for document templates
        if (
          [
            'invoice',
            'rentcall',
            'rentcall_reminder',
            'rentcall_last_reminder'
          ].includes(selectedTemplate)
        ) {
          templateData.invoiceUrl = `${window.location.origin}/api/v2/documents/${selectedTemplate}/${tenant._id}/${rent.term}`;
        }

        try {
          // Call WhatsApp service with correct payload structure
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
              invoiceUrl: `${window.location.origin}/api/v2/documents/${selectedTemplate}/${tenant._id}/${rent.term}`,
              locale: store.organization.selected.locale || 'es-CO',
              templateName: selectedTemplate,
              dueDate: generateDueDate(rent),
              daysOverdue: calculateDaysOverdue(rent)
            })
          });

          const result = await response.json();

          if (result.success) {
            // Handle both API and URL fallback results
            const apiResults = result.results.filter(
              (r) => r.method === 'api' && r.success
            );
            const urlResults = result.results.filter(
              (r) => r.method === 'url' && r.success
            );

            // Open WhatsApp URLs for fallback results with delays
            urlResults.forEach((urlResult, index) => {
              setTimeout(() => {
                window.open(urlResult.whatsappURL, '_blank');
              }, index * 1000);
            });

            totalSuccess += apiResults.length + urlResults.length;
            totalFailed += result.results.filter((r) => !r.success).length;

            console.log(`${selectedTemplate} processed for ${tenant.name}:`, {
              apiSent: apiResults.length,
              urlGenerated: urlResults.length,
              failed: result.results.filter((r) => !r.success).length
            });
          } else {
            console.error(
              `WhatsApp service failed for ${tenant.name}:`,
              result.error
            );
            totalFailed += whatsappNumbers.length;
          }
        } catch (apiError) {
          console.error(`WhatsApp API error for ${tenant.name}:`, apiError);
          totalFailed += whatsappNumbers.length;
        }
      }

      // Show results
      if (totalSuccess > 0) {
        toast.success(
          t('WhatsApp messages sent to {{count}} contact(s)', {
            count: totalSuccess
          })
        );
      }

      if (totalFailed > 0) {
        toast.error(
          t('Failed to send {{count}} WhatsApp message(s)', {
            count: totalFailed
          })
        );
      }

      // Refresh data if needed
      if (onDone) {
        onDone();
      }
    } catch (error) {
      console.error('WhatsApp send error:', error);
      toast.error(
        t('Error sending WhatsApp messages: {{error}}', {
          error: error.message
        })
      );
    } finally {
      setSending(false);
    }
  }, [
    selectedTemplate,
    hasWhatsAppTenants,
    sending,
    tenantsWithWhatsApp,
    store,
    t,
    onDone
  ]);

  if (!hasWhatsAppTenants) {
    return (
      <Button
        variant="outline"
        disabled={true}
        className="border-gray-300 text-gray-400"
      >
        <BsWhatsapp className="mr-2" />
        {t('No WhatsApp contacts')}
      </Button>
    );
  }

  return (
    <>
      {sending ? (
        <div className="flex items-center gap-1 text-muted-foreground">
          <LuRotateCw className="animate-spin size-4" />
          {t('Opening WhatsApp...')}
        </div>
      ) : (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              disabled={disabled}
              className="border-green-500 text-green-600 hover:bg-green-50"
            >
              <BsWhatsapp className="mr-2" />
              {t('Send via WhatsApp')} ({tenantsWithWhatsApp.length})
              <LuChevronDown className="ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="p-0.5 m-0 w-auto">
            <div className="flex flex-col">
              {Object.entries(WHATSAPP_TEMPLATES).map(
                ([templateKey, template]) => {
                  const IconComponent = template.icon;
                  return (
                    <Button
                      key={templateKey}
                      variant="ghost"
                      onClick={() => handleTemplateAction(templateKey)}
                      disabled={disabled}
                      className={`justify-start w-full rounded-none ${template.color}`}
                    >
                      <IconComponent className="mr-2" />
                      {t(template.name)}
                    </Button>
                  );
                }
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* WhatsApp Confirmation Dialog */}
      {selectedTemplate && (
        <ConfirmDialog
          title={`${t('Send via WhatsApp')} - ${t(WHATSAPP_TEMPLATES[selectedTemplate]?.name || selectedTemplate)}`}
          open={showConfirmDlg}
          setOpen={setShowConfirmDlg}
          onConfirm={handleConfirm}
        >
          <div className="space-y-4">
            <div>
              <div className="mb-2 font-medium">{t('Document Type')}</div>
              <div className="text-sm text-muted-foreground">
                {t(
                  WHATSAPP_TEMPLATES[selectedTemplate]?.description ||
                    'WhatsApp message'
                )}
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
                            (c.phone1 && c.whatsapp1) ||
                            (c.phone2 && c.whatsapp2)
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
      )}
    </>
  );
}

export default WhatsAppActions;
