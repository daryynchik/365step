import type { Course, Lesson, Question, TheoryBlock, Unit, WritingTask } from "./types";

/**
 * Seminar: a year-long reading and writing course in the spirit of AP Seminar,
 * built around one book — Mary Shelley's Frankenstein (1818, public domain).
 *
 * Twelve months, one unit each. Every unit has the same three steps:
 *   1. Read   — a stretch of the novel, a reading guide, questions on a passage
 *   2. Skill  — one AP Seminar skill (QUEST: question, understand, evaluate,
 *               synthesize, transmit), practised on the same chapters
 *   3. Write  — a piece of writing that uses the skill, with a rubric
 *
 * Quotations are taken verbatim from the Project Gutenberg text in
 * src/content/frankenstein.json; ellipses mark omissions.
 */

interface MonthSpec {
  month: number;
  title: string;
  subtitle: string;
  read: {
    sections: string[];
    label: string;
    guide: string[];
    intro: string;
    questions: Question[];
  };
  skill: {
    title: string;
    summary: string;
    theory: TheoryBlock[];
    questions: Question[];
  };
  write: {
    title: string;
    summary: string;
    theory: TheoryBlock[];
    task: WritingTask;
  };
}

function month(spec: MonthSpec): Unit {
  const id = `month-${spec.month}`;
  const lessons: Lesson[] = [
    {
      id: `m${spec.month}-read`,
      title: `Читаем: ${spec.read.label}`,
      summary: "Чтение и вопросы по тексту",
      minutes: 40,
      reading: { sections: spec.read.sections, guide: spec.read.guide },
      theory: [{ body: spec.read.intro }],
      questions: spec.read.questions,
    },
    {
      id: `m${spec.month}-skill`,
      title: spec.skill.title,
      summary: spec.skill.summary,
      minutes: 15,
      theory: spec.skill.theory,
      questions: spec.skill.questions,
    },
    {
      id: `m${spec.month}-write`,
      title: spec.write.title,
      summary: spec.write.summary,
      minutes: 30,
      theory: spec.write.theory,
      questions: [],
      writing: spec.write.task,
    },
  ];
  return { id, title: `Месяц ${spec.month} · ${spec.title}`, subtitle: spec.subtitle, lessons };
}

const choice = (
  prompt: string,
  options: string[],
  answer: number,
  explanation: string,
  passage?: string,
): Question => ({
  kind: "choice",
  prompt,
  options,
  answer,
  explanation,
  passages: passage ? [{ text: passage }] : undefined,
});

const BASE_RUBRIC = [
  "Первое предложение — ясное утверждение, с которым можно поспорить",
  "Каждая цитата подведена: кто говорит и в какой момент",
  "После каждой цитаты — 1–2 предложения разбора: что она доказывает",
  "Ссылка на главу после цитаты: (Ch. 5) или (Letter 4)",
];

const MONTHS: MonthSpec[] = [
  // ------------------------------------------------------------------- 1 --
  {
    month: 1,
    title: "Письма Уолтона",
    subtitle: "Рамка романа и первые вопросы",
    read: {
      sections: ["letter-1", "letter-2", "letter-3", "letter-4"],
      label: "письма 1–4",
      intro:
        "Роман начинается не с Франкенштейна, а с писем капитана Роберта Уолтона сестре. Уолтон ведёт корабль к Северному полюсу и мечтает о славе первооткрывателя. Во льдах команда поднимает на борт измученного незнакомца — и тот решает рассказать свою историю. Читай письма как вступление ко всему роману: Уолтон и незнакомец похожи сильнее, чем кажется.",
      guide: [
        "Чего хочет Уолтон и чем он готов ради этого рискнуть?",
        "Чего ему не хватает в экспедиции (письмо 2)?",
        "Что команда видит на льду перед тем, как найти незнакомца?",
        "Зачем незнакомец соглашается рассказать о себе (конец письма 4)?",
      ],
      questions: [
        choice(
          "In this passage, Walton justifies his voyage mainly by pointing to",
          [
            "the benefit his discoveries could bring to all of humanity",
            "the wealth he expects to gain from new trade routes",
            "the encouragement he has received from his sister",
            "the orders he has been given by his government",
          ],
          0,
          "Уолтон говорит об «inestimable benefit… on all mankind, to the last generation». Его оправдание — польза для всего человечества. Это важно: так же будет рассуждать и Виктор.",
          "“But supposing all these conjectures to be false, you cannot contest the inestimable benefit which I shall confer on all mankind, to the last generation, by discovering a passage near the pole to those countries, to reach which at present so many months are requisite; or by ascertaining the secret of the magnet, which, if at all possible, can only be effected by an undertaking such as mine.” (Letter 1)",
        ),
        choice(
          "The stranger compares Walton's wishes to “a serpent” mainly to suggest that",
          [
            "getting what one desires can turn out to be harmful",
            "Walton is not being honest about his goals",
            "the Arctic is full of dangerous animals",
            "knowledge and wisdom are impossible to obtain",
          ],
          0,
          "Змея, которая жалит, — образ желания, обернувшегося бедой. Незнакомец предупреждает: исполненное желание может навредить, «as mine has been».",
          "“You seek for knowledge and wisdom, as I once did; and I ardently hope that the gratification of your wishes may not be a serpent to sting you, as mine has been.” (Letter 4)",
        ),
        choice(
          "According to Letter 4, why does the stranger decide to tell Walton his story?",
          [
            "He sees that Walton is pursuing the same dangerous course and hopes the story will guide him.",
            "He wants Walton to make him famous in England.",
            "He wants Walton to turn the ship around immediately.",
            "Walton offers to pay him for an account of his travels.",
          ],
          0,
          "Незнакомец говорит прямо: «you are pursuing the same course… you may deduce an apt moral from my tale». Вся история Виктора рассказана как предупреждение.",
        ),
      ],
    },
    skill: {
      title: "Навык: задавать вопросы",
      summary: "Фактические, аналитические, исследовательские",
      theory: [
        {
          body:
            "AP Seminar построен на рамке **QUEST**: Question and Explore, Understand and Analyze, Evaluate Multiple Perspectives, Synthesize Ideas, Team, Transform, Transmit. Всё начинается с вопроса. Хороший вопрос определяет, будет ли работа пересказом или исследованием.",
        },
        {
          heading: "Три уровня вопросов",
          body:
            "• **Фактический** — ответ есть в тексте: «Куда плывёт Уолтон?»\n• **Аналитический** — требует толкования: «Почему Шелли начинает роман с писем Уолтона?»\n• **Исследовательский** — выходит за рамки книги и допускает спор: «В какой мере научные амбиции должны ограничиваться возможным вредом для общества?»",
        },
        {
          heading: "Аннотация, а не пересказ",
          body:
            "Пометка на полях полезна, если в ней есть мысль. «Уолтон в Петербурге» — пересказ. «Уолтон повторяет “never before” — ему важнее быть первым, чем вернуться живым» — анализ.",
        },
      ],
      questions: [
        choice(
          "Which is the strongest analytical question about Letters 1–4?",
          [
            "Where is Walton's ship when he writes Letter 1?",
            "Why does Shelley open the novel with Walton's letters instead of Victor's own story?",
            "How many letters does Walton write to his sister?",
            "What is the weather like in the Arctic?",
          ],
          1,
          "Ответ на B нельзя найти в одной строке — его нужно доказывать. Остальные вопросы фактические.",
        ),
        choice(
          "Which research question would work best as the basis for an argument paper?",
          [
            "What is Frankenstein about?",
            "To what extent should scientific ambition be limited by its possible risks to society?",
            "When was Frankenstein first published?",
            "Is science good?",
          ],
          1,
          "Хороший исследовательский вопрос открытый, спорный и достаточно узкий. «Is science good?» слишком широк, A и C — фактические.",
        ),
        choice(
          "Which annotation shows analysis rather than summary?",
          [
            "Walton is in St. Petersburg.",
            "Walton repeats “never before” — being first seems to matter more to him than being safe.",
            "This is the first letter.",
            "A very long paragraph.",
          ],
          1,
          "Только B делает вывод о характере Уолтона из выбора слов. Это и есть анализ.",
        ),
      ],
    },
    write: {
      title: "Пишем: вопросы к тексту",
      summary: "Три вопроса и один ответ",
      theory: [
        {
          body:
            "Сначала составь три **аналитических** вопроса к письмам Уолтона. Потом выбери один и ответь на него абзацем с цитатой. Пиши по-английски — так же, как на экзаменах AP.",
        },
      ],
      task: {
        prompt:
          "Write three analytical questions about Letters 1–4. Then choose one question and answer it in a paragraph that uses at least one quotation from the letters.",
        minWords: 120,
        maxWords: 260,
        rubric: [
          "Три вопроса, на которые нельзя ответить одной цитатой",
          "Абзац-ответ начинается с ясного утверждения",
          "Одна цитата со ссылкой (Letter 1–4)",
          "Объяснено, как цитата подтверждает ответ",
        ],
        starters: [
          "Why does Walton…",
          "Walton's letters suggest that…",
          "This shows that…",
        ],
        checks: { quotes: 1 },
      },
    },
  },

  // ------------------------------------------------------------------- 2 --
  {
    month: 2,
    title: "Как рождается одержимость",
    subtitle: "Детство Виктора, Агриппа, Ингольштадт",
    read: {
      sections: ["chapter-1", "chapter-2", "chapter-3"],
      label: "главы 1–3",
      intro:
        "Виктор начинает рассказ с детства: счастливая семья, Элизабет, друг Клерваль. Потом — случайно найденная книга Корнелия Агриппы, смерть матери и отъезд в университет Ингольштадта, где лекция профессора Вальдмана решает его судьбу. Следи, как Виктор-рассказчик ищет момент, когда всё пошло не так.",
      guide: [
        "Как Виктор описывает своё детство и родителей?",
        "Что происходит, когда он показывает отцу книгу Агриппы?",
        "Как по-разному с ним говорят профессора Кремпе и Вальдман?",
        "Какие слова Виктор использует, говоря о «судьбе»?",
      ],
      questions: [
        choice(
          "In this passage, Victor presents his father's reaction to the book mainly as",
          [
            "a missed chance that might have turned him away from the path that ruined him",
            "proof that his father did not care about his education",
            "a sensible warning that Victor wisely followed",
            "the reason Victor decided to study modern chemistry",
          ],
          0,
          "Виктор пишет: если бы отец объяснил, он бы «thrown Agrippa aside». Мимолётный взгляд отца стал упущенной возможностью, а не мудрым советом (C).",
          "“If, instead of this remark, my father had taken the pains to explain to me that the principles of Agrippa had been entirely exploded… I should certainly have thrown Agrippa aside… It is even possible that the train of my ideas would never have received the fatal impulse that led to my ruin.” (Ch. 2)",
        ),
        choice(
          "The repetition in “one thought, one conception, one purpose” mainly emphasizes",
          [
            "how completely a single goal takes over Victor's mind",
            "how confused Victor is by the lecture",
            "how dull the professor's lecture is",
            "how many different interests Victor has",
          ],
          0,
          "Тройной повтор «one» показывает сужение: всё многообразие интересов превращается в одну цель.",
          "“…one by one the various keys were touched which formed the mechanism of my being; chord after chord was sounded, and soon my mind was filled with one thought, one conception, one purpose. So much has been done, exclaimed the soul of Frankenstein—more, far more, will I achieve…” (Ch. 3)",
        ),
        choice(
          "Victor calls the professor's speech “the words of the fate—enounced to destroy me.” This shows that Victor, as the older narrator,",
          [
            "sees this moment as a turning point that led to his ruin",
            "believes the professor intended to harm him",
            "remembers the lecture as an enjoyable experience",
            "does not clearly remember what the professor said",
          ],
          0,
          "Взрослый Виктор смотрит назад и видит в лекции роковую точку. Это не обвинение профессора (B), а взгляд рассказчика, который знает финал.",
        ),
      ],
    },
    skill: {
      title: "Навык: утверждение, доказательство, разбор",
      summary: "Claim — evidence — commentary",
      theory: [
        {
          body:
            "Любой аналитический абзац состоит из трёх частей.\n\n• **Claim** — утверждение, с которым можно не согласиться.\n• **Evidence** — цитата или факт из текста.\n• **Commentary** — объяснение, **как** доказательство подтверждает утверждение. Это самая важная и самая частая слабая часть.",
        },
        {
          heading: "Типичные ошибки",
          body:
            "• Пересказ вместо утверждения: «В главе 2 Виктор находит книгу».\n• **Quote dumping** — цитаты подряд без разбора.\n• Разбор, который повторяет цитату другими словами вместо объяснения её значения.",
        },
        {
          heading: "Формула разбора",
          body:
            "После цитаты ответь на два вопроса: **что** здесь происходит на уровне слов и **почему** это важно для твоего утверждения. «Слово “fatal” показывает, что… Это значит, что…»",
        },
      ],
      questions: [
        choice(
          "Which of the following is an arguable claim?",
          [
            "Victor studies at the University of Ingolstadt.",
            "Victor's father's careless dismissal of Agrippa feeds Victor's obsession instead of ending it.",
            "Chapter 2 describes Victor's childhood.",
            "Frankenstein was written by Mary Shelley.",
          ],
          1,
          "С B можно спорить, и её нужно доказывать. Остальные — факты.",
        ),
        choice(
          "Which sentence is commentary rather than evidence?",
          [
            "Victor's father says, “it is sad trash.”",
            "His father calls the book “sad trash.”",
            "Because his father dismisses the book without explaining why, Victor's curiosity goes unchallenged and grows into obsession.",
            "Chapter 2 begins in Geneva.",
          ],
          2,
          "C объясняет, что значит реакция отца и к чему она ведёт. A и B — сама цитата, D — факт.",
        ),
        choice(
          "Which approach best avoids “quote dumping”?",
          [
            "A paragraph made of three long quotations in a row",
            "A quotation introduced with context and followed by two sentences that explain its meaning and significance",
            "A quotation placed at the end of a paragraph with no comment",
            "A summary of the chapter with no quotations",
          ],
          1,
          "Цитата живёт только с подводкой и разбором. B — правильная модель.",
        ),
      ],
    },
    write: {
      title: "Пишем: аналитический абзац",
      summary: "Claim, две цитаты, разбор",
      theory: [
        {
          body:
            "Напиши один аналитический абзац по модели claim → evidence → commentary. Две цитаты из глав 1–3, после каждой — разбор.",
        },
      ],
      task: {
        prompt: "What turns Victor's curiosity into obsession in Chapters 1–3? Answer in one analytical paragraph.",
        minWords: 150,
        maxWords: 260,
        rubric: BASE_RUBRIC,
        starters: [
          "Victor's obsession grows not from… but from…",
          "When Victor describes…, the word “…” suggests…",
          "This matters because…",
        ],
        checks: { quotes: 2 },
      },
    },
  },

  // ------------------------------------------------------------------- 3 --
  {
    month: 3,
    title: "Создание",
    subtitle: "Мечта и её цена",
    read: {
      sections: ["chapter-4", "chapter-5"],
      label: "главы 4–5",
      intro:
        "Два года Виктор работает в одиночестве, почти не спит и не пишет родным. Глава 4 — восторг открытия. Глава 5 — ночь, когда существо открывает глаза. Самое интересное здесь — резкий контраст между ожиданием и результатом и то, как быстро Виктор отказывается от ответственности.",
      guide: [
        "Каким Виктор представляет себе будущее «нового вида» (глава 4)?",
        "Что происходит с его здоровьем и связями с семьёй во время работы?",
        "Как меняются его чувства в момент, когда работа закончена?",
        "Что делает существо, когда впервые видит Виктора, и как тот реагирует?",
      ],
      questions: [
        choice(
          "In this passage, Victor's main motivation appears to be",
          [
            "the gratitude and glory he expects to receive as a creator",
            "a wish to help his family recover from his mother's death",
            "the money he hopes to earn from his discovery",
            "the instructions of his professors",
          ],
          0,
          "«A new species would bless me as its creator»; «No father could claim the gratitude of his child so completely». Виктор думает о благодарности и славе.",
          "“Life and death appeared to me ideal bounds, which I should first break through, and pour a torrent of light into our dark world. A new species would bless me as its creator and source; many happy and excellent natures would owe their being to me. No father could claim the gratitude of his child so completely as I should deserve theirs.” (Ch. 4)",
        ),
        choice(
          "The contrast between “an ardour that far exceeded moderation” and “breathless horror and disgust” mainly shows that",
          [
            "Victor's feelings reverse completely the moment he achieves his goal",
            "Victor was never really interested in his work",
            "Victor is pleased but tired after finishing",
            "Victor had expected to fail",
          ],
          0,
          "Страсть без меры сменяется отвращением мгновенно — «now that I had finished». Это ключевой поворот романа.",
          "“I had worked hard for nearly two years, for the sole purpose of infusing life into an inanimate body. For this I had deprived myself of rest and health. I had desired it with an ardour that far exceeded moderation; but now that I had finished, the beauty of the dream vanished, and breathless horror and disgust filled my heart.” (Ch. 5)",
        ),
        choice(
          "Victor notes that the creature stretched out a hand “seemingly to detain me” and that “he might have spoken, but I did not hear.” These details suggest that",
          [
            "the creature may not have meant harm, and Victor abandons it before learning its intentions",
            "the creature attacked Victor as soon as it woke",
            "Victor wanted to begin teaching the creature immediately",
            "Victor was still asleep and dreaming",
          ],
          0,
          "Протянутая рука и попытка заговорить — жесты контакта, не нападения. Виктор сам признаёт, что не услышал. Это ранний повод спорить, кто виноват в дальнейшем.",
        ),
      ],
    },
    skill: {
      title: "Навык: как автор строит смысл",
      summary: "Лексика, образы, контраст, тон",
      theory: [
        {
          body:
            "В AP Seminar анализ — это ответ на вопрос **как** текст производит эффект, а не только **что** в нём сказано. Главные инструменты автора:",
        },
        {
          heading: "Инструменты",
          body:
            "• **Diction** — выбор слов: «wretch» и «creature» говорят о существе по-разному.\n• **Imagery** — образы: свет и тьма, лёд и огонь.\n• **Contrast** — столкновение противоположностей: мечта и ужас.\n• **Tone** — отношение говорящего: восторг, отвращение, ирония.",
        },
        {
          heading: "Line of reasoning",
          body:
            "Линия рассуждения — это последовательность утверждений, которая ведёт к выводу. У аргумента она есть, у набора наблюдений — нет. В твоих работах каждый абзац должен быть шагом этой линии.",
        },
      ],
      questions: [
        choice(
          "In “pour a torrent of light into our dark world,” the light and dark imagery mainly conveys",
          [
            "Victor's view of himself as someone who will bring enlightenment to humanity",
            "Victor's fear of working at night",
            "the weather in Ingolstadt",
            "Victor's doubts about his project",
          ],
          0,
          "Свет — знание, тьма — невежество человечества. Виктор видит себя спасителем, несущим свет.",
        ),
        choice(
          "Which word best describes the tone of Victor's account of the creature's first night in Chapter 5?",
          ["Horrified", "Proud", "Indifferent", "Humorous"],
          0,
          "«Horror», «disgust», «wretch», «miserable monster» — лексика ужаса и отвращения.",
        ),
        choice(
          "A “line of reasoning” is best described as",
          [
            "the logical sequence of claims and evidence that leads to a conclusion",
            "a list of the best quotations from a text",
            "a summary of the plot",
            "the author's biography",
          ],
          0,
          "Линия рассуждения — это порядок шагов к выводу. Список цитат или пересказ ею не являются.",
        ),
      ],
    },
    write: {
      title: "Пишем: анализ приёма",
      summary: "Как Шелли использует контраст",
      theory: [
        {
          body:
            "Выбери один приём (контраст, образ света и тьмы, лексику Виктора) и покажи, как Шелли с его помощью создаёт смысл в главах 4–5. Не пересказывай сцену: объясняй, что делает приём.",
        },
      ],
      task: {
        prompt:
          "How does Shelley use contrast between hope and horror in Chapters 4–5 to shape the reader's view of Victor? Write one analytical paragraph.",
        minWords: 150,
        maxWords: 280,
        rubric: [...BASE_RUBRIC, "Назван конкретный приём и объяснено, какой эффект он создаёт"],
        starters: ["Shelley contrasts… with… to show…", "The shift from “…” to “…” reveals…"],
        checks: { quotes: 2 },
      },
    },
  },

  // ------------------------------------------------------------------- 4 --
  {
    month: 4,
    title: "Суд над Жюстиной",
    subtitle: "Доказательства и справедливость",
    read: {
      sections: ["chapter-6", "chapter-7", "chapter-8"],
      label: "главы 6–8",
      intro:
        "Виктор выздоравливает и возвращается домой после страшного известия: убит его младший брат Уильям. В убийстве обвиняют служанку Жюстину. Виктор знает, кто настоящий убийца, — и молчит. Это первая глава романа, где речь идёт о доказательствах, вине и правосудии.",
      guide: [
        "Какие улики собраны против Жюстины?",
        "Как она объясняет, где была той ночью?",
        "Почему Виктор не рассказывает правду на суде?",
        "Почему Жюстина признаётся в том, чего не совершала?",
      ],
      questions: [
        choice(
          "Which piece of evidence most strongly turns the court against Justine?",
          [
            "The picture found in her pocket, which had been placed around William's neck",
            "Her confession before the trial began",
            "Victor's testimony against her",
            "A witness who saw her commit the crime",
          ],
          0,
          "Когда Элизабет подтверждает, что миниатюру надели на Уильяма за час до исчезновения, «a murmur of horror and indignation filled the court». Признание было позже, а очевидцев преступления нет.",
          "“The picture was then produced which the servant had found in her pocket; and when Elizabeth, in a faltering voice, proved that it was the same which, an hour before the child had been missed, she had placed round his neck, a murmur of horror and indignation filled the court.” (Ch. 8)",
        ),
        choice(
          "According to Justine, why did she confess?",
          [
            "Her confessor threatened her with excommunication and hell, and she had no one to support her.",
            "She wanted to protect Victor.",
            "She was guilty and wanted forgiveness.",
            "The court offered her a lighter sentence.",
          ],
          0,
          "Она говорит прямо: «he threatened and menaced… I had none to support me». Признание вырвано давлением.",
          "“I did confess, but I confessed a lie. I confessed, that I might obtain absolution… Ever since I was condemned, my confessor has besieged me; he threatened and menaced, until I almost began to think that I was the monster that he said I was.” (Ch. 8)",
        ),
        choice(
          "Victor knows the real killer but stays silent during the trial. For the reader, this mainly creates",
          [
            "dramatic irony, because the reader knows the truth while the court condemns an innocent person",
            "suspense about who the real killer is",
            "humor that lightens the mood of the chapter",
            "confusion about the order of events",
          ],
          0,
          "Читатель знает больше героев — это драматическая ирония. Загадки, кто убийца, для читателя нет (B).",
        ),
      ],
    },
    skill: {
      title: "Навык: оценка доказательств",
      summary: "Релевантность, достаточность, достоверность",
      theory: [
        {
          body:
            "AP Seminar требует не просто находить доказательства, а **оценивать** их. Три вопроса к любому доказательству:",
        },
        {
          heading: "Три вопроса",
          body:
            "• **Relevance** — относится ли оно к утверждению напрямую?\n• **Sufficiency** — хватает ли его? Одна улика или несколько независимых?\n• **Credibility** — кто источник, есть ли у него интерес в исходе, можно ли проверить?",
        },
        {
          heading: "Прямые и косвенные",
          body:
            "**Прямое** доказательство подтверждает факт само по себе (очевидец, запись). **Косвенное** требует вывода (вещь в кармане, путаные ответы). Косвенные улики могут убеждать вместе, но каждая из них допускает другие объяснения.",
        },
      ],
      questions: [
        choice(
          "The picture found in Justine's pocket is best described as",
          ["circumstantial evidence", "direct eyewitness evidence", "a confession", "expert testimony"],
          0,
          "Медальон в кармане требует вывода «значит, она убила». Его могли и подложить — что и случилось. Это косвенная улика.",
        ),
        choice(
          "Which question best tests the sufficiency of evidence?",
          [
            "Is there enough evidence, from enough independent sources, to support the conclusion?",
            "Is the evidence interesting to read?",
            "Was the evidence presented first in the trial?",
            "Does the evidence use emotional language?",
          ],
          0,
          "Достаточность — вопрос количества и независимости источников.",
        ),
        choice(
          "A source's credibility is most weakened by",
          [
            "an undisclosed personal stake in the outcome",
            "being published in a book",
            "including numerical data",
            "being longer than other sources",
          ],
          0,
          "Скрытый интерес — главный повод сомневаться в источнике. Длина и цифры сами по себе ничего не говорят.",
        ),
      ],
    },
    write: {
      title: "Пишем: оцениваем улики",
      summary: "Было ли доказательств достаточно?",
      theory: [
        {
          body:
            "Ты — судья, который пересматривает дело. Не говори, что Жюстина невиновна, потому что ты знаешь сюжет. Оцени улики так, как их видел суд: релевантны ли они, достаточно ли их, достоверны ли.",
        },
      ],
      task: {
        prompt:
          "Judging only by the evidence presented in court, was there enough to convict Justine? Evaluate the evidence using relevance, sufficiency, and credibility.",
        minWords: 160,
        maxWords: 300,
        rubric: [...BASE_RUBRIC, "Использованы понятия relevance, sufficiency или credibility"],
        starters: ["Although the picture seems damning, …", "The evidence is insufficient because…"],
        checks: { quotes: 2 },
      },
    },
  },

  // ------------------------------------------------------------------- 5 --
  {
    month: 5,
    title: "Встреча на леднике",
    subtitle: "Две стороны одного разговора",
    read: {
      sections: ["chapter-9", "chapter-10"],
      label: "главы 9–10",
      intro:
        "После казни Жюстины Виктор уходит в Альпы, надеясь, что величие гор его успокоит. На леднике у Монблана к нему подходит существо — и впервые говорит. Это центральная сцена романа: создатель и созданный впервые спорят о долге друг перед другом.",
      guide: [
        "Что чувствует Виктор в горах до встречи?",
        "Как существо называет себя и как его называет Виктор?",
        "Чего существо требует и чем угрожает?",
        "Почему Виктор соглашается выслушать его?",
      ],
      questions: [
        choice(
          "By comparing himself to Adam and to “the fallen angel,” the creature mainly argues that",
          [
            "he was created good but has been cast out without having done wrong",
            "he wants to rule over humanity",
            "he has read many religious books",
            "he is more powerful than Victor",
          ],
          0,
          "«I ought to be thy Adam, but I am rather the fallen angel, whom thou drivest from joy for no misdeed». Ключевое — «for no misdeed»: отвергнут без вины.",
          "“Remember that I am thy creature; I ought to be thy Adam, but I am rather the fallen angel, whom thou drivest from joy for no misdeed. Everywhere I see bliss, from which I alone am irrevocably excluded. I was benevolent and good; misery made me a fiend. Make me happy, and I shall again be virtuous.” (Ch. 10)",
        ),
        choice(
          "“I was benevolent and good; misery made me a fiend” expresses the belief that",
          [
            "his wickedness was caused by how he has been treated",
            "he was born evil",
            "misery is a necessary part of goodness",
            "he no longer feels any misery",
          ],
          0,
          "Причина — страдание, следствие — злоба. Это тезис «воспитание, а не природа», который роман будет проверять.",
        ),
        choice(
          "When the creature says that “the guilty are allowed, by human laws… to speak in their own defence,” he is mainly",
          [
            "appealing to fairness by using the standards of Victor's own society",
            "admitting that he is guilty of every crime",
            "threatening to take Victor to court",
            "praising human laws as perfect",
          ],
          0,
          "Он берёт принцип человеческого правосудия и требует применить его к себе. Это сильный риторический ход — апелляция к собственным ценностям оппонента.",
          "“The guilty are allowed, by human laws, bloody as they are, to speak in their own defence before they are condemned. Listen to me, Frankenstein. You accuse me of murder, and yet you would, with a satisfied conscience, destroy your own creature.” (Ch. 10)",
        ),
      ],
    },
    skill: {
      title: "Навык: перспективы и линзы",
      summary: "Evaluate Multiple Perspectives",
      theory: [
        {
          body:
            "**Перспектива** — это позиция по вопросу, сформированная положением и ценностями говорящего. Две перспективы — это не просто «за» и «против»: они могут исходить из разных предпосылок и замечать разные факты.",
        },
        {
          heading: "Линзы AP Seminar",
          body:
            "Одну проблему можно рассмотреть через разные линзы: **ethical** (что правильно), **scientific** (что известно и как проверить), **social** (как это влияет на отношения людей), **psychological**, **historical**, **political**, **economic**, **environmental**, **artistic and philosophical**, **futuristic**.",
        },
        {
          heading: "Честное изложение",
          body:
            "Прежде чем спорить с перспективой, изложи её так, чтобы её сторонник согласился с твоим пересказом. Это делает твою критику сильнее, а не слабее.",
        },
      ],
      questions: [
        choice(
          "“The creature's violence is the result of social rejection.” Which lens does this claim mainly use?",
          ["Social and psychological", "Economic", "Environmental", "Artistic"],
          0,
          "Речь об отвержении обществом и его влиянии на поведение — социальная и психологическая линзы.",
        ),
        choice(
          "Two perspectives differ most deeply when they",
          [
            "reach different conclusions because they rest on different values or assumptions",
            "use different quotations",
            "are written by different people",
            "are written at different lengths",
          ],
          0,
          "Глубокое расхождение — в ценностях и предпосылках, а не в оформлении.",
        ),
        choice(
          "Which sentence presents an opposing perspective fairly before disagreeing with it?",
          [
            "Victor may seem justified in refusing, since the creature has already killed; however, Victor's own neglect created the danger he now fears.",
            "Victor is obviously wrong, and anyone who agrees with him is foolish.",
            "The creature is right.",
            "Some people think things about Victor.",
          ],
          0,
          "A признаёт силу противоположной позиции и только потом возражает. B — нападение, C и D — без аргумента.",
        ),
      ],
    },
    write: {
      title: "Пишем: две перспективы",
      summary: "Кто кому должен?",
      theory: [
        {
          body:
            "Напиши два коротких абзаца: первый — с позиции Виктора, второй — с позиции существа. Вопрос один: что создатель и созданный должны друг другу? Каждая позиция — со своей цитатой. Последним предложением скажи, какая перспектива убедительнее и почему.",
        },
      ],
      task: {
        prompt:
          "What do Victor and the creature owe each other? Present each one's perspective fairly in its own paragraph, then state in one sentence which perspective you find more convincing and why.",
        minWords: 180,
        maxWords: 320,
        rubric: [
          "Каждая перспектива изложена честно, своими словами",
          "У каждой перспективы своя цитата со ссылкой на главу",
          "Видно, на каких ценностях держится каждая позиция",
          "Финальное предложение — твоя оценка с причиной",
        ],
        starters: ["From Victor's perspective, …", "The creature, however, sees…", "Ultimately, … is more convincing because…"],
        checks: { quotes: 2 },
      },
    },
  },

  // ------------------------------------------------------------------- 6 --
  {
    month: 6,
    title: "Голос существа",
    subtitle: "Первые воспоминания и первые уроки",
    read: {
      sections: ["chapter-11", "chapter-12", "chapter-13"],
      label: "главы 11–13",
      intro:
        "Теперь говорит существо. Оно вспоминает первые дни: свет, холод, огонь, первую встречу с людьми. Прячась у хижины семьи Де Лейси, оно учится языку, читает людей — и узнаёт, как общество устроено и чего оно ценит. Обрати внимание, как меняется речь существа по мере обучения.",
      guide: [
        "Как существо описывает первые ощущения?",
        "Что происходит при первых встречах с людьми?",
        "Чему оно учится, наблюдая за семьёй Де Лейси?",
        "Что оно узнаёт о богатстве, происхождении и о себе?",
      ],
      questions: [
        choice(
          "The description of sensations as “confused and indistinct” mainly suggests that the creature",
          [
            "begins life like a newborn, without knowledge or prejudice",
            "is already planning revenge",
            "remembers its life before it was created",
            "is suffering from an illness",
          ],
          0,
          "Существо учится различать чувства, как младенец. Шелли показывает: оно начинает с чистого листа, а не со злобы.",
          "“It is with considerable difficulty that I remember the original era of my being; all the events of that period appear confused and indistinct. A strange multiplicity of sensations seized me, and I saw, felt, heard, and smelt at the same time; and it was, indeed, a long time before I learned to distinguish between the operations of my various senses.” (Ch. 11)",
        ),
        choice(
          "According to this passage, the creature learns that human society most values",
          [
            "noble birth combined with wealth",
            "kindness and generosity",
            "physical strength",
            "knowledge of science",
          ],
          0,
          "«high and unsullied descent united with riches». У существа нет ни того, ни другого.",
          "“I learned that the possessions most esteemed by your fellow creatures were high and unsullied descent united with riches… And what was I? Of my creation and creator I was absolutely ignorant, but I knew that I possessed no money, no friends, no kind of property.” (Ch. 13)",
        ),
        choice(
          "The question “Was I, then, a monster, a blot upon the earth?” shows that the creature",
          [
            "begins to judge itself by society's standards",
            "is proud of being different",
            "has decided to leave Europe",
            "believes Victor will accept it",
          ],
          0,
          "Узнав, что ценят люди, существо применяет их мерку к себе — и приходит к выводу, что оно чудовище.",
        ),
      ],
    },
    skill: {
      title: "Навык: скрытые предпосылки",
      summary: "Understand and Analyze: assumptions",
      theory: [
        {
          body:
            "**Предпосылка** — это убеждение, на котором держится аргумент, но которое не высказано вслух. Если предпосылка неверна, аргумент рушится, даже если все факты в нём правильные.",
        },
        {
          heading: "Как найти предпосылку",
          body:
            "Спроси: «Что ещё должно быть правдой, чтобы этот вывод следовал из этих фактов?» Например: «Существо уродливо, значит, оно опасно» предполагает, что внешность отражает характер.",
        },
        {
          heading: "Как проверить",
          body: "Представь, что предпосылка ложна. Работает ли аргумент тогда? Есть ли в тексте случаи, которые ей противоречат?",
        },
      ],
      questions: [
        choice(
          "The argument “The creature is evil because it is ugly” assumes that",
          [
            "outward appearance reveals inner character",
            "beauty is rare",
            "the creature wants to be ugly",
            "evil people are always strong",
          ],
          0,
          "Чтобы вывод следовал, нужно верить, что внешность говорит о характере. Именно это роман ставит под сомнение.",
        ),
        choice(
          "Which is an unstated assumption of the claim “Education will make the creature good”?",
          [
            "Knowledge and language shape moral character.",
            "The creature can read.",
            "The De Lacey family owns books.",
            "The creature lives near a cottage.",
          ],
          0,
          "Утверждение верно только если знание формирует мораль. Остальные варианты — факты сюжета, а не предпосылки.",
        ),
        choice(
          "What is the best way to test an assumption?",
          [
            "Ask whether the argument still works if the assumption is false.",
            "Count how many people believe it.",
            "Check whether it is stated in the first paragraph.",
            "Replace it with a quotation.",
          ],
          0,
          "Проверка предпосылки — мысленный эксперимент: что будет, если она ложна.",
        ),
      ],
    },
    write: {
      title: "Пишем: предпосылка существа",
      summary: "Найти и оценить скрытое убеждение",
      theory: [
        {
          body:
            "В рассказе существа много скрытых убеждений: что знание делает лучше, что люди судят по внешности, что доброта будет вознаграждена. Выбери одно, сформулируй его явно и оцени: подтверждает ли его роман?",
        },
      ],
      task: {
        prompt:
          "Identify one unstated assumption in the creature's account in Chapters 11–13. State it clearly, then evaluate whether the novel supports or challenges it.",
        minWords: 160,
        maxWords: 300,
        rubric: [...BASE_RUBRIC, "Предпосылка сформулирована явно, одним предложением"],
        starters: ["The creature assumes that…", "The novel challenges this assumption when…"],
        checks: { quotes: 2 },
      },
    },
  },

  // ------------------------------------------------------------------- 7 --
  {
    month: 7,
    title: "Отверженный",
    subtitle: "От надежды к мести",
    read: {
      sections: ["chapter-14", "chapter-15", "chapter-16"],
      label: "главы 14–16",
      intro:
        "Существо узнаёт историю семьи Де Лейси, находит книги — «Потерянный рай», Плутарха, «Вертера» — и дневник Виктора. Оно решается показаться слепому старику. То, что происходит дальше, ломает его. Глава 16 заканчивается смертью Уильяма — теперь ты знаешь, как это было.",
      guide: [
        "С кем из «Потерянного рая» существо себя сравнивает и почему?",
        "Что оно узнаёт из дневника Виктора?",
        "Почему оно выбирает момент, когда старик один?",
        "Что происходит, когда существо спасает тонущую девочку?",
      ],
      questions: [
        choice(
          "In this passage, the creature compares himself to both Adam and Satan in order to suggest that",
          [
            "like Adam he is alone, but unlike Adam he has no caring creator, so Satan seems the closer match",
            "he admires Satan more than Adam",
            "he believes Paradise Lost is a work of fiction",
            "he has been treated exactly as Adam was",
          ],
          0,
          "Сходство с Адамом — одиночество. Различие — Адама создали совершенным и заботились о нём. Поэтому Сатана, полный зависти, «the fitter emblem».",
          "“Like Adam, I was apparently united by no link to any other being in existence; but his state was far different from mine in every other respect. He had come forth from the hands of God a perfect creature, happy and prosperous, guarded by the especial care of his Creator… but I was wretched, helpless, and alone. Many times I considered Satan as the fitter emblem of my condition…” (Ch. 15)",
        ),
        choice(
          "Why is the De Lacey family's rejection a turning point for the creature?",
          [
            "It destroys his hope of acceptance and turns his feelings toward revenge.",
            "It teaches him to read.",
            "It makes him decide to return to Ingolstadt.",
            "It convinces him that all humans are kind.",
          ],
          0,
          "Он годами готовился к этой встрече. После неё — «Cursed, cursed creator!» и решение мстить.",
        ),
        choice(
          "The opening of Chapter 16 shows a shift in the creature's feelings from",
          ["hope to rage", "rage to calm", "fear to curiosity", "joy to boredom"],
          0,
          "До встречи — надежда на принятие. После — «rage and revenge».",
          "“Cursed, cursed creator! Why did I live? Why, in that instant, did I not extinguish the spark of existence which you had so wantonly bestowed? I know not; despair had not yet taken possession of me; my feelings were those of rage and revenge.” (Ch. 16)",
        ),
      ],
    },
    skill: {
      title: "Навык: контраргумент",
      summary: "Признать, ответить, удержать позицию",
      theory: [
        {
          body:
            "Сильный аргумент не делает вид, что возражений нет. Он сам находит **самое сильное** возражение и отвечает на него. В AP Seminar это отдельный пункт оценки.",
        },
        {
          heading: "Структура",
          body:
            "• **Concession** — признай, что в противоположной позиции есть правда: «Some readers argue that…, and it is true that…»\n• **Rebuttal** — объясни, почему твой тезис всё равно сильнее: «However, this overlooks…»\n• Подкрепи ответ доказательством, а не только мнением.",
        },
        {
          heading: "Ошибка",
          body: "Выбирать самое слабое возражение, чтобы легко его разбить (straw man). Читатель это замечает.",
        },
      ],
      questions: [
        choice(
          "Which is the strongest counterargument to the claim “The creature is not responsible for William's death, because society made him violent”?",
          [
            "The creature chose to kill a child who had never harmed him, which shows a deliberate decision.",
            "The creature is very tall.",
            "Some people do not like the novel.",
            "William was Victor's brother.",
          ],
          0,
          "Сильный контраргумент бьёт в саму логику тезиса: если был выбор, то есть и ответственность.",
        ),
        choice(
          "Which describes an effective rebuttal?",
          [
            "Acknowledge the opposing view, then explain with evidence why your claim still holds.",
            "Ignore the opposing view entirely.",
            "Repeat your claim more forcefully.",
            "Change your claim to agree with the opposing view.",
          ],
          0,
          "Признание + доказательный ответ. Повторение тезиса громче — не ответ.",
        ),
        choice(
          "In an argument, “conceding” a point means",
          [
            "admitting that part of the opposing view is valid",
            "giving up your whole argument",
            "attacking the person who disagrees",
            "adding another quotation",
          ],
          0,
          "Уступка — частичное согласие, после которого следует ответ.",
        ),
      ],
    },
    write: {
      title: "Пишем: аргумент с контраргументом",
      summary: "Виновно ли существо?",
      theory: [
        {
          body:
            "Займи позицию: несёт ли существо ответственность за смерть Уильяма? Обязательно приведи самое сильное возражение и ответь на него.",
        },
      ],
      task: {
        prompt:
          "Is the creature responsible for William's death? Argue your position, present the strongest counterargument, and rebut it with evidence.",
        minWords: 200,
        maxWords: 340,
        rubric: [...BASE_RUBRIC, "Есть контраргумент («Some readers argue…») и ответ на него («However…»)"],
        starters: ["Some readers argue that…", "It is true that…; however, …"],
        checks: { quotes: 2, counterargument: true },
      },
    },
  },

  // ------------------------------------------------------------------- 8 --
  {
    month: 8,
    title: "Требование",
    subtitle: "Аргумент существа и решение Виктора",
    read: {
      sections: ["chapter-17", "chapter-18"],
      label: "главы 17–18",
      intro:
        "Существо заканчивает рассказ требованием: создай мне подругу. Виктор отказывается, слушает аргументы, соглашается. Потом он уезжает в Англию и Шотландию — с Клервалем, но с тяжестью на душе. Глава 17 — один из лучших образцов убеждающей речи в английской литературе.",
      guide: [
        "Какими доводами существо обосновывает требование?",
        "Где в его речи разум, где эмоции, где угрозы?",
        "Как Виктор взвешивает решение перед тем, как согласиться?",
        "Почему Виктор откладывает работу и уезжает?",
      ],
      questions: [
        choice(
          "“I am malicious because I am miserable” is best described as",
          [
            "a cause-and-effect argument",
            "an argument from authority",
            "a description of the setting",
            "a personal attack on Victor",
          ],
          0,
          "Причина (несчастье) → следствие (злоба). Вся речь существа держится на этой связи.",
          "“You are in the wrong,” replied the fiend; “and instead of threatening, I am content to reason with you. I am malicious because I am miserable. Am I not shunned and hated by all mankind?” (Ch. 17)",
        ),
        choice(
          "According to the creature, a companion would",
          [
            "remove the cause of his crimes by ending his forced solitude",
            "help him take revenge on Victor",
            "teach him to read and write",
            "allow him to return to the De Lacey family",
          ],
          0,
          "«My vices are the children of a forced solitude… my virtues will necessarily arise when I live in communion with an equal».",
          "“If I have no ties and no affections, hatred and vice must be my portion; the love of another will destroy the cause of my crimes… My vices are the children of a forced solitude that I abhor, and my virtues will necessarily arise when I live in communion with an equal.” (Ch. 17)",
        ),
        choice(
          "Based on Victor's reflection before he agrees, which combination of factors leads him to consent?",
          [
            "A sense of justice toward the creature and his fellow humans, along with fear of the creature's power",
            "Only his fear of the creature",
            "Only his pity for the creature",
            "His wish to become famous again",
          ],
          0,
          "Виктор взвешивает «the justice due both to him and my fellow creatures» и прямо говорит: «His power and threats were not omitted in my calculations».",
          "“His power and threats were not omitted in my calculations… After a long pause of reflection I concluded that the justice due both to him and my fellow creatures demanded of me that I should comply with his request.” (Ch. 17)",
        ),
      ],
    },
    skill: {
      title: "Навык: сравнение аргументов",
      summary: "Тезис, доказательства, предпосылки, последствия",
      theory: [
        {
          body:
            "Сравнивать аргументы — значит разобрать каждый на части и сопоставить их, а не просто сказать, какой нравится больше.",
        },
        {
          heading: "Таблица сравнения",
          body:
            "• **Claim** — что утверждается?\n• **Evidence** — на чём держится?\n• **Assumptions** — что принимается без доказательства?\n• **Implications** — что последует, если с аргументом согласиться?\n\nСильнее тот аргумент, у которого доказательства надёжнее, а предпосылки правдоподобнее.",
        },
      ],
      questions: [
        choice(
          "When comparing two arguments, which approach is most useful?",
          [
            "Identify each argument's claim, evidence, and assumptions, then evaluate which is better supported.",
            "Choose the argument that uses more emotional language.",
            "Choose the argument made by the more likable character.",
            "Count the number of sentences in each argument.",
          ],
          0,
          "Сравнивают устройство и опору аргумента, а не симпатию к говорящему.",
        ),
        choice(
          "The creature's argument for a companion depends most on the assumption that",
          [
            "companionship will change his behavior",
            "Victor enjoys his work",
            "South America is uninhabited",
            "Victor will never marry",
          ],
          0,
          "Если подруга не изменит его поведение, весь аргумент теряет силу.",
        ),
        choice(
          "Which is the most serious weakness in the creature's argument?",
          [
            "It offers no guarantee that he or his companion will keep the promise to stay away from humanity.",
            "It is too short.",
            "It uses the word “miserable” too often.",
            "It is spoken in the mountains.",
          ],
          0,
          "Обещание держится только на клятве. Этим слабым местом позже и воспользуется Виктор.",
        ),
      ],
    },
    write: {
      title: "Пишем: сильное и слабое место",
      summary: "Оценить аргумент существа",
      theory: [
        {
          body:
            "Оцени аргумент существа как исследователь: назови его самую сильную сторону и самое уязвимое место. Обе оценки подкрепи цитатами из главы 17.",
        },
      ],
      task: {
        prompt:
          "Evaluate the creature's argument for a companion in Chapter 17. Identify its strongest point and its most serious weakness, and decide whether Victor should have been persuaded.",
        minWords: 200,
        maxWords: 340,
        rubric: [...BASE_RUBRIC, "Названы и сильная сторона, и слабость аргумента", "Есть итоговая оценка"],
        starters: ["The creature's strongest point is…", "Yet the argument rests on the assumption that…"],
        checks: { quotes: 2 },
      },
    },
  },

  // ------------------------------------------------------------------- 9 --
  {
    month: 9,
    title: "Разрушенная работа",
    subtitle: "Обещание против последствий",
    read: {
      sections: ["chapter-19", "chapter-20"],
      label: "главы 19–20",
      intro:
        "На оркнейском острове Виктор почти заканчивает вторую работу — и уничтожает её на глазах у существа. Он ломает обещание, но считает, что спасает человечество. Существо уходит с угрозой, которую Виктор поймёт неправильно.",
      guide: [
        "Какие сомнения приходят к Виктору за работой?",
        "Как он оценивает последствия своего обещания?",
        "Что говорит существо, увидев разрушенную работу?",
        "Как Виктор толкует угрозу «I shall be with you on your wedding-night»?",
      ],
      questions: [
        choice(
          "In this passage, Victor decides to destroy his work mainly because",
          [
            "he fears the suffering that future generations might face",
            "he has run out of materials",
            "Clerval has discovered his secret",
            "he no longer believes the creature exists",
          ],
          0,
          "«Had I right… to inflict this curse upon everlasting generations?» Решение — о будущем человечества.",
          "“…a race of devils would be propagated upon the earth who might make the very existence of the species of man a condition precarious and full of terror. Had I right, for my own benefit, to inflict this curse upon everlasting generations?” (Ch. 20)",
        ),
        choice(
          "Victor describes himself as someone who might “buy its own peace at the price, perhaps, of the existence of the whole human race.” This frames his choice as",
          [
            "his personal peace versus the welfare of humanity",
            "science versus religion",
            "friendship with Clerval versus love for Elizabeth",
            "England versus Switzerland",
          ],
          0,
          "Он противопоставляет свой покой и судьбу всего человечества.",
        ),
        choice(
          "The threat “I shall be with you on your wedding-night” is significant mainly because",
          [
            "Victor assumes that he is the target, though the words could point to someone else",
            "it reveals the date of the wedding",
            "it shows that the creature has forgiven Victor",
            "it is spoken by Clerval",
          ],
          0,
          "Виктор думает только о себе и не видит, что угроза может касаться Элизабет. Читатель чувствует опасность раньше героя.",
        ),
      ],
    },
    skill: {
      title: "Навык: этические линзы",
      summary: "Последствия, долг, характер",
      theory: [
        {
          body: "Решение Виктора можно оценить тремя классическими способами — и они дают разные ответы.",
        },
        {
          heading: "Три подхода",
          body:
            "• **Консеквенциализм** — правильно то, что ведёт к лучшим последствиям для всех. Разрушить работу — защитить человечество.\n• **Этика долга** — есть обязательства, которые нельзя нарушать. Виктор дал слово и отвечает за существо, которое создал.\n• **Этика добродетели** — каким человеком делает тебя поступок? Честным, мужественным, ответственным?",
        },
        {
          heading: "Связь с реальным миром",
          body:
            "Эти же вопросы задают учёные сегодня: публиковать ли опасное открытие, продолжать ли исследование с неизвестными рисками, кто отвечает за последствия технологии. AP Seminar ценит, когда литературный анализ выходит в настоящую дискуссию.",
        },
      ],
      questions: [
        choice(
          "A consequentialist evaluation of Victor's decision would focus mainly on",
          [
            "the likely outcomes for everyone affected",
            "whether Victor kept his promise",
            "what kind of person the decision makes Victor",
            "whether the decision was legal",
          ],
          0,
          "Консеквенциализм смотрит на последствия.",
        ),
        choice(
          "A duty-based critique of Victor would most likely emphasize that",
          [
            "he broke a promise and abandoned his responsibility to the being he created",
            "the outcome for humanity was positive",
            "he was brave to face the creature",
            "he spent too much money",
          ],
          0,
          "Этика долга оценивает поступок по обязательствам: обещание и ответственность создателя.",
        ),
        choice(
          "Which real-world situation most closely parallels Victor's dilemma?",
          [
            "Scientists debating whether to pause research whose long-term risks to society are unknown",
            "A student choosing which university to attend",
            "A city deciding where to build a new park",
            "A company choosing a new logo",
          ],
          0,
          "Параллель — ответственность исследователя за непредсказуемые последствия открытия.",
        ),
      ],
    },
    write: {
      title: "Пишем: этическая оценка",
      summary: "Две линзы на одно решение",
      theory: [
        {
          body:
            "Оцени решение Виктора разрушить вторую работу через две этические линзы. Покажи, где они расходятся, и сделай собственный вывод.",
        },
      ],
      task: {
        prompt:
          "Was Victor right to destroy the companion? Evaluate his decision through two ethical lenses (for example, consequences and duty), then reach your own conclusion.",
        minWords: 200,
        maxWords: 360,
        rubric: [...BASE_RUBRIC, "Две этические линзы названы и применены", "Есть собственный вывод"],
        starters: ["From the perspective of consequences, …", "A duty-based view, however, …"],
        checks: { quotes: 2, counterargument: true },
      },
    },
  },

  // ------------------------------------------------------------------ 10 --
  {
    month: 10,
    title: "Цена",
    subtitle: "Клерваль, тюрьма, возвращение домой",
    read: {
      sections: ["chapter-21", "chapter-22"],
      label: "главы 21–22",
      intro:
        "Виктора арестовывают в Ирландии: на берегу нашли тело — тело Клерваля. Он месяцами болеет, его оправдывают, отец увозит его домой. Элизабет пишет ему письмо, и Виктор решает не откладывать свадьбу, всё ещё уверенный, что существо придёт за ним самим.",
      guide: [
        "Как Виктор реагирует на тело Клерваля?",
        "Кого он называет виноватым в бреду?",
        "Какие библейские образы появляются в главе 22?",
        "Почему он решает не откладывать свадьбу?",
      ],
      questions: [
        choice(
          "In this passage, Victor's words to Clerval's body show that he",
          [
            "blames himself for the deaths caused by his creation",
            "believes Clerval died of natural causes",
            "suspects the magistrate of the crime",
            "feels nothing at the sight of his friend",
          ],
          0,
          "«Have my murderous machinations deprived you also… of life? Two I have already destroyed». Виктор признаёт свою вину.",
          "“Have my murderous machinations deprived you also, my dearest Henry, of life? Two I have already destroyed; other victims await their destiny; but you, Clerval, my friend, my benefactor—” (Ch. 21)",
        ),
        choice(
          "The image “the apple was already eaten, and the angel's arm bared to drive me from all hope” connects Victor to",
          [
            "Adam's fall from Paradise, echoing the creature's own comparison",
            "a scene from his childhood in Geneva",
            "a scientific experiment with fruit",
            "the trial of Justine",
          ],
          0,
          "Это отсылка к изгнанию Адама из рая. Теперь и Виктор — изгнанный Адам, как когда-то существо.",
        ),
        choice(
          "Why does Victor decide not to delay his marriage?",
          [
            "He believes delay would not protect him and might provoke a worse revenge.",
            "Elizabeth refuses to wait.",
            "He has forgotten the creature's threat.",
            "His father orders him to marry immediately.",
          ],
          0,
          "Он рассуждает, что существо найдёт «other and perhaps more dreadful means of revenge», если увидит, что он откладывает свадьбу.",
          "“My destruction might indeed arrive a few months sooner, but if my torturer should suspect that I postponed it, influenced by his menaces, he would surely find other and perhaps more dreadful means of revenge.” (Ch. 22)",
        ),
      ],
    },
    skill: {
      title: "Навык: внешние источники",
      summary: "Найти, проверить, процитировать",
      theory: [
        {
          body:
            "Итоговая работа AP Seminar — это аргумент, который опирается на несколько источников. Роман — один из них. Нужны и внешние: научные статьи, книги, отчёты, интервью экспертов.",
        },
        {
          heading: "Проверка источника",
          body:
            "• **Автор** — кто он, есть ли у него экспертиза?\n• **Публикация** — рецензируемый журнал, университет, серьёзное издание?\n• **Дата** — достаточно ли свежий для этой темы?\n• **Цель** — информировать, убедить, продать?\n• **Доказательства** — на что ссылается сам источник?",
        },
        {
          heading: "Как вводить источник",
          body:
            "Используй **signal phrase**: «Bioethicist Françoise Baylis argues that…» Пересказывая чужую мысль своими словами, всё равно указывай автора: идея принадлежит ему. В конце работы — список источников: автор, название, издание, год, ссылка.",
        },
        {
          heading: "Темы для поиска",
          body:
            "Асиломарская конференция 1975 года о рекомбинантной ДНК, споры о редактировании генома человека (CRISPR), дискуссии об ответственности разработчиков искусственного интеллекта.",
        },
      ],
      questions: [
        choice(
          "Which source would be most credible for a paper on the ethics of gene editing?",
          [
            "A peer-reviewed article by bioethicists in a scientific journal",
            "An anonymous blog post",
            "A social media thread with many likes",
            "A review of a science-fiction film",
          ],
          0,
          "Рецензируемая статья специалистов проходит проверку экспертами и указывает автора.",
        ),
        choice(
          "What does a signal phrase do?",
          [
            "It introduces a source and its author before a quotation or paraphrase.",
            "It replaces the need for a works cited list.",
            "It signals the end of a paragraph.",
            "It shows that a quotation is false.",
          ],
          0,
          "Signal phrase («According to…», «X argues that…») вводит источник и его автора.",
        ),
        choice(
          "Why must you cite a source even when you paraphrase it in your own words?",
          [
            "Because ideas, not just exact words, belong to their authors",
            "Because paraphrasing is not allowed",
            "Because citations make a paper longer",
            "Because only quotations need citations",
          ],
          0,
          "Пересказ без ссылки — тоже плагиат: идея чужая.",
        ),
      ],
    },
    write: {
      title: "Пишем: роман и реальный мир",
      summary: "Связать книгу с внешним источником",
      theory: [
        {
          body:
            "Найди один достоверный внешний источник об ответственности учёных: статью, отчёт, главу книги. Напиши абзац, в котором роман и источник вместе подкрепляют одну мысль. В конце укажи источник: автор, название, год, ссылка.",
        },
      ],
      task: {
        prompt:
          "Connect Frankenstein to one credible real-world source about the responsibility of scientists. Write a paragraph in which the novel and the source together support one claim. End with a full citation of your outside source.",
        minWords: 200,
        maxWords: 340,
        rubric: [
          "Одно утверждение, которое подкрепляют и роман, и внешний источник",
          "Цитата из романа со ссылкой на главу",
          "Внешний источник введён signal phrase",
          "В конце — полная ссылка на источник: автор, название, год, URL",
        ],
        starters: ["Like Victor, modern scientists…", "According to…, …", "Works cited: …"],
        checks: { quotes: 1, outsideSource: true },
      },
    },
  },

  // ------------------------------------------------------------------ 11 --
  {
    month: 11,
    title: "Погоня",
    subtitle: "Свадьба, клятва, путь на север",
    read: {
      sections: ["chapter-23", "chapter-24"],
      label: "глава 23 и начало главы 24",
      intro:
        "Угроза исполняется — но не так, как ждал Виктор. После смерти отца Виктор клянётся отомстить и преследует существо через всю Европу до арктических льдов, где его и находит Уолтон. Читай главу 24 до слов «Walton, in continuation» — дальше начинается последняя часть, ей посвящён следующий месяц.",
      guide: [
        "Что Виктор понимает в брачную ночь — слишком поздно?",
        "Почему магистрат не верит его рассказу?",
        "Как меняется Виктор: от жертвы к преследователю?",
        "Чем он и существо стали похожи друг на друга?",
      ],
      questions: [
        choice(
          "Elizabeth's death shows most clearly that Victor",
          [
            "misread the creature's threat because he thought only of himself",
            "had planned to leave Geneva after the wedding",
            "had told Elizabeth the whole truth",
            "never believed the creature would act",
          ],
          0,
          "Виктор был уверен, что мишень — он сам. Его самоуверенность и сосредоточенность на себе стоят жизни Элизабет.",
          "“She was there, lifeless and inanimate, thrown across the bed, her head hanging down and her pale and distorted features half covered by her hair.” (Ch. 23)",
        ),
        choice(
          "In his vow at the grave, Victor says he will preserve his life in order to",
          [
            "pursue and destroy the creature",
            "finish his scientific work",
            "care for his brother Ernest",
            "return to Ingolstadt",
          ],
          0,
          "«to pursue the dæmon… until he or I shall perish in mortal conflict. For this purpose I will preserve my life».",
          "“By the sacred earth on which I kneel… I swear… to pursue the dæmon who caused this misery, until he or I shall perish in mortal conflict. For this purpose I will preserve my life…” (Ch. 24)",
        ),
        choice(
          "By the end of the chase, Victor and the creature are most alike in that both",
          [
            "are consumed by revenge and isolated from everyone they loved",
            "are welcomed by society",
            "have given up on their goals",
            "are traveling with companions",
          ],
          0,
          "Оба потеряли всех близких и живут только местью — создатель стал похож на созданного.",
        ),
      ],
    },
    skill: {
      title: "Навык: синтез и тезис",
      summary: "От вопроса к собственной позиции",
      theory: [
        {
          body:
            "**Синтез** — это не пересказ источников по очереди, а новая мысль, которая возникает из их соединения. Ты не пишешь «источник A говорит…, источник B говорит…», а показываешь, что вместе они доказывают твой тезис.",
        },
        {
          heading: "Хороший тезис",
          body:
            "• Отвечает на исследовательский вопрос.\n• Спорный: с ним можно не согласиться.\n• Достаточно конкретный, чтобы доказать в работе на 1–2 тысячи слов.\n• Намечает линию рассуждения: «…because…, and…».",
        },
        {
          heading: "Пример",
          body:
            "Слабый: «Frankenstein is about science.» Сильный: «Frankenstein suggests that the real danger of scientific ambition lies not in discovery itself but in the scientist's refusal to take responsibility for what he has made.»",
        },
      ],
      questions: [
        choice(
          "Which is the strongest thesis for an argument about Frankenstein?",
          [
            "Frankenstein is a novel about a scientist.",
            "Frankenstein suggests that the greatest danger of ambition is not discovery itself but the refusal to take responsibility for its results.",
            "Frankenstein has twenty-four chapters.",
            "Many people have read Frankenstein.",
          ],
          1,
          "B — спорный, конкретный и задаёт линию рассуждения.",
        ),
        choice(
          "Which best describes synthesis?",
          [
            "Combining ideas from several sources to support a new claim of your own",
            "Summarizing each source in turn",
            "Quoting as many sources as possible",
            "Choosing the one source you agree with",
          ],
          0,
          "Синтез создаёт новый вывод, а не перечисляет источники.",
        ),
        choice(
          "A research question and a thesis are related because",
          [
            "the thesis is your arguable answer to the research question",
            "the thesis repeats the research question",
            "the research question comes after the thesis",
            "they are unrelated",
          ],
          0,
          "Вопрос задаёт направление, тезис — твой ответ, который ты доказываешь.",
        ),
      ],
    },
    write: {
      title: "Пишем: план итоговой работы",
      summary: "Вопрос, тезис, три опоры",
      theory: [
        {
          body:
            "Это подготовка к последнему месяцу. Сформулируй исследовательский вопрос, тезис и план из трёх частей. Для каждой части укажи доказательство: цитату из романа или внешний источник.",
        },
      ],
      task: {
        prompt:
          "Plan your final argument. Write (1) your research question, (2) your thesis, and (3) an outline of three body sections, each with the evidence you will use.",
        minWords: 150,
        maxWords: 320,
        rubric: [
          "Исследовательский вопрос открытый и спорный",
          "Тезис отвечает на вопрос и задаёт линию рассуждения",
          "У каждой из трёх частей есть доказательство",
          "Хотя бы одна часть отвечает на контраргумент",
        ],
        starters: ["Research question: To what extent…", "Thesis: …", "Section 1: … Evidence: …"],
        checks: { quotes: 1 },
      },
    },
  },

  // ------------------------------------------------------------------ 12 --
  {
    month: 12,
    title: "Последнее письмо",
    subtitle: "Финал и итоговая работа",
    read: {
      sections: ["chapter-24#26"],
      label: "финал главы 24",
      intro:
        "Последние письма Уолтона: корабль зажат во льдах, команда требует вернуться, Виктор умирает. А потом в каюту входит существо. Финал отвечает на вопрос, с которого начинался роман: что делать с мечтой, если она стоит чужих жизней?",
      guide: [
        "Что Виктор говорит команде, когда та хочет повернуть назад?",
        "Какой совет он даёт Уолтону перед смертью — и как сам себе противоречит?",
        "Почему Уолтон соглашается вернуться?",
        "Что говорит существо над телом создателя?",
      ],
      questions: [
        choice(
          "Victor's speech to Walton's crew urges them to",
          [
            "continue the voyage despite the danger, for the sake of glory",
            "return home to their families at once",
            "abandon Walton and take control of the ship",
            "help him find the creature",
          ],
          0,
          "«Be steady to your purposes and firm as a rock». Виктор зовёт их вперёд — хотя только что рассказал, к чему привели его собственные амбиции.",
          "“Did you not call this a glorious expedition? … You were hereafter to be hailed as the benefactors of your species… Be steady to your purposes and firm as a rock.” (Ch. 24)",
        ),
        choice(
          "Victor's final words to Walton show that he",
          [
            "remains divided about ambition even as he dies",
            "has fully rejected all scientific discovery",
            "believes he was right all along",
            "wants Walton to repeat his experiment",
          ],
          0,
          "Он советует избегать амбиций — и тут же: «yet another may succeed». Виктор до конца не может отказаться от мечты.",
          "“Seek happiness in tranquillity and avoid ambition, even if it be only the apparently innocent one of distinguishing yourself in science and discoveries. Yet why do I say this? I have myself been blasted in these hopes, yet another may succeed.” (Ch. 24)",
        ),
        choice(
          "The creature says he was “the slave, not the master, of an impulse which I detested.” This statement",
          [
            "presents his crimes as compelled, while also admitting that he knew they were wrong",
            "denies that he committed any crimes",
            "shows that he feels no remorse",
            "blames Walton for Victor's death",
          ],
          0,
          "Он одновременно говорит о принуждении и о ненависти к собственному порыву — признаёт, что знал, что поступает плохо. Это и делает вопрос о вине открытым.",
          "“I knew that I was preparing for myself a deadly torture, but I was the slave, not the master, of an impulse which I detested yet could not disobey.” (Ch. 24)",
        ),
      ],
    },
    skill: {
      title: "Навык: собрать и отредактировать",
      summary: "Transmit: структура и правка",
      theory: [
        {
          body:
            "Итоговая работа в AP Seminar называется **Individual Written Argument**. Её оценивают не за красоту языка, а за ясность рассуждения.",
        },
        {
          heading: "Структура",
          body:
            "• **Введение** — контекст проблемы, исследовательский вопрос, тезис.\n• **Основная часть** — 3–4 раздела, каждый с утверждением, доказательствами и разбором.\n• **Другие перспективы** — честное изложение и ответ.\n• **Заключение** — не повтор тезиса, а следствия: почему это важно, что остаётся открытым.",
        },
        {
          heading: "Чек-лист правки",
          body:
            "• Каждый абзац начинается с утверждения, а не с цитаты.\n• Каждая цитата разобрана.\n• Переходы между абзацами показывают логику: because, however, as a result.\n• Нет предложений, которые можно удалить без потери смысла.",
        },
      ],
      questions: [
        choice(
          "What should a strong conclusion do?",
          [
            "Explain the implications of the argument and what remains open",
            "Repeat the thesis word for word",
            "Introduce a completely new topic",
            "List every quotation used in the paper",
          ],
          0,
          "Заключение отвечает на вопрос «и что?»: почему вывод важен и что за ним следует.",
        ),
        choice(
          "During revision, which change most improves a paragraph that begins with a long quotation?",
          [
            "Start the paragraph with your own claim, then introduce the quotation",
            "Add a second long quotation",
            "Remove all commentary",
            "Move the quotation to the conclusion",
          ],
          0,
          "Абзац должен начинаться с твоей мысли. Цитата её подкрепляет.",
        ),
        choice(
          "Where in an argument should other perspectives be addressed?",
          [
            "In the body, where they can be fairly presented and answered with evidence",
            "Only in the title",
            "Nowhere — they weaken the argument",
            "Only in the works cited list",
          ],
          0,
          "Другие перспективы — часть основной аргументации, а не помеха ей.",
        ),
      ],
    },
    write: {
      title: "Итоговая работа",
      summary: "Аргумент на 600–900 слов",
      theory: [
        {
          body:
            "Последняя работа года. Используй план, который ты сделал в прошлом месяце. Минимум три цитаты из романа, контраргумент и ответ на него. Внешний источник — по желанию, но он заметно усиливает работу.",
        },
      ],
      task: {
        prompt:
          "To what extent is Victor Frankenstein responsible for the tragedies of the novel, and what does the novel suggest about the limits of ambition? Write a complete argument with an introduction, body sections, a counterargument, and a conclusion.",
        minWords: 600,
        maxWords: 1000,
        rubric: [
          "Введение заканчивается ясным спорным тезисом",
          "Не меньше трёх цитат из романа, каждая с разбором",
          "Контраргумент изложен честно и получил ответ",
          "Заключение объясняет, почему вывод важен",
          "Переходы между абзацами показывают логику",
        ],
        starters: ["Mary Shelley's Frankenstein asks…", "Some readers argue that…", "Ultimately, …"],
        checks: { quotes: 3, counterargument: true },
      },
    },
  },
];

export const SEMINAR: Course = {
  id: "seminar",
  title: "Семинар: читаем и пишем",
  short: "Семинар",
  description:
    "Год с одной книгой — «Франкенштейном» Мэри Шелли. Двенадцать месяцев: читаем, разбираем аргументы, оцениваем доказательства и пишем работы, как в AP Seminar.",
  units: MONTHS.map(month),
};
