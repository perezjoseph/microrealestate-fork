import React, { useState } from 'react';
import { PhoneInputField } from './PhoneInputField';
import { PhoneInputFormField } from './PhoneInputFormField';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './form';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Country } from '@/utils/phone/Countries';

// Form schema for demonstration
const phoneFormSchema = z.object({
  phoneNumber: z.string().min(1, 'Phone number is required')
});

type PhoneFormData = z.infer<typeof phoneFormSchema>;

/**
 * Demo component showcasing different PhoneInputField variants and usage patterns
 */
export const PhoneInputDemo: React.FC = () => {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [phoneValue, setPhoneValue] = useState('');

  // React Hook Form setup
  const form = useForm<PhoneFormData>({
    resolver: zodResolver(phoneFormSchema),
    defaultValues: {
      phoneNumber: ''
    }
  });

  const onSubmit = (data: PhoneFormData) => {
    console.log('Form submitted:', data);
    alert(`Phone number submitted: ${data.phoneNumber}`);
  };

  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country);
    console.log('Country changed:', country);
  };

  const handlePhoneChange = (value: string) => {
    setPhoneValue(value);
    console.log('Phone value changed:', value);
  };

  return (
    <div className="space-y-8 p-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold">PhoneInputField Demo</h1>
        <p className="text-muted-foreground mt-2">
          Showcasing different variants and usage patterns
        </p>
      </div>

      {/* Size Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Size Variants</CardTitle>
          <CardDescription>
            Different sizes for various use cases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Small</label>
            <PhoneInputField
              size="sm"
              placeholder="Small phone input"
              onCountryChange={handleCountryChange}
              onChange={handlePhoneChange}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Default</label>
            <PhoneInputField
              size="default"
              placeholder="Default phone input"
              onCountryChange={handleCountryChange}
              onChange={handlePhoneChange}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Large</label>
            <PhoneInputField
              size="lg"
              placeholder="Large phone input"
              onCountryChange={handleCountryChange}
              onChange={handlePhoneChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Visual Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Visual Variants</CardTitle>
          <CardDescription>
            Different visual styles for design consistency
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Default</label>
            <PhoneInputField
              variant="default"
              placeholder="Default variant"
              onCountryChange={handleCountryChange}
              onChange={handlePhoneChange}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Outline</label>
            <PhoneInputField
              variant="outline"
              placeholder="Outline variant"
              onCountryChange={handleCountryChange}
              onChange={handlePhoneChange}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Filled</label>
            <PhoneInputField
              variant="filled"
              placeholder="Filled variant"
              onCountryChange={handleCountryChange}
              onChange={handlePhoneChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* States */}
      <Card>
        <CardHeader>
          <CardTitle>Different States</CardTitle>
          <CardDescription>
            Error states, disabled states, and validation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">With Error</label>
            <PhoneInputField
              placeholder="Phone with error"
              error="Please enter a valid phone number"
              value="123"
              onCountryChange={handleCountryChange}
              onChange={handlePhoneChange}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Disabled</label>
            <PhoneInputField
              placeholder="Disabled phone input"
              disabled
              onCountryChange={handleCountryChange}
              onChange={handlePhoneChange}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">With Valid Number</label>
            <PhoneInputField
              placeholder="Valid phone number"
              value="2125551234"
              defaultCountry="US"
              onCountryChange={handleCountryChange}
              onChange={handlePhoneChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* React Hook Form Integration */}
      <Card>
        <CardHeader>
          <CardTitle>React Hook Form Integration</CardTitle>
          <CardDescription>
            Seamless integration with form validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <PhoneInputFormField
                        {...field}
                        placeholder="Enter your phone number"
                        defaultCountry="US"
                        onCountryChange={handleCountryChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Submit Form</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Current State Display */}
      <Card>
        <CardHeader>
          <CardTitle>Current State</CardTitle>
          <CardDescription>
            Real-time display of component state
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Selected Country:</strong>{' '}
              {selectedCountry ? `${selectedCountry.name} (${selectedCountry.code})` : 'None'}
            </div>
            <div>
              <strong>Phone Value:</strong> {phoneValue || 'Empty'}
            </div>
            <div>
              <strong>Form Value:</strong> {form.watch('phoneNumber') || 'Empty'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PhoneInputDemo;