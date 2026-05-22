import { PrismaClient, BoardType, QuestionType, Difficulty, TalentType } from '@prisma/client';

const prisma = new PrismaClient();

const BOARDS = [
  { name: 'Central Board of Secondary Education', code: 'CBSE', state: null },
  { name: 'Indian Certificate of Secondary Education', code: 'ICSE', state: null },
  { name: 'Maharashtra State Board', code: 'MH', state: 'Maharashtra' },
  { name: 'Tamil Nadu State Board', code: 'TN', state: 'Tamil Nadu' },
];

// Core subjects taught across most Indian boards for secondary classes.
const SUBJECTS_BY_CLASS: Record<number, { name: string; code: string }[]> = {
  6: [
    { name: 'Mathematics', code: 'MATH' },
    { name: 'Science', code: 'SCI' },
    { name: 'English', code: 'ENG' },
    { name: 'Social Science', code: 'SST' },
  ],
  7: [
    { name: 'Mathematics', code: 'MATH' },
    { name: 'Science', code: 'SCI' },
    { name: 'English', code: 'ENG' },
    { name: 'Social Science', code: 'SST' },
  ],
  8: [
    { name: 'Mathematics', code: 'MATH' },
    { name: 'Science', code: 'SCI' },
    { name: 'English', code: 'ENG' },
    { name: 'Social Science', code: 'SST' },
  ],
  9: [
    { name: 'Mathematics', code: 'MATH' },
    { name: 'Science', code: 'SCI' },
    { name: 'English', code: 'ENG' },
    { name: 'Social Science', code: 'SST' },
  ],
  10: [
    { name: 'Mathematics', code: 'MATH' },
    { name: 'Science', code: 'SCI' },
    { name: 'English', code: 'ENG' },
    { name: 'Social Science', code: 'SST' },
  ],
};

const EXPENSE_CATEGORIES = [
  { name: 'Education', icon: 'graduation-cap', isSystem: true },
  { name: 'Tuition', icon: 'book-open', isSystem: true },
  { name: 'Food & Groceries', icon: 'shopping-cart', isSystem: true },
  { name: 'Junk Food', icon: 'pizza', isSystem: true },
  { name: 'Health', icon: 'heart-pulse', isSystem: true },
  { name: 'Transport', icon: 'bus', isSystem: true },
  { name: 'Entertainment', icon: 'clapperboard', isSystem: true },
  { name: 'Talents & Hobbies', icon: 'palette', isSystem: true },
  { name: 'Clothing', icon: 'shirt', isSystem: true },
  { name: 'Travel & Vacation', icon: 'plane', isSystem: true },
  { name: 'Pocket Money', icon: 'wallet', isSystem: true },
  { name: 'Other', icon: 'ellipsis', isSystem: true },
];

const TALENT_CATEGORIES: { name: string; type: TalentType }[] = [
  { name: 'Cricket', type: TalentType.SPORTS },
  { name: 'Football', type: TalentType.SPORTS },
  { name: 'Badminton', type: TalentType.SPORTS },
  { name: 'Drawing & Painting', type: TalentType.ARTS },
  { name: 'Classical Dance', type: TalentType.ARTS },
  { name: 'Vocal Music', type: TalentType.MUSIC },
  { name: 'Keyboard / Piano', type: TalentType.MUSIC },
  { name: 'Coding & Robotics', type: TalentType.CODING },
  { name: 'Olympiad Prep', type: TalentType.ACADEMIC },
  { name: 'Chess', type: TalentType.OTHER },
];

async function seedBoardsAndSubjects() {
  for (const board of BOARDS) {
    const createdBoard = await prisma.board.upsert({
      where: { code: board.code },
      update: { name: board.name, state: board.state },
      create: board,
    });

    for (const [classStr, subjects] of Object.entries(SUBJECTS_BY_CLASS)) {
      const klass = Number(classStr);
      for (const subject of subjects) {
        const createdSubject = await prisma.subject.upsert({
          where: {
            boardId_class_code: {
              boardId: createdBoard.id,
              class: klass,
              code: subject.code,
            },
          },
          update: { name: subject.name },
          create: {
            boardId: createdBoard.id,
            class: klass,
            name: subject.name,
            code: subject.code,
          },
        });

        // A couple of sample chapters per subject to make the app explorable.
        for (let n = 1; n <= 3; n++) {
          await prisma.chapter.upsert({
            where: { subjectId_number: { subjectId: createdSubject.id, number: n } },
            update: {},
            create: {
              subjectId: createdSubject.id,
              name: `${subject.name} — Chapter ${n}`,
              number: n,
              description: `Sample chapter ${n} for ${subject.name} (class ${klass}).`,
            },
          });
        }
      }
    }
  }
}

async function seedSampleQuestions() {
  const mathClass10 = await prisma.subject.findFirst({
    where: { code: 'MATH', class: 10, board: { code: 'CBSE' } },
    include: { chapters: { orderBy: { number: 'asc' }, take: 1 } },
  });
  if (!mathClass10) return;

  const chapter = mathClass10.chapters[0];
  const samples = [
    {
      text: 'What is the value of 7 × 8?',
      type: QuestionType.MCQ,
      difficulty: Difficulty.EASY,
      options: ['54', '56', '58', '64'],
      correctAnswer: '56',
      explanation: '7 multiplied by 8 equals 56.',
    },
    {
      text: 'Solve for x: 2x + 3 = 11',
      type: QuestionType.MCQ,
      difficulty: Difficulty.MEDIUM,
      options: ['2', '3', '4', '5'],
      correctAnswer: '4',
      explanation: '2x = 11 - 3 = 8, so x = 4.',
    },
    {
      text: 'Explain the Pythagoras theorem in your own words.',
      type: QuestionType.SHORT,
      difficulty: Difficulty.MEDIUM,
      options: undefined,
      correctAnswer: null,
      explanation:
        'In a right-angled triangle, the square of the hypotenuse equals the sum of squares of the other two sides.',
    },
  ];

  for (const q of samples) {
    const exists = await prisma.question.findFirst({
      where: { subjectId: mathClass10.id, text: q.text },
    });
    if (exists) continue;
    await prisma.question.create({
      data: {
        subjectId: mathClass10.id,
        chapterId: chapter?.id ?? null,
        text: q.text,
        type: q.type,
        difficulty: q.difficulty,
        options: q.options ?? undefined,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        createdBy: 'MANUAL',
      },
    });
  }
}

async function seedCategories() {
  for (const category of EXPENSE_CATEGORIES) {
    await prisma.expenseCategory.upsert({
      where: { name: category.name },
      update: { icon: category.icon, isSystem: category.isSystem },
      create: category,
    });
  }

  for (const talent of TALENT_CATEGORIES) {
    const exists = await prisma.talentCategory.findFirst({ where: { name: talent.name } });
    if (!exists) {
      await prisma.talentCategory.create({ data: talent });
    }
  }
}

async function main() {
  console.log('Seeding FamilyOS reference data...');
  await seedBoardsAndSubjects();
  await seedSampleQuestions();
  await seedCategories();
  console.log('Seed complete.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
