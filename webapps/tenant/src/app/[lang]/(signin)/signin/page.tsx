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
import { PhoneInputFormField } from '@/components/ui/PhoneInputFormField';
import mockedSession from '@/mocks/session';
import useApiFetcher from '@/utils/fetch/client';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import useTranslation from '@/utils/i18n/client/useTranslation';
import { zodResolver } from '@hookform/resolvers/zod';
import { phoneNumberSchema } from '@/utils/validation/phoneValidation';
import { Country } from '@/utils/phone/Countries';

const signInFormSchema = z.object({
  email: z.string().email()
});

const whatsappSignInFormSchema = z.object({
  phoneNumber: phoneNumberSchema
});

type SignInFormValues = z.infer<typeof signInFormSchema>;
type WhatsAppSignInFormValues = z.infer<typeof whatsappSignInFormSchema>;

export default function SignIn() {
  const apiFetcher = useApiFetcher();
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'whatsapp'>('email');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  const emailForm = useForm<SignInFormValues>({
    resolver: zodResolver(signInFormSchema),
    defaultValues:
      getEnv('DEMO_MODE') === 'true'
        ? {
            email: mockedSession.email
          }
        : { email: '' }
  });

  const whatsappForm = useForm<WhatsAppSignInFormValues>({
    resolver: zodResolver(whatsappSignInFormSchema),
    defaultValues: { phoneNumber: '' }
  });

  async function onEmailSubmit(values: SignInFormValues) {
    if (getEnv('DEMO_MODE') === 'true') {
      router.replace('/dashboard');
    } else {
      try {
        setLoading(true);
        const response = await apiFetcher.post(
          '/api/v2/authenticator/tenant/signin',
          {
            email: values.email
          }
        );
        if (response.status >= 200 && response.status < 300) {
          return router.replace(`/otp/${encodeURIComponent(values.email)}`);
        }
      } catch (error) {
        console.error(error);
      }
      toast({
        variant: 'destructive',
        title: t('Something went wrong'),
        description: t('There was an error while signing in.')
      });
      setLoading(false);
    }
  }

  async function onWhatsAppSubmit(values: WhatsAppSignInFormValues) {
    if (getEnv('DEMO_MODE') === 'true') {
      router.replace('/dashboard');
    } else {
      try {
        setLoading(true);
        // The phoneNumber is already in E.164 format thanks to the schema transformation
        const response = await apiFetcher.post(
          '/api/v2/authenticator/tenant/whatsapp/signin',
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
      <div className="text-2xl text-center md:text-left md:text-4xl font-medium text-secondary-foreground mb-8">
        {t('Sign in to your account')}
      </div>

      {/* Login Method Toggle */}
      <div className="flex space-x-2 mb-6">
        <Button
          type="button"
          variant={loginMethod === 'email' ? 'default' : 'outline'}
          onClick={() => setLoginMethod('email')}
          className="flex-1"
        >
          {t('Email')}
        </Button>
        <Button
          type="button"
          variant={loginMethod === 'whatsapp' ? 'default' : 'outline'}
          onClick={() => setLoginMethod('whatsapp')}
          className="flex-1"
        >
          {t('WhatsApp')}
        </Button>
      </div>

      {/* Email Login Form */}
      {loginMethod === 'email' && (
        <Form {...emailForm}>
          <form
            onSubmit={emailForm.handleSubmit(onEmailSubmit)}
            className="space-y-6"
          >
            <FormField
              control={emailForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t('Your email')}
                      disabled={getEnv('DEMO_MODE') === 'true' || loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('Sending...') : t('Send Email OTP')}
            </Button>
          </form>
        </Form>
      )}

      {/* WhatsApp Login Form */}
      {loginMethod === 'whatsapp' && (
        <Form {...whatsappForm}>
          <form
            onSubmit={whatsappForm.handleSubmit(onWhatsAppSubmit)}
            className="space-y-6"
          >
            <FormField
              control={whatsappForm.control}
              name="phoneNumber"
              render={() => (
                <FormItem>
                  <FormControl>
                    <PhoneInputFormField
                      name="phoneNumber"
                      control={whatsappForm.control}
                      placeholder={t('Enter your phone number')}
                      disabled={loading}
                      onCountryChange={(country) => {
                        setSelectedCountry(country);
                      }}
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
      )}

      <div className="mt-6 text-center text-sm text-muted-foreground">
        {loginMethod === 'email'
          ? t('We will send a verification code to your email')
          : t('We will send a verification code to your WhatsApp')}
      </div>
    </div>
  );
}
