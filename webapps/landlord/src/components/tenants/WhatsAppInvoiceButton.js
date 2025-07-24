import { useState } from 'react';
import { Button, CircularProgress, Tooltip } from '@material-ui/core';
import { WhatsApp as WhatsAppIcon } from '@material-ui/icons';
import { useContext } from 'react';
import { StoreContext } from '../../store';
import useTranslation from 'next-translate/useTranslation';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

export default function WhatsAppInvoiceButton({ tenant, rent, disabled = false }) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const store = useContext(StoreContext);
  const [sending, setSending] = useState(false);

  // Get current locale
  const currentLocale = router.locale || 'en';

  // Get WhatsApp-enabled phone numbers
  const getWhatsAppNumbers = () => {
    const numbers = [];
    tenant.contacts?.forEach(contact => {
      if (contact.phone1 && contact.whatsapp1) {
        numbers.push({
          phone: contact.phone1,
          contact: contact.contact
        });
      }
      if (contact.phone2 && contact.whatsapp2) {
        numbers.push({
          phone: contact.phone2,
          contact: contact.contact
        });
      }
    });
    return numbers;
  };

  const whatsappNumbers = getWhatsAppNumbers();
  const hasWhatsApp = whatsappNumbers.length > 0;

  const sendWhatsAppInvoice = async () => {
    if (!hasWhatsApp || sending) return;

    setSending(true);
    try {
      // Generate invoice URL
      const invoiceUrl = `${window.location.origin}/api/v2/documents/invoice/${tenant._id}/${rent.term}`;
      
      // Prepare phone numbers array
      const phoneNumbers = whatsappNumbers.map(item => item.phone);
      
      // Call WhatsApp service API
      const response = await fetch('/api/v2/whatsapp/send-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${store.user.accessToken}`,
          'organizationId': store.organization.selected._id
        },
        body: JSON.stringify({
          phoneNumbers,
          tenantName: tenant.name,
          invoicePeriod: new Date(rent.term.toString().substring(0, 4), rent.term.toString().substring(4, 6) - 1).toLocaleDateString(currentLocale, { month: 'long', year: 'numeric' }),
          totalAmount: rent.totalWithVAT || rent.total,
          currency: store.organization.selected.currency || 'RD$',
          invoiceUrl,
          organizationName: store.organization.selected.name || 'MicroRealEstate',
          locale: currentLocale,
          templateName: 'invoice'  // Add template name for invoice
        })
      });

      const result = await response.json();

      if (result.success) {
        const { summary } = result;
        
        if (summary?.apiSuccess > 0) {
          toast.success(t('Invoice sent via WhatsApp to {{count}} number(s)', { 
            count: summary.apiSuccess 
          }));
        }
        
        if (summary?.urlFallback > 0) {
          // Open WhatsApp URLs for fallback cases
          result.results
            .filter(r => r.method === 'url')
            .forEach((r, index) => {
              setTimeout(() => {
                window.open(r.whatsappURL, '_blank');
              }, index * 1000);
            });
          
          toast.info(t('Opening WhatsApp for {{count}} additional number(s)', { 
            count: summary.urlFallback 
          }));
        }
        
        console.log('WhatsApp invoice sent:', result);
      } else {
        throw new Error(result.error || 'Failed to send WhatsApp invoice');
      }

    } catch (error) {
      console.error('WhatsApp send error:', error);
      toast.error(t('whatsapp_send_error', { 
        error: error.message 
      }));
    } finally {
      setSending(false);
    }
  };

  if (!hasWhatsApp) {
    return (
      <Tooltip title={t('whatsapp_no_numbers_configured')}>
        <span>
          <Button
            variant="outlined"
            size="small"
            disabled={true}
            startIcon={<WhatsAppIcon />}
            style={{ color: '#25D366', borderColor: '#25D366', opacity: 0.5 }}
          >
            WhatsApp
          </Button>
        </span>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={t('Send invoice via WhatsApp to {{count}} number(s)', { count: whatsappNumbers.length })}>
      <Button
        variant="outlined"
        size="small"
        onClick={sendWhatsAppInvoice}
        disabled={disabled || sending}
        startIcon={sending ? <CircularProgress size={16} /> : <WhatsAppIcon />}
        style={{ 
          color: '#25D366', 
          borderColor: '#25D366',
          '&:hover': {
            backgroundColor: 'rgba(37, 211, 102, 0.04)'
          }
        }}
      >
        {sending ? t('whatsapp_sending') : 'WhatsApp'}
      </Button>
    </Tooltip>
  );
}
