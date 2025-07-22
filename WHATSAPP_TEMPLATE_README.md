# WhatsApp Business API Template Configuration

This document explains how to configure and use WhatsApp Business API templates in MicroRealEstate for sending rent invoices and payment notifications.

## Overview

MicroRealEstate uses WhatsApp Business API templates to send professional, compliant messages to tenants. Templates must be pre-approved by Meta (Facebook) before they can be used.

## Environment Configuration

### Required Environment Variables

Add these variables to your `.env` file:

```bash
# WhatsApp Business API Configuration
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id

# WhatsApp Template Configuration
WHATSAPP_TEMPLATE_NAME=factura2
WHATSAPP_TEMPLATE_LANGUAGE=es
```

### Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `WHATSAPP_TEMPLATE_NAME` | `factura2` | Name of the approved template in Meta Business Manager |
| `WHATSAPP_TEMPLATE_LANGUAGE` | `es` | Language code for the template (es, en, etc.) |

## Meta Template Submission

### Recommended Template for Approval

Submit this template to Meta Business Manager:

**Template Name**: `factura2` (or your preferred name)
**Category**: `UTILITY`
**Language**: Spanish (es)

**Template Content**:
```
Estimado/a {{1}},

Su factura de alquiler del período {{2}} está lista para su revisión.

💰 Monto total a pagar: {{3}}
📅 Fecha límite de pago: {{4}}

Para ver los detalles completos de su factura y realizar el pago, puede acceder al siguiente enlace: {{5}}

Es importante realizar el pago dentro de la fecha establecida para evitar recargos adicionales. Si tiene alguna consulta sobre su factura o necesita asistencia con el proceso de pago, no dude en contactarnos.

Agradecemos su puntualidad y confianza.

Saludos cordiales,
MicroRealEstate - Gestión de Propiedades
```

### Template Parameters

The template uses 5 parameters that are automatically populated:

1. **{{1}}** - Tenant name (e.g., "Juan Pérez")
2. **{{2}}** - Invoice period (e.g., "Enero 2025")
3. **{{3}}** - Total amount with currency (e.g., "RD$ 15,000.00")
4. **{{4}}** - Due date (e.g., "31 de Enero, 2025")
5. **{{5}}** - Invoice URL link

### Example Generated Message

```
Estimado/a Juan Pérez,

Su factura de alquiler del período Enero 2025 está lista para su revisión.

💰 Monto total a pagar: RD$ 15,000.00
📅 Fecha límite de pago: 31 de Enero, 2025

Para ver los detalles completos de su factura y realizar el pago, puede acceder al siguiente enlace: https://app.microrealestate.com/invoice/123

Es importante realizar el pago dentro de la fecha establecida para evitar recargos adicionales. Si tiene alguna consulta sobre su factura o necesita asistencia con el proceso de pago, no dude en contactarnos.

Agradecemos su puntualidad y confianza.

Saludos cordiales,
MicroRealEstate - Gestión de Propiedades
```

## How It Works

### Template Selection Logic

1. **Template Message First**: System attempts to send using the configured Meta-approved template
2. **Text Message Fallback**: If template fails, falls back to formatted text message
3. **URL Fallback**: If API fails completely, generates WhatsApp Web URL

### Message Flow

```
User clicks "Send WhatsApp" 
    ↓
System prepares template data
    ↓
Calls WhatsApp Business API with template
    ↓
Success? → Message delivered via API
    ↓
Failure? → Try text message
    ↓
Still failing? → Generate WhatsApp Web URL
```

## Template Approval Process

### Step 1: Create Template in Meta Business Manager

1. Go to [Facebook Business Manager](https://business.facebook.com)
2. Navigate to **WhatsApp Manager**
3. Select **Message Templates**
4. Click **Create Template**
5. Fill in template details using the format above
6. Submit for approval

### Step 2: Wait for Approval

- **Review time**: Usually 24-48 hours
- **Status**: Check template status in Business Manager
- **Approval criteria**: Must be business-focused, provide value to recipients

### Step 3: Update Configuration

Once approved, update your environment variables:

```bash
WHATSAPP_TEMPLATE_NAME=your_approved_template_name
WHATSAPP_TEMPLATE_LANGUAGE=es
```

### Step 4: Restart Services

```bash
docker compose restart whatsapp
```

## Testing

### Test Template Message

```bash
curl -X POST http://localhost:8080/api/v2/whatsapp/send-invoice \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumbers": ["1234567890"],
    "tenantName": "Test User",
    "invoicePeriod": "Enero 2025",
    "totalAmount": "15000.00",
    "currency": "RD$",
    "dueDate": "31 de Enero, 2025",
    "invoiceUrl": "https://example.com/invoice/123",
    "organizationName": "MicroRealEstate"
  }'
```

### Expected Response

```json
{
  "success": true,
  "templateName": "invoice",
  "results": [
    {
      "phoneNumber": "1234567890",
      "success": true,
      "method": "api",
      "messageId": "wamid.xxx"
    }
  ],
  "summary": {
    "total": 1,
    "apiSuccess": 1,
    "urlFallback": 0
  }
}
```

## Troubleshooting

### Common Issues

#### Template Not Found Error
```
Template "invoice" not found or not approved
```
**Solution**: Verify template name and approval status in Meta Business Manager

#### Phone Number Not Allowed
```
Phone number not in allowed list
```
**Solution**: Add test numbers to your WhatsApp Business API configuration

#### Access Token Expired
```
WhatsApp access token expired or invalid
```
**Solution**: Generate new access token in Meta Business Manager

### Debug Logs

Check WhatsApp service logs:
```bash
docker compose logs whatsapp --tail=50
```

Look for these log messages:
- `📤 Sending template "invoice" to +1234567890...`
- `✅ Template message sent successfully`
- `⚠️ Template message failed, trying text message...`

## Additional Templates

### Payment Reminder Template

For overdue payments, you can create an additional template:

**Template Name**: `payment_reminder`
**Content**:
```
Estimado/a {{1}},

Le recordamos que su pago de alquiler correspondiente al período {{2}} se encuentra pendiente.

💰 Monto adeudado: {{3}}
📅 Fecha de vencimiento: {{4}}

Para evitar recargos por mora y mantener su historial de pagos al día, le solicitamos regularizar su situación a la brevedad posible. Puede realizar su pago y consultar los detalles en: {{5}}

Si ya realizó el pago, por favor ignore este mensaje. En caso de tener alguna dificultad o consulta, estamos disponibles para asistirle.

Gracias por su atención y comprensión.

Atentamente,
MicroRealEstate - Gestión de Propiedades
```

## Best Practices

### Template Design
- Keep parameter count low (5 or fewer)
- Provide clear value to recipients
- Use professional, helpful language
- Include clear call-to-action

### Configuration Management
- Use environment variables for template names
- Test templates thoroughly before production
- Monitor approval status regularly
- Keep backup text message functionality

### Compliance
- Only send business-related messages
- Respect user preferences and opt-outs
- Follow WhatsApp Business Policy guidelines
- Maintain message quality standards

## Support

For issues with:
- **Template approval**: Contact Meta Business Support
- **API integration**: Check WhatsApp Business API documentation
- **MicroRealEstate configuration**: Check application logs and this documentation

---

**Last Updated**: January 2025
**Version**: 1.0
