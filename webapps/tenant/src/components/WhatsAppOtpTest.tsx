'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function WhatsAppOtpTest() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('OTP submitted:', otp);
    alert(`OTP entered: ${otp}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('Input changed:', value);
    setOtp(value);
  };

  return (
    <div className="p-5 md:p-0 md:max-w-md w-full">
      <h2 className="text-2xl font-medium mb-4">WhatsApp OTP Test</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="otp-test" className="block text-sm font-medium mb-2">
            Enter OTP (Test):
          </label>
          <Input
            id="otp-test"
            type="text"
            value={otp}
            onChange={handleInputChange}
            placeholder="Enter 6-digit OTP"
            maxLength={6}
            disabled={loading}
            className="w-full"
          />
          <p className="text-sm text-gray-500 mt-1">
            Current value: "{otp}" (Length: {otp.length})
          </p>
        </div>
        <Button type="submit" className="w-full" disabled={loading || otp.length < 6}>
          Test Submit (OTP: {otp})
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          className="w-full" 
          onClick={() => setOtp('')}
        >
          Clear
        </Button>
      </form>
    </div>
  );
}
