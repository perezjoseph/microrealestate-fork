import { useState } from 'react';
import { FaEnvelope } from 'react-icons/fa';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import useTranslation from 'next-translate/useTranslation';
import config from '../config';

function EnvelopeIcon() {
  return (
    <FaEnvelope className="text-primary size-4 mx-1" />
  );
}

export default function FeedbackForm({ className }) {
  const { t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.email || !formData.message) {
      toast.error(t('Please fill in all required fields'));
      return;
    }

    // Create mailto link with form data
    const subject = encodeURIComponent(formData.subject || 'MicroRealEstate Feedback');
    const body = encodeURIComponent(
      `Name: ${formData.name}\n` +
      `Email: ${formData.email}\n` +
      `Company: ${formData.company || 'Not specified'}\n\n` +
      `Message:\n${formData.message}`
    );
    
    const mailtoLink = `mailto:${config.FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
    
    // Open email client
    window.location.href = mailtoLink;
    
    // Reset form and close dialog
    setFormData({
      name: '',
      email: '',
      company: '',
      subject: '',
      message: ''
    });
    setIsOpen(false);
    
    toast.success(t('Email client opened with your feedback'));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className={`w-full justify-start text-left font-normal ${className}`}
        >
          <EnvelopeIcon />
          {t('Send feedback')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('Send feedback')}</DialogTitle>
          <DialogDescription>
            {t('Share your thoughts, suggestions, or report issues with MicroRealEstate')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('Name')} *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder={t('Your full name')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('Email')} *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder={t('your.email@example.com')}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company">{t('Company/Organization')}</Label>
            <Input
              id="company"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              placeholder={t('Your company or organization (optional)')}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subject">{t('Subject')}</Label>
            <Input
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              placeholder={t('Brief description of your feedback')}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">{t('Message')} *</Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder={t('Please share your feedback, suggestions, or describe any issues you encountered...')}
              rows={4}
              required
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              {t('Cancel')}
            </Button>
            <Button type="submit">
              {t('Send feedback')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
