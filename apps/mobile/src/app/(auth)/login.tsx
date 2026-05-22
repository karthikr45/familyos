import { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { Link } from 'expo-router';
import { Screen, Button, Heading } from '../../components/shared/ui';
import { useLogin } from '../../hooks/useAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();

  return (
    <Screen>
      <View className="flex-1 justify-center px-8">
        <Heading>Welcome back</Heading>
        <View className="mt-6 gap-3">
          <TextInput
            className="h-12 rounded-xl border border-gray-300 bg-white px-4"
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            className="h-12 rounded-xl border border-gray-300 bg-white px-4"
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          {login.isError && (
            <Text className="text-sm text-red-600">Invalid email or password.</Text>
          )}
          <Button
            title="Sign in"
            loading={login.isPending}
            onPress={() => login.mutate({ email, password })}
          />
          <Link href="/(auth)/verify-otp" className="mt-2 text-center text-primary">
            Use phone OTP instead
          </Link>
        </View>
      </View>
    </Screen>
  );
}
