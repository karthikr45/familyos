import { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Screen, Heading, Muted } from '../../components/shared/ui';
import { tokenStore } from '../../lib/api';
import { useStudentProfile } from '../../hooks/useStudent';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = ['Explain this simply', 'Give me an example', 'Quiz me'];

export default function Learn() {
  const { data: profile } = useStudentProfile();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();

  async function ask(question: string) {
    if (!question.trim() || !profile) return;
    setMessages((m) => [...m, { role: 'user', content: question }]);
    setInput('');
    setLoading(true);

    try {
      const token = await tokenStore.getAccess();
      const res = await fetch(`${API_URL}/api/ai/tutor/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentId: profile.id, question, conversationId }),
      });
      const raw = await res.text();
      let answer = '';
      for (const line of raw.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') continue;
        try {
          const parsed = JSON.parse(payload) as { delta?: string; conversationId?: string };
          if (parsed.conversationId) setConversationId(parsed.conversationId);
          if (parsed.delta) answer += parsed.delta;
        } catch {
          /* ignore non-JSON frames */
        }
      }
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: answer || 'Sorry, please try again.' },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: 'Network error. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View className="flex-1 p-5">
        <Heading>AI Tutor</Heading>
        <Muted>Ask anything about your subjects</Muted>

        <ScrollView className="my-4 flex-1" contentContainerStyle={{ padding: 20, gap: 14 }}>
          {messages.length === 0 && (
            <Text className="mt-10 text-center text-gray-400">
              Start by asking a question below 👇
            </Text>
          )}
          {messages.map((m, i) => (
            <View
              key={i}
              className={`max-w-[85%] rounded-2xl p-3 ${
                m.role === 'user' ? 'self-end bg-primary' : 'self-start bg-white shadow-sm'
              }`}
            >
              <Text className={m.role === 'user' ? 'text-white' : 'text-gray-900'}>
                {m.content}
              </Text>
            </View>
          ))}
          {loading && <ActivityIndicator color="#4f46e5" />}
        </ScrollView>

        <View className="flex-row flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <Pressable
              key={s}
              onPress={() => ask(s)}
              className="rounded-full bg-indigo-50 px-3 py-1.5"
            >
              <Text className="text-sm text-primary">{s}</Text>
            </Pressable>
          ))}
        </View>

        <View className="mt-3 flex-row items-center gap-2">
          <TextInput
            className="h-12 flex-1 rounded-xl border border-gray-300 bg-white px-4"
            placeholder="Type your question…"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => ask(input)}
          />
          <Pressable
            onPress={() => ask(input)}
            className="h-12 w-12 items-center justify-center rounded-xl bg-primary"
          >
            <Text className="text-lg text-white">→</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
