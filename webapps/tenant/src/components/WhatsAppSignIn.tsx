'use client';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import getEnv from '@/utils/env/client';
import { Input } from '@/components/ui/input';
import useApiFetcher from '@/utils/fetch/client';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import useTranslation from '@/utils/i18n/client/useTranslation';
import { zodResolver } from '@hookform/resolvers/zod';

const whatsappSignInFormSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
});
type WhatsAppSignInFormValues = z.infer<typeof whatsappSignInFormSchema>;

export default function WhatsAppSignIn() {
  const apiFetcher = useApiFetcher();
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const form = useForm<WhatsAppSignInFormValues>({
    resolver: zodResolver(whatsappSignInFormSchema),
    defaultValues: { phoneNumber: '' }
  });
  const [loading, setLoading] = useState<boolean>(false);

  async function onSubmit(values: WhatsAppSignInFormValues) {
    if (getEnv('DEMO_MODE') === 'true') {
      router.replace('/dashboard');
    } else {
      try {
        setLoading(true);
        const response = await apiFetcher.post(
          '/api/v2/authenticator/whatsapp/signin',
          {
            phoneNumber: values.phoneNumber
          }
        );
        if (response.status >= 200 && response.status < 300) {
          toast({
            title: t('WhatsApp OTP Sent'),
            description: t(
              'Please check your WhatsApp for the verification code.'
            )
          });
          return router.replace(
            `/whatsapp-otp/${encodeURIComponent(values.phoneNumber)}`
          );
        }
      } catch (error) {
        console.error(error);
      }
      toast({
        variant: 'destructive',
        title: t('Something went wrong'),
        description: t('There was an error while sending WhatsApp OTP.')
      });
      setLoading(false);
    }
  }

  return (
    <div className="p-5 md:p-0 md:max-w-md w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
          <div className="text-2xl text-center md:text-left md:text-4xl font-medium text-secondary-foreground">
            {t('Sign in with WhatsApp')}
          </div>
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t('Your WhatsApp number (e.g., +1234567890)')}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('Sending...') : t('Send WhatsApp OTP')}
          </Button>
        </form>
      </Form>
    </div>
  );
}
