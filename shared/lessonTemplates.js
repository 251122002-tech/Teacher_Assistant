// Lesson-plan content in every supported language. Shared so the server builds plans and the
// frontend shows subject names from one source.
export const supportedLanguages = ['kk', 'ru', 'en'];

// Names for the curriculum subjects in prisma/seed.sql, keyed by subjects.code.
// Subjects without an entry (for example a teacher's own subject) show their stored name.
export const subjectNames = {
  MATH: { kk: 'Математика', ru: 'Математика', en: 'Mathematics' },
  PHYS: { kk: 'Физика', ru: 'Физика', en: 'Physics' },
  KAZ_LANG: { kk: 'Қазақ тілі', ru: 'Казахский язык', en: 'Kazakh Language' },
  HIST: { kk: 'Тарих', ru: 'История', en: 'History' },
  BIO: { kk: 'Биология', ru: 'Биология', en: 'Biology' },
  INF: { kk: 'Информатика', ru: 'Информатика', en: 'Informatics' },
  ENG: { kk: 'Ағылшын тілі', ru: 'Английский язык', en: 'English' },
  GEO: { kk: 'География', ru: 'География', en: 'Geography' },
  CHEM: { kk: 'Химия', ru: 'Химия', en: 'Chemistry' },
  PRIMARY: { kk: 'Бастауыш білім', ru: 'Начальное образование', en: 'Primary Education' }
};

// `subject` is a { code, name } object from the API.
export function subjectLabel(subject, language) {
  if (!subject) return '';
  return subjectNames[subject.code]?.[language] ?? subject.name;
}

export function gradeLabel(grade, language) {
  if (language === 'kk') return `${grade}-сынып`;
  if (language === 'ru') return `${grade} класс`;
  return `Grade ${grade}`;
}

function minutesLabel(minutes, language) {
  return language === 'en' ? `${minutes} minutes` : `${minutes} минут`;
}

// One 45-minute lesson split into six stages.
const lessonStages = [
  {
    minutes: 5,
    kk: {
      title: 'Сабаққа кіріспе',
      objectives: '«{topic}» тақырыбы бойынша оқушылардың бұрынғы білімін еске түсіру.',
      activities: 'Қысқа сұрақ-жауап: оқушылар «{topic}» туралы не білетінін айтады, негізгі сөздер тақтаға жазылады.'
    },
    ru: {
      title: 'Введение в урок',
      objectives: 'Актуализировать знания учащихся по теме «{topic}».',
      activities: 'Короткий опрос: ученики рассказывают, что уже знают о теме «{topic}», ключевые слова записываются на доске.'
    },
    en: {
      title: 'Lesson warm-up',
      objectives: 'Activate what students already know about "{topic}".',
      activities: 'Quick question round: students share what they know about "{topic}"; key words go on the board.'
    }
  },
  {
    minutes: 10,
    kk: {
      title: 'Жаңа материал',
      objectives: '«{subject}» пәні бойынша «{topic}» тақырыбының негізгі ұғымдарын түсіну.',
      activities: 'Мұғалім {gradeNumber}-сынып оқушыларына түсінікті мысалдармен негізгі ұғымдарды түсіндіреді, оқушылар қысқаша жазып алады.'
    },
    ru: {
      title: 'Новый материал',
      objectives: 'Понять основные понятия темы «{topic}» по предмету «{subject}».',
      activities: 'Учитель объясняет ключевые понятия на примерах, понятных ученикам {gradeNumber} класса; ученики делают краткие записи.'
    },
    en: {
      title: 'New material',
      objectives: 'Understand the key ideas of "{topic}" in {subject}.',
      activities: 'The teacher explains the key ideas with examples suited to grade {gradeNumber}; students take short notes.'
    }
  },
  {
    minutes: 10,
    kk: {
      title: 'Мұғаліммен бірге жаттығу',
      objectives: 'Жаңа білімді мұғалімнің қолдауымен қолдану.',
      activities: 'Оқушылар жұпта «{topic}» бойынша тапсырмалар орындайды, мұғалім тексеріп, кеңес береді.'
    },
    ru: {
      title: 'Практика с учителем',
      objectives: 'Применить новые знания при поддержке учителя.',
      activities: 'Ученики в парах выполняют задания по теме «{topic}», учитель проверяет и подсказывает.'
    },
    en: {
      title: 'Guided practice',
      objectives: 'Apply the new knowledge with teacher support.',
      activities: 'Students work in pairs on tasks about "{topic}" while the teacher checks and gives hints.'
    }
  },
  {
    minutes: 10,
    kk: {
      title: 'Топтық жұмыс',
      objectives: 'Бірлесіп жұмыс істеу дағдысын дамыту және «{topic}» тақырыбын тереңірек түсіну.',
      activities: 'Топтар «{topic}» тақырыбының бір қыры бойынша постер немесе қысқа таныстырылым дайындайды.'
    },
    ru: {
      title: 'Групповая работа',
      objectives: 'Развивать навыки сотрудничества и углубить понимание темы «{topic}».',
      activities: 'Группы готовят постер или короткую презентацию об одном аспекте темы «{topic}».'
    },
    en: {
      title: 'Group work',
      objectives: 'Build collaboration skills and deepen understanding of "{topic}".',
      activities: 'Groups prepare a poster or short presentation on one aspect of "{topic}".'
    }
  },
  {
    minutes: 5,
    kk: {
      title: 'Бағалау',
      objectives: '«{topic}» тақырыбын түсіну деңгейін тексеру.',
      activities: 'Оқушылар 3–5 сұрақтан тұратын қысқа тест орындайды және бағалау критерийлері бойынша бір-бірін тексереді.'
    },
    ru: {
      title: 'Оценивание',
      objectives: 'Проверить понимание темы «{topic}».',
      activities: 'Ученики выполняют короткий тест из 3–5 вопросов и проверяют друг друга по критериям оценивания.'
    },
    en: {
      title: 'Assessment',
      objectives: 'Check how well students understand "{topic}".',
      activities: 'Students complete a 3–5 question quiz and peer-check each other against the success criteria.'
    }
  },
  {
    minutes: 5,
    kk: {
      title: 'Рефлексия',
      objectives: 'Сабақта не үйренгенін ой елегінен өткізу және келесі қадамды белгілеу.',
      activities: 'Оқушылар «Бүгін мен ... үйрендім» және «Мен әлі ... білгім келеді» сөйлемдерін аяқтайды.'
    },
    ru: {
      title: 'Рефлексия',
      objectives: 'Осмыслить изученное и наметить следующие шаги.',
      activities: 'Ученики заканчивают предложения «Сегодня я узнал(а)…» и «Я ещё хочу узнать…».'
    },
    en: {
      title: 'Reflection',
      objectives: 'Reflect on what was learned and set next steps.',
      activities: 'Students finish the sentences "Today I learned..." and "I still want to know...".'
    }
  }
];

function fillTemplate(template, values) {
  return template.replace(/\{(\w+)\}/g, (placeholder, name) => values[name] ?? placeholder);
}

export function buildLessonModules({ subject, grade, topic, language }) {
  const values = { topic, subject: subjectLabel(subject, language), gradeNumber: grade };
  return lessonStages.map((stage, index) => {
    const text = stage[language];
    return {
      id: index + 1,
      title: `${index + 1}. ${text.title}`,
      targetGrade: gradeLabel(grade, language),
      objectives: fillTemplate(text.objectives, values),
      duration: minutesLabel(stage.minutes, language),
      activities: fillTemplate(text.activities, values)
    };
  });
}
