'use client';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@/components/ui/form';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot
} from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import getEnv from '@/utils/env/client';
import useApiFetcher from '@/utils/fetch/client';
import { useForm } from 'react-hook-form';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import useTranslation from '@/utils/i18n/client/useTranslation';
import { zodResolver } from '@hookform/resolvers/zod';

// Define the schema outside the component to avoid re-creation
const otpFormSchema = z.object({
  otp: z.string().min(6, 'OTP must be at least 6 characters')
});
type OtpFormValues = z.infer<typeof otpFormSchema>;

export default function WhatsAppOtp() {
  const apiFetcher = useApiFetcher();
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const phoneNumber = decodeURIComponent(params.phone as string);
  
  const form = useForm<OtpFormValues>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: { otp: '' }
  });
  const [loading, setLoading] = useState<boolean>(false);

  async function onSubmit(values: OtpFormValues) {
    if (getEnv('DEMO_MODE') === 'true') {
      router.replace('/dashboard');
    } else {
      try {
        setLoading(true);
        const response = await apiFetcher.get(
          `/api/v2/authenticator/whatsapp/signedin?otp=${values.otp}`
        );
        if (response.status >= 200 && response.status < 300) {
          toast({
            title: t('Success'),
            description: t('WhatsApp OTP verified successfully!')
          });
          return router.replace('/dashboard');
        }
      } catch (error) {
        console.error(error);
      }
      toast({
        variant: 'destructive',
        title: t('Invalid OTP'),
        description: t('The OTP you entered is invalid or has expired.')
      });
      setLoading(false);
    }
  }

  async function resendOtp() {
    try {
      setLoading(true);
      const response = await apiFetcher.post(
        '/api/v2/authenticator/whatsapp/signin',
        {
          phoneNumber: phoneNumber
        }
      );
      if (response.status >= 200 && response.status < 300) {
        toast({
          title: t('OTP Resent'),
          description: t('A new OTP has been sent to your WhatsApp.')
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t('Error'),
        description: t('Failed to resend OTP. Please try again.')
      });
    }
    setLoading(false);
  }

  return (
    <div className="p-5 md:p-0 md:max-w-md w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
          <div className="text-2xl text-center md:text-left md:text-4xl font-medium text-secondary-foreground">
            {t('Enter WhatsApp OTP')}
          </div>
          <div className="text-sm text-muted-foreground text-center md:text-left">
            {t('We sent a verification code to')} {phoneNumber}
          </div>
          <FormField
            control={form.control}
            name="otp"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <InputOTP
                    maxLength={6}
                    {...field}
                    disabled={getEnv('DEMO_MODE') === 'true' || loading}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('Verifying...') : t('Verify OTP')}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={resendOtp}
              disabled={loading}
            >
              {t('Resend OTP')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
