# Emailer Service

Email notification service for sending invoices, reminders, and system notifications.

## Features
- HTML email templates
- Multi-language email support
- Mailgun integration
- Email queue management
- Attachment support

## Configuration
- **Port**: 8083
- **Email Provider**: Mailgun

## Environment Variables
```bash
MAILGUN_API_KEY=your_mailgun_key
MAILGUN_DOMAIN=your_mailgun_domain
EMAIL_FROM=noreply@yourdomain.com
EMAIL_REPLY_TO=support@yourdomain.com
```

## Development
```bash
cd services/emailer
yarn install
yarn dev
```

## API Endpoints
- `/email/send` - Send email
- `/email/template` - Email templates
- `/email/status` - Email status tracking
