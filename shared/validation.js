// Shared by the React frontend and the API server so both apply the same rules.
// Validators return error codes; the frontend turns each code into text in the chosen language.
import { supportedLanguages } from './lessonTemplates.js';

export const subjectOptions = ['Science', 'Mathematics', 'Language Arts', 'Social Studies', 'Art'];
export const gradeOptions = Array.from({ length: 11 }, (_, offset) => String(offset + 1));

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Custom subjects may use letters from any language, digits, spaces, and light punctuation.
const customSubjectPattern = /^[\p{L}\p{N}][\p{L}\p{N} .,'&()-]*$/u;

export function isDefaultSubject(subject) {
  return subjectOptions.includes(subject);
}

function readText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function readPassword(value) {
  return typeof value === 'string' ? value : '';
}

// Returns an error code, or an empty string when the subject is valid.
export function validateSubject(subject) {
  if (!subject) return 'subjectRequired';
  if (isDefaultSubject(subject)) return '';
  if (subject.length < 2 || subject.length > 50) return 'subjectLength';
  if (!customSubjectPattern.test(subject)) return 'subjectCharacters';
  return '';
}

export function validateRegistration(input) {
  const values = {
    firstName: readText(input.firstName),
    lastName: readText(input.lastName),
    email: readText(input.email).toLowerCase(),
    password: readPassword(input.password)
  };
  const fieldErrors = {};

  if (!values.firstName || values.firstName.length > 50) fieldErrors.firstName = 'firstNameInvalid';
  if (!values.lastName || values.lastName.length > 50) fieldErrors.lastName = 'lastNameInvalid';
  if (!emailPattern.test(values.email) || values.email.length > 120) fieldErrors.email = 'emailInvalid';
  if (values.password.length < 8 || values.password.length > 128) fieldErrors.password = 'passwordInvalid';

  return { values, fieldErrors };
}

export function validateSignIn(input) {
  const values = { email: readText(input.email).toLowerCase(), password: readPassword(input.password) };
  const fieldErrors = {};

  if (!emailPattern.test(values.email)) fieldErrors.email = 'signInEmail';
  if (!values.password) fieldErrors.password = 'signInPassword';

  return { values, fieldErrors };
}

export function validateLessonRequest(input) {
  const values = {
    subject: readText(input.subject),
    grade: readText(input.grade),
    topic: readText(input.topic),
    language: readText(input.language)
  };
  const fieldErrors = {};

  const subjectError = validateSubject(values.subject);
  if (subjectError) fieldErrors.subject = subjectError;
  if (!gradeOptions.includes(values.grade)) fieldErrors.grade = 'gradeInvalid';
  if (!values.topic || values.topic.length > 80) fieldErrors.topic = 'topicInvalid';
  if (!supportedLanguages.includes(values.language)) fieldErrors.language = 'languageInvalid';

  return { values, fieldErrors };
}
