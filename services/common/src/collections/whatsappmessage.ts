import { CollectionTypes } from '@microrealestate/types';
import mongoose from 'mongoose';
import Realm from './realm.js';

const WhatsAppMessageSchema = new mongoose.Schema<CollectionTypes.WhatsAppMessage>({
  realmId: { type: String, ref: Realm, required: true },
  templateName: String,
  templateType: { 
    type: String, 
    enum: ['invoice', 'paymentNotice', 'paymentReminder', 'finalNotice', 'login'] 
  },
  recordId: String,
  parameters: {},
  sentTo: String,
  sentDate: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['sent', 'delivered', 'read', 'failed'], 
    default: 'sent' 
  },
  messageId: String,
  method: { 
    type: String, 
    enum: ['api', 'url'] 
  },
  whatsappURL: String,
  errorCode: String,
  errorMessage: String,
  facebookTraceId: String
});

// Add indexes for performance
WhatsAppMessageSchema.index({ realmId: 1, sentDate: -1 });
WhatsAppMessageSchema.index({ realmId: 1, templateType: 1, sentDate: -1 });
WhatsAppMessageSchema.index({ realmId: 1, status: 1, sentDate: -1 });
WhatsAppMessageSchema.index({ messageId: 1 });

export default mongoose.model<CollectionTypes.WhatsAppMessage>('WhatsAppMessage', WhatsAppMessageSchema);
