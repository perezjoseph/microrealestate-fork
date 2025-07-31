# WhatsApp Service API Documentation

## Base URL
```
http://localhost:8500
```

## Authentication

The WhatsApp service uses JWT-based authentication integrated with the main authentication service.

### JWT Token Authentication

Include your JWT access token in the Authorization header:
```
Authorization: Bearer your-jwt-access-token
```

Or for tenant API compatibility, use the sessionToken cookie:
```
Cookie: sessionToken=your-jwt-access-token
```

### Required Headers

For user authentication, you must also include the organization ID:
```
organizationid: your-organization-id
```
or
```
organization-id: your-organization-id
```

### Token Types Supported

1. **User Tokens**: For landlord/tenant users with roles (administrator, renter)
2. **Application Tokens**: For machine-to-machine communication  
3. **Service Tokens**: For internal service communication

### Role-Based Access Control

The following roles are allowed to access WhatsApp messaging endpoints:
- `administrator`: Full access to all messaging features
- `renter`: Access to messaging features for their organization

Service and application tokens bypass role checks for system integration.

### Legacy API Key Authentication (Deprecated)

⚠️ **Deprecated**: API key authentication is still supported but deprecated. Please migrate to JWT authentication.

```
X-API-Key: your-api-key-here
```

## Endpoints

### Health Check

#### GET /health
Returns the service health status and configuration information.

**Response:**
```json
{
  "status": "OK",
  "service": "WhatsApp Service",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "apiConfigured": true,
  "mode": "Business API + Fallback"
}
```

**Status Codes:**
- `200 OK`: Service is healthy

---

### Send Simple Message

#### POST /send-message
Sends a simple WhatsApp message to a phone number.

**Request Body:**
```json
{
  "phoneNumber": "+1234567890",
  "message": "Hello, this is a test message",
  "recipientName": "John Doe"
}
```

**Parameters:**
- `phoneNumber` (string, required): Phone number in international format
- `message` (string, required): Message content
- `recipientName` (string, optional): Recipient's name for logging

**Response (API Success):**
```json
{
  "success": true,
  "method": "api",
  "messageId": "wamid.HBgNMTIzNDU2Nzg5MAA=",
  "message": "WhatsApp message sent via API to John Doe",
  "phoneNumber": "+1234567890",
  "recipientName": "John Doe"
}
```

**Response (URL Fallback):**
```json
{
  "success": true,
  "method": "url",
  "whatsappURL": "https://wa.me/1234567890?text=Hello%2C%20this%20is%20a%20test%20message",
  "message": "WhatsApp API unavailable, generated URL for John Doe",
  "phoneNumber": "+1234567890",
  "recipientName": "John Doe",
  "apiError": "WhatsApp access token expired or invalid"
}
```

**Status Codes:**
- `200 OK`: Message sent successfully or URL generated
- `400 Bad Request`: Missing required parameters
- `500 Internal Server Error`: Service error

**cURL Example:**
```bash
curl -X POST http://localhost:8500/send-message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "phoneNumber": "+1234567890",
    "message": "Hello, this is a test message",
    "recipientName": "John Doe"
  }'
```

---

### Send Invoice

#### POST /send-invoice
Sends an invoice notification to multiple phone numbers with automatic fallback strategies.

**Request Body:**
```json
{
  "phoneNumbers": ["+1234567890", "+0987654321"],
  "tenantName": "John Doe",
  "invoicePeriod": "January 2024",
  "totalAmount": "1500.00",
  "currency": "USD",
  "invoiceUrl": "https://example.com/invoice/123",
  "organizationName": "Property Management Co",
  "dueDate": "2024-02-15",
  "templateType": "invoice",
  "locale": "es"
}
```

**Parameters:**
- `phoneNumbers` (array, required): Array of phone numbers in international format
- `tenantName` (string, required): Tenant's name
- `invoicePeriod` (string, required): Invoice period description
- `totalAmount` (string, required): Invoice total amount
- `currency` (string, optional): Currency code (default: "RD$")
- `invoiceUrl` (string, optional): URL to view the invoice
- `organizationName` (string, optional): Organization name (default: "MicroRealEstate")
- `dueDate` (string, optional): Payment due date
- `templateType` (string, optional): Template type (default: "invoice")
- `locale` (string, optional): Language locale (default: "es")

**Response:**
```json
{
  "success": true,
  "message": "Invoice sent to 2 of 2 phone number(s)",
  "results": [
    {
      "phoneNumber": "+1234567890",
      "formattedPhone": "1234567890",
      "success": true,
      "method": "template",
      "messageId": "wamid.HBgNMTIzNDU2Nzg5MAA=",
      "templateName": "factura2"
    },
    {
      "phoneNumber": "+0987654321",
      "formattedPhone": "987654321",
      "success": true,
      "method": "text",
      "messageId": "wamid.HBgNMDk4NzY1NDMyMQA="
    }
  ],
  "tenantName": "John Doe",
  "totalSent": 2,
  "totalRequested": 2
}
```

**Status Codes:**
- `200 OK`: Invoice processing completed (check individual results)
- `400 Bad Request`: Missing required parameters
- `500 Internal Server Error`: Service error

**cURL Example:**
```bash
curl -X POST http://localhost:8500/send-invoice \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "phoneNumbers": ["+1234567890"],
    "tenantName": "John Doe",
    "invoicePeriod": "January 2024",
    "totalAmount": "1500.00",
    "currency": "USD",
    "invoiceUrl": "https://example.com/invoice/123",
    "organizationName": "Property Management Co",
    "dueDate": "2024-02-15"
  }'
```

---

### Webhook Verification

#### GET /webhook
Verifies the WhatsApp webhook subscription.

**Query Parameters:**
- `hub.mode`: Should be "subscribe"
- `hub.verify_token`: Verification token
- `hub.challenge`: Challenge string to echo back

**Response:**
Returns the challenge string if verification is successful.

**Status Codes:**
- `200 OK`: Verification successful
- `403 Forbidden`: Verification failed

---

### Webhook Events

#### POST /webhook
Receives WhatsApp webhook events for message status updates and incoming messages.

**Request Body:**
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "PHONE_NUMBER",
              "phone_number_id": "PHONE_NUMBER_ID"
            },
            "statuses": [
              {
                "id": "wamid.HBgNMTIzNDU2Nzg5MAA=",
                "status": "delivered",
                "timestamp": "1642694849",
                "recipient_id": "1234567890"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

**Response:**
```
OK
```

**Status Codes:**
- `200 OK`: Event processed successfully
- `500 Internal Server Error`: Processing error

---

### Message Status

#### GET /message-status/:messageId
Retrieves the delivery status of a specific message.

**Path Parameters:**
- `messageId` (string, required): WhatsApp message ID

**Response (Found):**
```json
{
  "success": true,
  "messageId": "wamid.HBgNMTIzNDU2Nzg5MAA=",
  "status": {
    "status": "delivered",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "recipientId": "1234567890",
    "lastUpdated": "2024-01-15T10:31:00.000Z",
    "messageType": "template",
    "templateName": "factura2"
  }
}
```

**Response (Not Found):**
```json
{
  "success": false,
  "error": "Message not found"
}
```

**Status Codes:**
- `200 OK`: Message status found
- `404 Not Found`: Message not found
- `503 Service Unavailable`: WhatsApp API not configured

**cURL Example:**
```bash
curl -X GET http://localhost:8500/message-status/wamid.HBgNMTIzNDU2Nzg5MAA= \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "success": false,
  "error": "Error message description",
  "code": "ERROR_CODE",
  "type": "ErrorType"
}
```

### Common Error Types

- **ValidationError**: Invalid request parameters
- **ConfigurationError**: Missing or invalid service configuration
- **APIError**: WhatsApp Business API errors
- **WhatsAppError**: General service errors

### Facebook API Error Codes

- `131030`: Phone number not in allowed list
- `190`: Access token expired or invalid
- `132000`: Template not found or not approved
- `131031`: Phone number is not a WhatsApp Business API phone number
- `131032`: Phone number is not registered with WhatsApp Business API
- `131033`: Message template is not approved
- `131047`: Re-engagement message template is required for this user

## Message Delivery Strategies

The service uses a multi-strategy approach for message delivery:

1. **Template Message**: Uses approved WhatsApp Business templates
2. **Text Message**: Sends plain text via WhatsApp Business API
3. **URL Fallback**: Generates WhatsApp Web URL for manual sending

Each strategy is attempted in order until one succeeds or all fail.

## Rate Limits

WhatsApp Business API has the following rate limits:
- 1,000 messages per second per phone number
- 250,000 messages per day for new businesses
- Higher limits available after approval

## Testing

Use the health endpoint to verify service availability:

```bash
curl -X GET http://localhost:8500/health
```

For testing message delivery without sending actual messages, use a test phone number in your WhatsApp Business API configuration.