# WhatsApp Template Configuration Guide

This document explains how to configure WhatsApp Business API templates for different types of payment notices in MicroRealEstate.

## Environment Variables

Add these variables to your `.env` file to configure different WhatsApp templates:

```bash
# WhatsApp Business API Configuration
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id

# Template Language Configuration
WHATSAPP_TEMPLATE_LANGUAGE=es

# Configurable Template Names (customize based on your Meta-approved templates)
WHATSAPP_INVOICE_TEMPLATE=factura2
WHATSAPP_PAYMENT_NOTICE_TEMPLATE=payment_notice
WHATSAPP_PAYMENT_REMINDER_TEMPLATE=payment_reminder
WHATSAPP_FINAL_NOTICE_TEMPLATE=final_notice

# Webhook Configuration
WHATSAPP_WEBHOOK_VERIFY_TOKEN=microrealestate_webhook_token
```

## Template Types and Mapping

The system automatically maps message types to the appropriate template:

| Message Type | Environment Variable | Default Template Name | Purpose |
|--------------|---------------------|----------------------|---------|
| `invoice` | `WHATSAPP_INVOICE_TEMPLATE` | `factura2` | Invoice delivery |
| `rentcall` | `WHATSAPP_PAYMENT_NOTICE_TEMPLATE` | `payment_notice` | Initial payment notice |
| `rentcall_reminder` | `WHATSAPP_PAYMENT_REMINDER_TEMPLATE` | `payment_reminder` | Second payment reminder |
| `rentcall_last_reminder` | `WHATSAPP_FINAL_NOTICE_TEMPLATE` | `final_notice` | Final notice before eviction |

## Meta Business Manager Templates

### 1. Payment Notice Template

**Template Name**: `payment_notice`  
**Category**: `UTILITY`  
**Language**: Spanish (es)

```
Estimado/a {{1}},

Su pago de alquiler del período {{2}} se encuentra pendiente.

💰 Monto adeudado: {{3}}
📅 Fecha de vencimiento: {{4}}

Para realizar su pago y consultar los detalles, acceda a: {{5}}

Es importante regularizar su situación para mantener su historial de pagos al día. Si ya realizó el pago, ignore este mensaje.

Gracias por su atención.

MicroRealEstate - Gestión de Propiedades
```

**Parameters:**
1. `{{1}}` - Tenant name
2. `{{2}}` - Payment period
3. `{{3}}` - Amount with currency
4. `{{4}}` - Due date
5. `{{5}}` - Payment/invoice URL

### 2. Payment Reminder Template

**Template Name**: `payment_reminder`  
**Category**: `UTILITY`  
**Language**: Spanish (es)

```
Estimado/a {{1}},

⚠️ SEGUNDO AVISO - Su pago de alquiler del período {{2}} continúa pendiente.

💰 Monto adeudado: {{3}}
📅 Fecha de vencimiento: {{4}}
⏰ Días de retraso: {{5}}

Para realizar su pago y consultar los detalles, acceda a: {{6}}

Es importante regularizar su situación para evitar inconvenientes adicionales.

Gracias por su atención.

MicroRealEstate - Gestión de Propiedades
```

**Parameters:**
1. `{{1}}` - Tenant name
2. `{{2}}` - Payment period
3. `{{3}}` - Amount with currency
4. `{{4}}` - Due date
5. `{{5}}` - Days overdue
6. `{{6}}` - Payment/invoice URL

### 3. Final Notice Template

**Template Name**: `final_notice`  
**Category**: `UTILITY`  
**Language**: Spanish (es)

```
Estimado/a {{1}},

🚨 ÚLTIMO AVISO - Su pago de alquiler del período {{2}} está en mora.

💰 Monto adeudado: {{3}}
📅 Fecha de vencimiento: {{4}}
⏰ Días de retraso: {{5}}

⚠️ IMPORTANTE: Si no recibimos su pago en las próximas 48 horas, procederemos según los términos del contrato.

Para realizar su pago inmediatamente, acceda a: {{6}}

Contacte inmediatamente para resolver esta situación.

MicroRealEstate - Gestión de Propiedades
```

**Parameters:**
1. `{{1}}` - Tenant name
2. `{{2}}` - Payment period
3. `{{3}}` - Amount with currency
4. `{{4}}` - Due date
5. `{{5}}` - Days overdue
6. `{{6}}` - Payment/invoice URL

## API Usage

### Send Payment Notice

```bash
curl -X POST http://localhost:8500/send-invoice \
  -H "Content-Type: application/json" \
  -d '{
    "templateName": "rentcall",
    "phoneNumbers": ["18091234567"],
    "tenantName": "Juan Pérez",
    "invoicePeriod": "Enero 2025",
    "totalAmount": "15000.00",
    "currency": "RD$",
    "dueDate": "31 de Enero, 2025",
    "invoiceUrl": "https://app.microrealestate.com/invoice/123",
    "locale": "es-DO"
  }'
```

### Send Payment Reminder

```bash
curl -X POST http://localhost:8500/send-invoice \
  -H "Content-Type: application/json" \
  -d '{
    "templateName": "rentcall_reminder",
    "phoneNumbers": ["18091234567"],
    "tenantName": "Juan Pérez",
    "invoicePeriod": "Enero 2025",
    "totalAmount": "15000.00",
    "currency": "RD$",
    "dueDate": "31 de Enero, 2025",
    "daysOverdue": 7,
    "invoiceUrl": "https://app.microrealestate.com/invoice/123",
    "locale": "es-DO"
  }'
```

### Send Final Notice

```bash
curl -X POST http://localhost:8500/send-invoice \
  -H "Content-Type: application/json" \
  -d '{
    "templateName": "rentcall_last_reminder",
    "phoneNumbers": ["18091234567"],
    "tenantName": "Juan Pérez",
    "invoicePeriod": "Enero 2025",
    "totalAmount": "15000.00",
    "currency": "RD$",
    "dueDate": "31 de Enero, 2025",
    "daysOverdue": 15,
    "invoiceUrl": "https://app.microrealestate.com/invoice/123",
    "locale": "es-DO"
  }'
```

## Template Approval Process

### Step 1: Submit Templates to Meta

1. Go to [Facebook Business Manager](https://business.facebook.com)
2. Navigate to **WhatsApp Manager**
3. Select **Message Templates**
4. Create each template using the formats above
5. Submit for approval

### Step 2: Update Environment Variables

Once approved, update your `.env` file with the approved template names:

```bash
WHATSAPP_PAYMENT_NOTICE_TEMPLATE=your_approved_payment_notice_template
WHATSAPP_PAYMENT_REMINDER_TEMPLATE=your_approved_payment_reminder_template
WHATSAPP_FINAL_NOTICE_TEMPLATE=your_approved_final_notice_template
```

### Step 3: Restart Services

```bash
docker compose restart whatsapp
```

## Testing Configuration

### Check Environment Variables

```bash
curl http://localhost:8500/debug/env
```

### Test Template Sending

```bash
curl -X POST http://localhost:8500/send-template \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumbers": ["1234567890"],
    "templateName": "payment_notice",
    "templateLanguage": "es",
    "templateParameters": [
      "Juan Pérez",
      "Enero 2025", 
      "RD$ 15,000.00",
      "31 de Enero, 2025",
      "https://app.microrealestate.com/invoice/123"
    ]
  }'
```

## Fallback Behavior

The system provides multiple fallback levels:

1. **Meta Template** - Tries approved template first
2. **Text Message** - Falls back to formatted text message
3. **WhatsApp Web URL** - Generates wa.me URL as final fallback

## Troubleshooting

### Common Issues

#### Template Not Found
```
Template "payment_notice" not found or not approved
```
**Solution**: Verify template name and approval status in Meta Business Manager

#### Parameter Mismatch
```
Template parameter count mismatch
```
**Solution**: Ensure your template has the correct number of parameters

#### Phone Number Not Allowed
```
Phone number not in allowed list
```
**Solution**: Add test numbers to your WhatsApp Business API configuration

### Debug Logs

Check WhatsApp service logs:
```bash
docker compose logs whatsapp --tail=50
```

Look for these log messages:
- `📤 Sending template "payment_notice" (rentcall) to +1234567890...`
- `✅ Template message sent successfully`
- `⚠️ Template message failed, trying text message...`

## Best Practices

### Template Design
- Keep messages professional and helpful
- Include clear payment instructions
- Provide direct links to payment portals
- Use appropriate urgency levels for different notice types

### Configuration Management
- Use descriptive template names
- Test templates thoroughly before production
- Monitor template approval status
- Keep environment variables secure

### Compliance
- Follow WhatsApp Business Policy guidelines
- Only send business-related messages
- Respect user preferences and opt-outs
- Maintain message quality standards

---

**Last Updated**: January 2025  
**Version**: 2.0  
**Status**: ✅ IMPLEMENTED AND TESTED
