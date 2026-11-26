// Shared by the React frontend and the API server so both apply the same rules.
// Validators return error codes; the frontend turns each code into text in the chosen language.
import { supportedLanguages } from './lessonTemplates.js';

export const gradeOptions = Array.from({ length: 11 }, (_, offset) => String(offset + 1));

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Custom subjects may use letters from any language, digits, spaces, and light punctuation.
const customSubjectPattern = /^[\p{L}\p{N}][\p{L}\p{N} .,'&()-]*$/u;

function readText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function readPassword(value) {
  return typeof value === 'string' ? value : '';
}

// Returns an error code, or an empty string when a typed ("Other") subject name is valid.
export function validateCustomSubjectName(name) {
  if (!name) return 'subjectRequired';
  if (name.length < 2 || name.length > 50) return 'subjectLength';
  if (!customSubjectPattern.test(name)) return 'subjectCharacters';
  return '';
}

// A subject is either { id } of a row in the subjects table or { name } typed by the teacher.
export function validateSubjectInput(input) {
  if (input && Number.isInteger(input.id) && input.id > 0) return { value: { id: input.id }, error: '' };
  const name = readText(input?.name);
  const error = validateCustomSubjectName(name);
  return { value: error ? null : { name }, error };
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
  // bcrypt only uses the first 72 bytes, so longer passwords are rejected instead of silently truncated.
  if (values.password.length < 8 || new TextEncoder().encode(values.password).length > 72) fieldErrors.password = 'passwordInvalid';

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
  const { value: subject, error: subjectError } = validateSubjectInput(input.subject);
  const values = {
    subject,
    grade: readText(input.grade),
    topic: readText(input.topic),
    language: readText(input.language)
  };
  const fieldErrors = {};

  if (subjectError) fieldErrors.subject = subjectError;
  if (!gradeOptions.includes(values.grade)) fieldErrors.grade = 'gradeInvalid';
  if (!values.topic || values.topic.length > 80) fieldErrors.topic = 'topicInvalid';
  if (!supportedLanguages.includes(values.language)) fieldErrors.language = 'languageInvalid';

  return { values, fieldErrors };
}
