# Factura2 WhatsApp Template Configuration Update

## Summary

The WhatsApp implementation has been successfully updated to use the "factura2" template instead of the previous "invoice" template.

## Changes Made

### 1. Environment Configuration (.env)
```bash
# Changed from:
WHATSAPP_TEMPLATE_NAME=invoice

# Changed to:
WHATSAPP_TEMPLATE_NAME=factura2
```

### 2. WhatsApp Service Configuration
- Updated default template name in `/services/whatsapp/src/index.js`
- Service now defaults to "factura2" if environment variable is not set

### 3. Test Scripts Updated
- Updated `test-whatsapp-template.js` to use factura2 as default
- Created new `test-factura2-template.js` specifically for testing factura2 configuration
- Created `services/whatsapp/test-factura2.js` for container-based testing

### 4. Documentation Updated
- Updated `WHATSAPP_TEMPLATE_README.md` to reflect factura2 template usage
- Updated template submission examples and configuration tables

## Template Structure

The factura2 template uses the same 5-parameter structure as the previous invoice template:

1. **{{1}}** - Tenant name (e.g., "María González")
2. **{{2}}** - Invoice period (e.g., "Enero 2025")
3. **{{3}}** - Total amount with currency (e.g., "RD$ 25,000.00")
4. **{{4}}** - Due date (e.g., "31 de Enero, 2025")
5. **{{5}}** - Invoice URL link

## Verification

✅ **Service Configuration**: WhatsApp service now shows "Template Name: factura2"
✅ **Environment Variables**: WHATSAPP_TEMPLATE_NAME=factura2
✅ **Language Setting**: WHATSAPP_TEMPLATE_LANGUAGE=es (Spanish)
✅ **Service Restart**: Successfully restarted and applied new configuration

## Next Steps Required

### 1. Meta Business Manager Template Approval

You need to ensure that the "factura2" template is approved in your Meta Business Manager:

1. Go to [Facebook Business Manager](https://business.facebook.com)
2. Navigate to **WhatsApp Manager**
3. Select **Message Templates**
4. Verify that "factura2" template exists and is **APPROVED**
5. If not, create and submit the template for approval

### 2. Template Content for Meta Submission

Use this template content when submitting "factura2" to Meta:

**Template Name**: `factura2`
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

### 3. Testing

Once the "factura2" template is approved in Meta Business Manager, test the integration:

```bash
# Test the configuration
cd /home/jperez/microrealestate
./test-factura2-template.js

# Test with a real phone number (replace with approved test number)
curl -X POST http://localhost:8500/send-invoice \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumbers": ["YOUR_TEST_PHONE_NUMBER"],
    "tenantName": "Test User",
    "invoicePeriod": "Enero 2025",
    "totalAmount": "25000.00",
    "currency": "RD$",
    "dueDate": "31 de Enero, 2025",
    "invoiceUrl": "https://example.com/factura/123",
    "organizationName": "MicroRealEstate"
  }'
```

## Troubleshooting

### Common Issues

1. **Template Not Found Error**
   - Ensure "factura2" template is approved in Meta Business Manager
   - Check template name spelling matches exactly

2. **Phone Number Not Allowed**
   - Add test phone numbers to WhatsApp Business API configuration
   - Use approved phone numbers for testing

3. **Access Token Issues**
   - Verify WHATSAPP_ACCESS_TOKEN is valid and not expired
   - Check token permissions in Meta Business Manager

### Debug Commands

```bash
# Check current configuration
docker compose logs whatsapp --tail=10

# Check environment variables
grep WHATSAPP .env

# Test template configuration
docker compose exec whatsapp node test-factura2.js
```

## Status

🟢 **Configuration Updated**: All files updated to use factura2 template
🟡 **Pending**: Meta Business Manager template approval required
🟡 **Pending**: Testing with approved template required

---

**Last Updated**: January 21, 2025
**Configuration Version**: factura2-v1.0
