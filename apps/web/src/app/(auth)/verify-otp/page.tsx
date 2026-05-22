'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSendOtp, useVerifyOtp } from '@/hooks/useAuth';

export default function VerifyOtpPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const sendOtp = useSendOtp();
  const verifyOtp = useVerifyOtp();
  const otpSent = sendOtp.isSuccess;

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Sign in with phone</CardTitle>
          <p className="text-sm text-muted-foreground">
            {otpSent ? 'Enter the 6-digit code we sent you' : 'We will send you a one-time code'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={otpSent}
          />
          {!otpSent ? (
            <Button
              className="w-full"
              disabled={sendOtp.isPending || !phone}
              onClick={() => sendOtp.mutate(phone)}
            >
              {sendOtp.isPending ? 'Sending…' : 'Send OTP'}
            </Button>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                verifyOtp.mutate({ phone, otp });
              }}
            >
              <Input
                placeholder="6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
              />
              {verifyOtp.isError && (
                <p className="text-sm text-destructive">Incorrect or expired OTP.</p>
              )}
              <Button type="submit" className="w-full" disabled={verifyOtp.isPending}>
                {verifyOtp.isPending ? 'Verifying…' : 'Verify & continue'}
              </Button>
            </form>
          )}
          <p className="text-center text-sm">
            <Link href="/login" className="text-primary hover:underline">
              Use email instead
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
