// Subjects come from the `subjects` table; a teacher's subjects are linked through `teacher_subjects`.
// The most recently assigned link is the subject the planner preselects.
import { randomBytes } from 'node:crypto';
import { prisma, isUniqueViolation } from './prisma.js';
import { RequestError } from './http.js';

const customCodePrefix = 'CUSTOM_';

export function toPublicSubject(subject) {
  if (!subject) return null;
  return { id: subject.id, code: subject.code, name: subject.name, isCustom: subject.code.startsWith(customCodePrefix) };
}

// Curriculum subjects only; subjects typed by teachers are not offered to everyone.
export async function listCurriculumSubjects() {
  const subjects = await prisma.subject.findMany({
    where: { NOT: { code: { startsWith: customCodePrefix } } },
    orderBy: { id: 'asc' }
  });
  return subjects.map(toPublicSubject);
}

export async function currentSubject(userId) {
  const link = await prisma.teacherSubject.findFirst({
    where: { userId },
    orderBy: { assignedAt: 'desc' },
    include: { subject: true }
  });
  return link?.subject ?? null;
}

async function findOrCreateCustomSubject(name) {
  const existing = await prisma.subject.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } });
  if (existing) return existing;
  try {
    const code = `${customCodePrefix}${randomBytes(4).toString('hex').toUpperCase()}`;
    return await prisma.subject.create({ data: { code, name } });
  } catch (error) {
    // Another teacher created the same name at the same moment; use their row.
    if (!isUniqueViolation(error)) throw error;
    return prisma.subject.findFirstOrThrow({ where: { name: { equals: name, mode: 'insensitive' } } });
  }
}

// `subjectInput` is validated { id } or { name } (see shared/validation.js).
export async function resolveSubject(subjectInput) {
  if (subjectInput.id) {
    const subject = await prisma.subject.findUnique({ where: { id: subjectInput.id } });
    if (!subject) throw new RequestError(400, 'checkFields', { fieldErrors: { subject: 'subjectUnknown' } });
    return subject;
  }
  return findOrCreateCustomSubject(subjectInput.name);
}

export async function assignSubject(userId, subjectId) {
  await prisma.teacherSubject.upsert({
    where: { userId_subjectId: { userId, subjectId } },
    update: { assignedAt: new Date() },
    create: { userId, subjectId }
  });
}
