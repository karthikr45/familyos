import {
  PrismaClient,
  BoardType,
  QuestionType,
  Difficulty,
  TalentType,
  Prisma,
} from '@prisma/client';
import { randomBytes, scryptSync } from 'crypto';

const prisma = new PrismaClient();

/** Mirrors the API's scrypt password format (`salt:hash`) so demo logins work. */
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

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

const DEMO_PARENT_EMAIL = 'demo@familyos.app';
const DEMO_STUDENT_EMAIL = 'aarav@familyos.app';
const DEMO_PASSWORD = 'Demo@12345';

/** Seeds a ready-to-use demo family with sample data so dashboards aren't empty. */
async function seedDemo() {
  const parent = await prisma.user.upsert({
    where: { email: DEMO_PARENT_EMAIL },
    update: { isVerified: true },
    create: {
      email: DEMO_PARENT_EMAIL,
      passwordHash: hashPassword(DEMO_PASSWORD),
      name: 'Asha Sharma',
      role: 'PARENT',
      isVerified: true,
    },
  });

  let family = await prisma.family.findFirst({
    where: { name: 'The Sharma Family', members: { some: { userId: parent.id } } },
  });
  if (!family) {
    family = await prisma.family.create({ data: { name: 'The Sharma Family' } });
    await prisma.familyMember.create({
      data: { familyId: family.id, userId: parent.id, role: 'PARENT' },
    });
  }

  const childUser = await prisma.user.upsert({
    where: { email: DEMO_STUDENT_EMAIL },
    update: { isVerified: true },
    create: {
      email: DEMO_STUDENT_EMAIL,
      passwordHash: hashPassword(DEMO_PASSWORD),
      name: 'Aarav Sharma',
      role: 'STUDENT',
      isVerified: true,
    },
  });
  await prisma.familyMember.upsert({
    where: { familyId_userId: { familyId: family.id, userId: childUser.id } },
    update: {},
    create: { familyId: family.id, userId: childUser.id, role: 'CHILD' },
  });

  let student = await prisma.studentProfile.findUnique({ where: { userId: childUser.id } });
  if (!student) {
    student = await prisma.studentProfile.create({
      data: {
        userId: childUser.id,
        familyId: family.id,
        name: 'Aarav Sharma',
        class: 8,
        board: 'CBSE',
        school: 'Delhi Public School',
      },
    });
  }

  const hasSessions = await prisma.studySession.count({ where: { studentId: student.id } });
  if (hasSessions === 0) {
    const subject = await prisma.subject.findFirst({
      where: { code: 'MATH', class: 8, board: { code: 'CBSE' } },
    });
    if (subject) {
      for (let d = 0; d < 4; d++) {
        const date = new Date();
        date.setDate(date.getDate() - d);
        await prisma.studySession.create({
          data: {
            studentId: student.id,
            subjectId: subject.id,
            durationMinutes: 45 + d * 10,
            date,
          },
        });
      }
    }
    await prisma.studyGoal.create({ data: { studentId: student.id, targetMinutesPerDay: 90 } });
    await prisma.moodLog.create({
      data: { studentId: student.id, date: new Date(), mood: 'HAPPY' },
    });
    await prisma.foodLog.create({
      data: {
        studentId: student.id,
        date: new Date(),
        mealType: 'BREAKFAST',
        items: [{ name: 'Idli' }, { name: 'Sambar' }] as Prisma.InputJsonValue,
        isJunkFood: false,
      },
    });
  }

  const hasExpense = await prisma.expense.count({ where: { familyId: family.id } });
  if (hasExpense === 0) {
    const category = await prisma.expenseCategory.findFirst({ where: { name: 'Education' } });
    if (category) {
      await prisma.expense.create({
        data: {
          familyId: family.id,
          categoryId: category.id,
          amount: 1500,
          description: 'Textbooks',
          date: new Date(),
          loggedById: parent.id,
        },
      });
    }
  }

  console.log('\nDemo accounts (password for both): ' + DEMO_PASSWORD);
  console.log(`  Parent : ${DEMO_PARENT_EMAIL}`);
  console.log(`  Student: ${DEMO_STUDENT_EMAIL}`);
}

async function main() {
  console.log('Seeding FamilyOS reference data...');
  await seedBoardsAndSubjects();
  await seedSampleQuestions();
  await seedCategories();
  await seedDemo();
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
