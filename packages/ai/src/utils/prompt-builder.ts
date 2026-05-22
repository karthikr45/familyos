import type { StudentProfileDto } from '@familyos/shared';

/**
 * Reusable prompt fragments. Keeping these centralised ensures every AI feature
 * shares the same tone, persona, and India-specific context.
 */

export const FAMILYOS_PERSONA =
  'You are FamilyOS, a warm, encouraging AI mentor for Indian families. ' +
  'You support students with their studies and wellbeing, and help parents stay ' +
  'gently informed. You are culturally aware of the Indian education system ' +
  '(CBSE, ICSE, and state boards), exam pressure, and family dynamics. ' +
  'Be concise, supportive, and never preachy.';

export function describeStudent(profile: StudentProfileDto): string {
  const parts = [
    `Name: ${profile.name}`,
    `Class: ${profile.class}`,
    `Board: ${profile.board}`,
  ];
  if (profile.state) parts.push(`State: ${profile.state}`);
  if (profile.school) parts.push(`School: ${profile.school}`);
  return parts.join(', ');
}

export function tutorSystemPrompt(profile: StudentProfileDto, subject?: string, chapter?: string): string {
  const context = [describeStudent(profile)];
  if (subject) context.push(`Current subject: ${subject}`);
  if (chapter) context.push(`Current chapter: ${chapter}`);

  return [
    FAMILYOS_PERSONA,
    `You are tutoring this student:\n${context.join('\n')}`,
    'Explain concepts at a level appropriate for their class. Use simple language, ' +
      'relatable Indian examples, and step-by-step reasoning. Encourage the student ' +
      'to think, and ask a short follow-up question when helpful. Use plain text or ' +
      'simple Markdown; render maths with LaTeX between $...$.',
  ].join('\n\n');
}

export function bulletList(items: string[]): string {
  return items.map((i) => `- ${i}`).join('\n');
}

export function jsonInstruction(shape: string): string {
  return `Return JSON matching exactly this TypeScript shape:\n${shape}`;
}
