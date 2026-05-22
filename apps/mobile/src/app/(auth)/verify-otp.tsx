import { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { Screen, Button, Heading, Muted } from '../../components/shared/ui';
import { useSendOtp, useVerifyOtp } from '../../hooks/useAuth';

export default function VerifyOtp() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const sendOtp = useSendOtp();
  const verifyOtp = useVerifyOtp();
  const sent = sendOtp.isSuccess;

  return (
    <Screen>
      <View className="flex-1 justify-center px-8">
        <Heading>Sign in with phone</Heading>
        <Muted>
          {sent ? 'Enter the 6-digit code we sent you' : 'We will text you a one-time code'}
        </Muted>
        <View className="mt-6 gap-3">
          <TextInput
            className="h-12 rounded-xl border border-gray-300 bg-white px-4"
            placeholder="+91 98765 43210"
            keyboardType="phone-pad"
            editable={!sent}
            value={phone}
            onChangeText={setPhone}
          />
          {!sent ? (
            <Button
              title="Send OTP"
              loading={sendOtp.isPending}
              onPress={() => sendOtp.mutate(phone)}
            />
          ) : (
            <>
              <TextInput
                className="h-12 rounded-xl border border-gray-300 bg-white px-4 tracking-[8px]"
                placeholder="••••••"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
              />
              {verifyOtp.isError && (
                <Text className="text-sm text-red-600">Incorrect or expired code.</Text>
              )}
              <Button
                title="Verify & continue"
                loading={verifyOtp.isPending}
                onPress={() => verifyOtp.mutate({ phone, otp })}
              />
            </>
          )}
        </View>
      </View>
    </Screen>
  );
}
