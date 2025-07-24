# PDF Generator Service

Document generation service for creating leases, invoices, and rental documents.

## Features
- PDF document generation
- Custom templates
- Multi-language document support
- Digital signatures
- Document watermarking

## Configuration
- **Port**: 8082
- **Template Engine**: Handlebars
- **PDF Library**: Puppeteer

## Environment Variables
```bash
TEMPLATE_PATH=/app/templates
OUTPUT_PATH=/app/output
```

## Development
```bash
cd services/pdfgenerator
yarn install
yarn dev
```

## API Endpoints
- `/pdf/generate` - Generate PDF document
- `/pdf/template` - Manage templates
- `/pdf/download` - Download generated PDF
