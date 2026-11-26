import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  gradeOptions,
  validateCustomSubjectName,
  validateLessonRequest,
  validateRegistration,
  validateSignIn
} from '../shared/validation.js';
import { gradeLabel, subjectLabel, supportedLanguages } from '../shared/lessonTemplates.js';
import * as apiClient from './apiClient.js';
import { apiRequest } from './apiClient.js';
import { translations } from './translations.js';
import './styles.css';

const otherSubjectChoice = '__other__';
const languageStorageKey = 'teacher-assistant-language';
const emptyRegistration = { firstName: '', lastName: '', email: '', password: '' };
const emptySignIn = { email: '', password: '' };

const LanguageContext = createContext({ language: 'en', t: translations.en });
const useLanguage = () => useContext(LanguageContext);

function initialLanguage() {
  const savedLanguage = window.localStorage.getItem(languageStorageKey);
  if (supportedLanguages.includes(savedLanguage)) return savedLanguage;
  const browserLanguage = (navigator.language ?? '').slice(0, 2);
  return supportedLanguages.includes(browserLanguage) ? browserLanguage : 'kk';
}

function errorText(t, code) {
  return t.errors[code] ?? t.errors.unknown;
}

// Status messages are kept as { key, params } so they re-render in a newly chosen language.
function formatMessage(t, language, message) {
  const params = message.params ?? {};
  const values = {
    ...params,
    subject: params.subject === undefined ? undefined : subjectLabel(params.subject, language),
    grade: params.grade === undefined ? undefined : gradeLabel(params.grade, language),
    count: params.count === undefined ? undefined : t.planner.stageCount(params.count),
    reason: params.reasonCode ? errorText(t, params.reasonCode) : ''
  };
  return t.status[message.key].replace(/\{(\w+)\}/g, (placeholder, name) => values[name] ?? placeholder);
}

// The subject picker stores a list choice (a subject id) plus free text for "Other".
// These convert between that picker state and the API's subject objects.
function splitSubject(subject) {
  if (!subject) return { subjectChoice: '', customSubject: '' };
  return subject.isCustom
    ? { subjectChoice: otherSubjectChoice, customSubject: subject.name }
    : { subjectChoice: String(subject.id), customSubject: '' };
}

function subjectInput(subjectChoice, customSubject) {
  if (subjectChoice === otherSubjectChoice) return { name: customSubject.trim() };
  return subjectChoice ? { id: Number(subjectChoice) } : null;
}

function usePageTitle(pageTitle) {
  useEffect(() => {
    document.title = `${pageTitle} - Teacher Assistant`;
  }, [pageTitle]);
}

function StatusMessage({ message }) {
  const { language, t } = useLanguage();
  return <div className="status-message" role="status" aria-live="polite">{formatMessage(t, language, message)}</div>;
}

function FieldError({ id, code }) {
  const { t } = useLanguage();
  if (!code) return null;
  return <p className="field-error" id={id}>{t.errorPrefix}: {errorText(t, code)}</p>;
}

function TextField({ id, label, errorCode, inputRef, ...inputProps }) {
  const errorId = `${id}-error`;
  return (
    <div className="field-group">
      <label htmlFor={id}>{label}</label>
      <input
        ref={inputRef}
        id={id}
        aria-invalid={errorCode ? 'true' : 'false'}
        aria-describedby={errorCode ? errorId : undefined}
        {...inputProps}
      />
      <FieldError id={errorId} code={errorCode} />
    </div>
  );
}

function LanguageSwitcher({ language, onLanguageChange }) {
  const { t } = useLanguage();
  return (
    <nav className="language-switcher" aria-label={t.languagePicker}>
      {supportedLanguages.map((languageCode) => (
        <button
          key={languageCode}
          className="language-button"
          type="button"
          lang={languageCode}
          aria-pressed={language === languageCode ? 'true' : 'false'}
          onClick={() => onLanguageChange(languageCode)}
        >
          {translations[languageCode].languageName}
        </button>
      ))}
    </nav>
  );
}

function AuthPanel({ onAuthenticated }) {
  const { t } = useLanguage();
  const [mode, setMode] = useState('register');
  const [registration, setRegistration] = useState(emptyRegistration);
  const [signIn, setSignIn] = useState(emptySignIn);
  const [fieldErrors, setFieldErrors] = useState({});
  const [authMessage, setAuthMessage] = useState({ key: 'authIntro' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);
  const isRegistering = mode === 'register';

  function switchMode(nextMode) {
    setMode(nextMode);
    setFieldErrors({});
    setAuthMessage({ key: nextMode === 'register' ? 'authRegister' : 'authSignIn' });
  }

  // Re-validate an edited field so its error clears as soon as the value becomes valid.
  function updateField(fieldName, fieldValue) {
    const nextValues = { ...(isRegistering ? registration : signIn), [fieldName]: fieldValue };
    (isRegistering ? setRegistration : setSignIn)(nextValues);
    if (fieldErrors[fieldName]) {
      const { fieldErrors: nextErrors } = isRegistering ? validateRegistration(nextValues) : validateSignIn(nextValues);
      setFieldErrors((currentErrors) => ({ ...currentErrors, [fieldName]: nextErrors[fieldName] }));
    }
  }

  function focusFirstInvalidField(errors) {
    const firstFieldName = Object.keys(errors).find((fieldName) => errors[fieldName]);
    formRef.current?.querySelector(`[name="${firstFieldName}"]`)?.focus();
  }

  async function submitAuth(event) {
    event.preventDefault();
    if (isSubmitting) return;

    const { values, fieldErrors: validationErrors } = isRegistering
      ? validateRegistration(registration)
      : validateSignIn(signIn);
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setAuthMessage({ key: 'checkFields' });
      focusFirstInvalidField(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setAuthMessage({ key: isRegistering ? 'creating' : 'signingIn' });
    try {
      const { user } = await (isRegistering ? apiClient.register(values) : apiClient.signIn(values));
      onAuthenticated(user, { key: isRegistering ? 'welcomeNew' : 'welcomeBack', params: { name: user.firstName } });
    } catch (error) {
      setFieldErrors(error.fieldErrors);
      setAuthMessage({ key: 'plainError', params: { reasonCode: error.code } });
      focusFirstInvalidField(error.fieldErrors);
      setIsSubmitting(false);
    }
  }

  return (
    <section className="planner auth-panel" aria-labelledby="auth-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{t.auth.panelEyebrow}</p>
          <h2 id="auth-title">{isRegistering ? t.auth.registerTitle : t.auth.signInTitle}</h2>
        </div>
        <button
          className="link-button"
          type="button"
          onClick={() => switchMode(isRegistering ? 'signin' : 'register')}
        >
          {isRegistering ? t.auth.toSignIn : t.auth.toRegister}
        </button>
      </div>

      <form className="auth-form" ref={formRef} onSubmit={submitAuth} noValidate>
        {isRegistering && (
          <>
            <TextField
              id="first-name-input"
              name="firstName"
              label={t.auth.firstName}
              type="text"
              autoComplete="given-name"
              maxLength={50}
              value={registration.firstName}
              onChange={(event) => updateField('firstName', event.target.value)}
              errorCode={fieldErrors.firstName}
            />
            <TextField
              id="last-name-input"
              name="lastName"
              label={t.auth.lastName}
              type="text"
              autoComplete="family-name"
              maxLength={50}
              value={registration.lastName}
              onChange={(event) => updateField('lastName', event.target.value)}
              errorCode={fieldErrors.lastName}
            />
          </>
        )}
        <TextField
          id="email-input"
          name="email"
          label={t.auth.email}
          type="email"
          autoComplete="email"
          maxLength={120}
          value={isRegistering ? registration.email : signIn.email}
          onChange={(event) => updateField('email', event.target.value)}
          errorCode={fieldErrors.email}
        />
        <TextField
          id="password-input"
          name="password"
          label={t.auth.password}
          type="password"
          autoComplete={isRegistering ? 'new-password' : 'current-password'}
          maxLength={72}
          value={isRegistering ? registration.password : signIn.password}
          onChange={(event) => updateField('password', event.target.value)}
          errorCode={fieldErrors.password}
        />
        <div className="form-actions">
          <button className="button button-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? t.auth.wait : isRegistering ? t.auth.registerButton : t.auth.signInButton}
          </button>
        </div>
      </form>

      <StatusMessage message={authMessage} />
    </section>
  );
}

function AuthPage({ notice, onAuthenticated }) {
  const { language, t } = useLanguage();
  usePageTitle(t.pageTitles.auth);
  return (
    <main className="page-shell page-content auth-page">
      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">{t.auth.step}</p>
        <h1 id="page-title">{t.auth.heading}</h1>
        <p className="hero-copy">{t.auth.intro}</p>
      </section>
      {notice && (
        <div className="status-message status-error" role="alert">
          {t.errorPrefix}: {formatMessage(t, language, notice)}
        </div>
      )}
      <AuthPanel onAuthenticated={onAuthenticated} />
    </main>
  );
}

// A list of default subjects plus "Other", which reveals a text field for the teacher's own subject.
function SubjectPicker({ subjects, subjectChoice, customSubject, onChoiceChange, onCustomChange, errorCode, disabled }) {
  const { language, t } = useLanguage();
  const isOther = subjectChoice === otherSubjectChoice;
  const customInputRef = useRef(null);
  const wasOtherRef = useRef(isOther);

  // Move focus into the new text field only when the teacher switches to "Other".
  useEffect(() => {
    if (isOther && !wasOtherRef.current) customInputRef.current?.focus();
    wasOtherRef.current = isOther;
  }, [isOther]);

  return (
    <>
      <div className="field-group">
        <label htmlFor="subject-select">{t.planner.subject}</label>
        <select
          id="subject-select"
          name={isOther ? 'subjectChoice' : 'subject'}
          value={subjectChoice}
          onChange={(event) => onChoiceChange(event.target.value)}
          disabled={disabled}
          aria-invalid={errorCode && !isOther ? 'true' : 'false'}
          aria-describedby={errorCode && !isOther ? 'subject-select-error' : undefined}
        >
          {!subjectChoice && <option value="">{t.planner.selectSubject}</option>}
          {subjects.map((subject) => (
            <option key={subject.id} value={String(subject.id)}>{subjectLabel(subject, language)}</option>
          ))}
          <option value={otherSubjectChoice}>{t.planner.otherSubject}</option>
        </select>
        {!isOther && <FieldError id="subject-select-error" code={errorCode} />}
      </div>
      {isOther && (
        <TextField
          id="custom-subject-input"
          inputRef={customInputRef}
          name="subject"
          label={t.planner.customSubject}
          type="text"
          maxLength={50}
          placeholder={t.planner.customSubjectPlaceholder}
          value={customSubject}
          onChange={(event) => onCustomChange(event.target.value)}
          disabled={disabled}
          errorCode={errorCode}
        />
      )}
    </>
  );
}

function LessonPlanCard({ plan, subject, topic }) {
  const { language, t } = useLanguage();
  const details = [
    [t.planner.targetGrade, plan.targetGrade],
    [t.planner.objectives, plan.objectives],
    [t.planner.duration, plan.duration],
    [t.planner.activities, plan.activities]
  ];

  return (
    <article className="lesson-card">
      <h3>{plan.title}</h3>
      <p className="lesson-subject">{subjectLabel(subject, language)} | {topic}</p>
      <dl className="lesson-details">
        {details.map(([label, value]) => (
          <div className="detail-row" key={label}>
            <dt className="detail-label">{label}</dt>
            <dd className="detail-value">{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function LessonPlanner({ user, initialMessage, onUserUpdated }) {
  const { language, t } = useLanguage();
  const [subjectChoice, setSubjectChoice] = useState(() => splitSubject(user.subject).subjectChoice);
  const [customSubject, setCustomSubject] = useState(() => splitSubject(user.subject).customSubject);
  const [subjects, setSubjects] = useState([]);
  const [subjectError, setSubjectError] = useState('');
  const [isSavingSubject, setIsSavingSubject] = useState(false);
  const [grade, setGrade] = useState('');
  const [gradeError, setGradeError] = useState('');
  const [topic, setTopic] = useState('');
  const [topicError, setTopicError] = useState('');
  const [plans, setPlans] = useState([]);
  const [lastRequest, setLastRequest] = useState(null);
  const [planSubject, setPlanSubject] = useState(null);
  const [statusMessage, setStatusMessage] = useState(initialMessage);
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef(null);
  const recordCount = lastRequest ? t.planner.stageCount(plans.length) : t.planner.noPlans;

  // The default subject list comes from the subjects table.
  useEffect(() => {
    apiRequest('/api/subjects')
      .then(({ subjects: curriculumSubjects }) => setSubjects(curriculumSubjects))
      .catch((error) => setStatusMessage({ key: 'subjectsFailed', params: { reasonCode: error.code } }));
  }, []);

  // Default subjects save right away; "Other" waits until the typed subject is used to generate a plan.
  async function handleSubjectChoiceChange(nextChoice) {
    setSubjectChoice(nextChoice);
    setSubjectError('');
    if (nextChoice === otherSubjectChoice) {
      setStatusMessage({ key: 'typeSubject' });
      return;
    }
    const chosenSubject = subjects.find((subject) => String(subject.id) === nextChoice);
    if (!chosenSubject) {
      setSubjectError('subjectRequired');
      return;
    }
    if (chosenSubject.id === user.subject?.id) return;

    setIsSavingSubject(true);
    setStatusMessage({ key: 'savingSubject', params: { subject: chosenSubject } });
    try {
      const { user: updatedUser } = await apiRequest('/api/me/subject', { method: 'PUT', body: { subject: { id: chosenSubject.id } } });
      onUserUpdated(updatedUser);
      setStatusMessage({ key: 'subjectSaved', params: { subject: updatedUser.subject } });
    } catch (error) {
      setSubjectError(error.fieldErrors.subject ?? '');
      setStatusMessage({ key: 'subjectSaveFailed', params: { reasonCode: error.code } });
    } finally {
      setIsSavingSubject(false);
    }
  }

  function handleCustomSubjectChange(nextCustom) {
    setCustomSubject(nextCustom);
    if (subjectError) setSubjectError(validateCustomSubjectName(nextCustom.trim()));
  }

  function handleGradeChange(event) {
    const nextGrade = event.target.value;
    setGrade(nextGrade);
    setGradeError(gradeOptions.includes(nextGrade) ? '' : 'gradeInvalid');
  }

  function handleTopicChange(event) {
    setTopic(event.target.value);
    if (topicError) setTopicError(event.target.value.trim() ? '' : 'topicInvalid');
  }

  async function requestPlans(lessonRequest) {
    setIsLoading(true);
    setStatusMessage({ key: 'building' });
    try {
      const { modules, subject, user: updatedUser } = await apiRequest('/api/lesson-plans/generate', { method: 'POST', body: lessonRequest });
      setPlans(modules);
      setLastRequest(lessonRequest);
      setPlanSubject(subject);
      onUserUpdated(updatedUser);
      setStatusMessage({
        key: 'generated',
        params: { topic: lessonRequest.topic, grade: lessonRequest.grade, count: modules.length }
      });
    } catch (error) {
      setPlans([]);
      setLastRequest(null);
      setStatusMessage({ key: 'generateFailed', params: { reasonCode: error.code } });
    } finally {
      setIsLoading(false);
    }
  }

  // Rebuild an existing plan in the newly chosen language so the whole page matches it.
  useEffect(() => {
    if (lastRequest && lastRequest.language !== language && !isLoading) {
      requestPlans({ ...lastRequest, language });
    }
  }, [language]);

  async function handleGenerate(event) {
    event.preventDefault();
    if (isLoading || isSavingSubject) return;

    const { values, fieldErrors } = validateLessonRequest({
      subject: subjectInput(subjectChoice, customSubject),
      grade,
      topic,
      language
    });
    setSubjectError(fieldErrors.subject ?? '');
    setGradeError(fieldErrors.grade ?? '');
    setTopicError(fieldErrors.topic ?? '');

    const firstInvalidField = ['subject', 'grade', 'topic'].find((fieldName) => fieldErrors[fieldName]);
    if (firstInvalidField) {
      const messageKeys = { subject: 'fixSubject', grade: 'selectGrade', topic: 'enterTopic' };
      setStatusMessage({ key: messageKeys[firstInvalidField] });
      formRef.current?.querySelector(`[name="${firstInvalidField}"]`)?.focus();
      return;
    }

    await requestPlans(values);
  }

  return (
    <section className="planner" aria-labelledby="planner-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{t.planner.studioEyebrow}</p>
          <h2 id="planner-title">{t.planner.studioTitle}</h2>
        </div>
        <p className="record-count">{recordCount}</p>
      </div>

      <form className="plan-form" id="plan-form" ref={formRef} onSubmit={handleGenerate} noValidate>
        <SubjectPicker
          subjects={subjects}
          subjectChoice={subjectChoice}
          customSubject={customSubject}
          onChoiceChange={handleSubjectChoiceChange}
          onCustomChange={handleCustomSubjectChange}
          disabled={isSavingSubject}
          errorCode={subjectError}
        />
        <div className="field-group">
          <label htmlFor="grade-select">{t.planner.grade}</label>
          <select
            id="grade-select"
            name="grade"
            value={grade}
            onChange={handleGradeChange}
            aria-invalid={gradeError ? 'true' : 'false'}
            aria-describedby={gradeError ? 'grade-error' : undefined}
            aria-required="true"
          >
            <option value="">{t.planner.selectGrade}</option>
            {gradeOptions.map((gradeOption) => (
              <option key={gradeOption} value={gradeOption}>{gradeLabel(gradeOption, language)}</option>
            ))}
          </select>
          <FieldError id="grade-error" code={gradeError} />
        </div>
        <div className="field-group field-group-wide">
          <label htmlFor="topic-input">{t.planner.topic}</label>
          <input
            id="topic-input"
            name="topic"
            type="text"
            maxLength={80}
            placeholder={t.planner.topicPlaceholder}
            value={topic}
            onChange={handleTopicChange}
            aria-invalid={topicError ? 'true' : 'false'}
            aria-describedby={topicError ? 'topic-error' : undefined}
            aria-required="true"
          />
          <FieldError id="topic-error" code={topicError} />
        </div>
        <div className="form-actions">
          <button className="button button-primary" type="submit" disabled={isLoading}>
            {isLoading ? t.planner.generating : t.planner.generate}
          </button>
        </div>
      </form>

      <StatusMessage message={statusMessage} />
      <div className="card-grid" aria-live="polite" aria-label={t.planner.plansLabel}>
        {plans.map((plan) => (
          <LessonPlanCard key={plan.id} plan={plan} subject={planSubject} topic={lastRequest.topic} />
        ))}
      </div>
    </section>
  );
}

function PlannerPage({ user, initialMessage, onUserUpdated }) {
  const { t } = useLanguage();
  usePageTitle(t.pageTitles.planner);
  return (
    <main className="page-shell page-content">
      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">{t.planner.step}</p>
        <h1 id="page-title">{t.planner.heading}</h1>
        <p className="hero-copy">{t.planner.intro}</p>
      </section>
      <LessonPlanner user={user} initialMessage={initialMessage} onUserUpdated={onUserUpdated} />
    </main>
  );
}

function App() {
  const [language, setLanguage] = useState(initialLanguage);
  // undefined while the saved session is being checked, null when signed out.
  const [user, setUser] = useState(undefined);
  const [plannerMessage, setPlannerMessage] = useState({ key: 'checking' });
  const [authNotice, setAuthNotice] = useState(null);
  const t = translations[language];

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem(languageStorageKey, language);
  }, [language]);

  // Restore the session from the refresh cookie; a 401 simply means nobody is signed in.
  useEffect(() => {
    apiClient.onSessionExpired(() => {
      setAuthNotice({ key: 'plainError', params: { reasonCode: 'sessionExpired' } });
      setUser(null);
    });
    apiClient.refreshSession()
      .then(({ user: savedUser }) => {
        setPlannerMessage(savedUser.subject
          ? { key: 'welcomeBackSubject', params: { name: savedUser.firstName, subject: savedUser.subject } }
          : { key: 'welcomeBack', params: { name: savedUser.firstName } });
        setUser(savedUser);
      })
      .catch((error) => {
        setUser(null);
        if (error.status !== 401) setAuthNotice({ key: 'sessionFailed', params: { reasonCode: error.code } });
      });
  }, []);

  function handleAuthenticated(authenticatedUser, welcomeMessage) {
    setAuthNotice(null);
    setPlannerMessage(welcomeMessage);
    setUser(authenticatedUser);
    window.scrollTo(0, 0);
  }

  async function signOut() {
    try {
      await apiClient.signOut();
    } finally {
      setUser(null);
    }
  }

  return (
    <LanguageContext.Provider value={{ language, t }}>
      <header className="site-header">
        <div className="page-shell header-content">
          <a className="brand" href="/" aria-label={t.home}>
            <span className="brand-mark" aria-hidden="true">TA</span>
            <span>Teacher Assistant</span>
          </a>
          <div className="header-tools">
            <LanguageSwitcher language={language} onLanguageChange={setLanguage} />
            {user && (
              <div className="account-bar">
                <span className="account-name">{user.firstName} {user.lastName}</span>
                <button className="button button-secondary" type="button" onClick={signOut}>{t.signOut}</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {user === undefined && (
        <main className="page-shell page-content">
          <StatusMessage message={{ key: 'checking' }} />
        </main>
      )}
      {user === null && <AuthPage notice={authNotice} onAuthenticated={handleAuthenticated} />}
      {user && <PlannerPage user={user} initialMessage={plannerMessage} onUserUpdated={setUser} />}
    </LanguageContext.Provider>
  );
}

createRoot(document.getElementById('root')).render(<App />);
