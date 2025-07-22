# WhatsApp Webhook Setup for Message Delivery Tracking

## Overview

The WhatsApp service now includes webhook support to track message delivery status in real-time. This allows you to know if Meta actually accepted, delivered, or failed to deliver your messages.

## 🔧 Configuration

### Environment Variables

Add to your `.env` file:
```bash
# WhatsApp Webhook Configuration
WHATSAPP_WEBHOOK_VERIFY_TOKEN=microrealestate_webhook_token_2025
```

### Webhook URL

Your webhook URL will be:
```
https://your-domain.com/api/v2/whatsapp/webhook
```

For local development:
```
http://localhost:8080/api/v2/whatsapp/webhook
```

## 📋 Meta Business Manager Setup

### Step 1: Configure Webhook in Meta Business Manager

1. Go to [Meta Business Manager](https://business.facebook.com)
2. Navigate to **WhatsApp Manager**
3. Select your **WhatsApp Business Account**
4. Go to **Configuration > Webhooks**
5. Click **Configure Webhooks**

### Step 2: Add Webhook URL

**Callback URL**: `https://your-domain.com/api/v2/whatsapp/webhook`
**Verify Token**: `microrealestate_webhook_token_2025` (or your custom token)

### Step 3: Subscribe to Events

Select these webhook fields:
- ✅ **messages** - For message status updates
- ✅ **message_deliveries** - For delivery confirmations
- ✅ **message_reads** - For read receipts (optional)

### Step 4: Verify Webhook

Click **Verify and Save** - Meta will send a verification request to your webhook URL.

## 🚀 How It Works

### Message Status Flow

1. **Send Message** → WhatsApp API returns initial response
2. **Track Message ID** → Service stores message ID for tracking
3. **Receive Webhook** → Meta sends status updates to your webhook
4. **Update Status** → Service updates message status in memory
5. **Query Status** → You can check delivery status anytime

### Status Types

- **`sent`** - Message accepted by WhatsApp servers
- **`delivered`** - Message delivered to recipient's device
- **`read`** - Message read by recipient (if read receipts enabled)
- **`failed`** - Message delivery failed

## 📊 API Endpoints

### Check Message Status

```bash
GET /api/v2/whatsapp/message-status/{messageId}
```

**Example**:
```bash
curl http://localhost:8080/api/v2/whatsapp/message-status/wamid.HBgLMTkyOTI0NzYzMDUVAgARGBI3NkIzN0VBQkE0MDVGOUZDRDcA
```

**Response**:
```json
{
  "success": true,
  "messageId": "wamid.HBgLMTkyOTI0NzYzMDUVAgARGBI3NkIzN0VBQkE0MDVGOUZDRDcA",
  "status": "delivered",
  "timestamp": "2025-01-21T10:30:00.000Z",
  "recipientId": "19292476305",
  "lastUpdated": "2025-01-21T10:30:15.000Z"
}
```

### Get All Message Statuses

```bash
GET /api/v2/whatsapp/message-statuses
```

**Response**:
```json
{
  "success": true,
  "count": 5,
  "statuses": [
    {
      "messageId": "wamid.xxx",
      "status": "delivered",
      "timestamp": "2025-01-21T10:30:00.000Z",
      "recipientId": "19292476305",
      "lastUpdated": "2025-01-21T10:30:15.000Z",
      "messageType": "template",
      "templateName": "invoice"
    }
  ]
}
```

## 🧪 Testing

### Test Webhook Verification

```bash
curl "http://localhost:8080/api/v2/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=microrealestate_webhook_token_2025&hub.challenge=test123"
```

**Expected Response**: `test123`

### Send Test Message and Track

1. **Send a message**:
```bash
curl -X POST http://localhost:8080/api/v2/whatsapp/send-invoice \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumbers": ["19292476305"],
    "tenantName": "Test User",
    "invoicePeriod": "January 2025",
    "totalAmount": "1000.00",
    "currency": "RD$"
  }'
```

2. **Get message ID from response**:
```json
{
  "results": [
    {
      "messageId": "wamid.HBgLMTkyOTI0NzYzMDUVAgARGBI3NkIzN0VBQkE0MDVGOUZDRDcA"
    }
  ]
}
```

3. **Check status**:
```bash
curl http://localhost:8080/api/v2/whatsapp/message-status/wamid.HBgLMTkyOTI0NzYzMDUVAgARGBI3NkIzN0VBQkE0MDVGOUZDRDcA
```

## 🔍 Monitoring

### Service Logs

Check webhook activity:
```bash
docker compose logs whatsapp --tail=20 | grep -E "(📊|❌|📝)"
```

**Example logs**:
```
📝 Tracking message: wamid.HBgLMTkyOTI0NzYzMDUVAgARGBI3NkIzN0VBQkE0MDVGOUZDRDcA
📊 Message Status Update: wamid.HBgLMTkyOTI0NzYzMDUVAgARGBI3NkIzN0VBQkE0MDVGOUZDRDcA -> delivered (19292476305)
```

### Failed Message Handling

When messages fail, detailed error information is logged:
```
❌ Message Failed: wamid.xxx {
  code: 131030,
  title: "Recipient phone number not in allowed list",
  message: "Phone number not in allowed list",
  details: { ... }
}
```

## 🛠️ Troubleshooting

### Common Issues

#### Webhook Not Receiving Events
- **Check URL accessibility**: Ensure your webhook URL is publicly accessible
- **Verify token mismatch**: Ensure `WHATSAPP_WEBHOOK_VERIFY_TOKEN` matches Meta configuration
- **Check subscription**: Verify webhook is subscribed to `messages` field

#### Message Status Not Found
- **Recent messages only**: Status tracking only works for messages sent after webhook setup
- **Memory storage**: Status is stored in memory and lost on service restart
- **Check message ID**: Ensure you're using the correct message ID from the API response

### Debug Commands

```bash
# Check webhook configuration
curl "http://localhost:8080/api/v2/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test"

# Check all tracked messages
curl http://localhost:8080/api/v2/whatsapp/message-statuses

# Check service logs
docker compose logs whatsapp --tail=50
```

## 🔒 Security

### Webhook Security

- **Verify Token**: Use a strong, unique verification token
- **HTTPS Only**: Always use HTTPS for production webhooks
- **IP Whitelisting**: Consider restricting webhook access to Meta's IP ranges

### Token Management

```bash
# Generate secure token
openssl rand -hex 32
```

Update your `.env` file:
```bash
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_secure_token_here
```

## 📈 Production Considerations

### Persistent Storage

For production, consider storing message status in a database instead of memory:

```javascript
// Example: Store in MongoDB
const messageStatus = new MessageStatus({
  messageId,
  status: statusType,
  timestamp: new Date(parseInt(timestamp) * 1000),
  recipientId,
  messageType: 'template'
});
await messageStatus.save();
```

### Rate Limiting

Implement rate limiting for webhook endpoints to prevent abuse:

```javascript
const rateLimit = require('express-rate-limit');

const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100 // limit each IP to 100 requests per windowMs
});

app.post('/webhook', webhookLimiter, (req, res) => {
  // webhook handler
});
```

## 🎯 Next Steps

1. **Configure webhook in Meta Business Manager**
2. **Test webhook verification**
3. **Send test messages and verify status tracking**
4. **Monitor delivery rates and failed messages**
5. **Implement persistent storage for production**

---

**Now you can track if Meta actually accepts and delivers your WhatsApp messages!** 📊✅
