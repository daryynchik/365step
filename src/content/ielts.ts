import type { ChoiceQuestion, Course, InputQuestion } from "./types";

/**
 * IELTS Academic: Reading, Writing, Vocabulary, Listening and Speaking, in the
 * formats of the real test. All passages, recordings and prompts are original.
 * Official sample tests are linked from every lesson.
 */

const SAMPLES = {
  label: "Официальные примеры заданий IELTS (ielts.org)",
  url: "https://ielts.org/take-a-test/preparation-resources/sample-test-questions",
};

const TFNG = ["True", "False", "Not Given"];
const YNNG = ["Yes", "No", "Not Given"];

const tfng = (prompt: string, answer: 0 | 1 | 2, explanation: string): ChoiceQuestion => ({
  kind: "choice",
  prompt,
  options: TFNG,
  answer,
  explanation,
});

const gap = (prompt: string, answers: string[], explanation: string): InputQuestion => ({
  kind: "input",
  prompt,
  answers,
  explanation,
});

const RIVERS = `**The return of hidden rivers**

A  For much of the twentieth century, many cities treated small rivers as a problem to be engineered away. Streams that flooded after heavy rain or carried household waste were covered over and turned into underground drains, and the land above them was used for roads, car parks and buildings. Residents often forgot that a river had ever been there.

B  Since the 1990s, a growing number of cities have begun to "daylight" these hidden rivers: they remove the covering and give the water an open, more natural channel again. One of the best-known projects took place in Seoul, where an elevated motorway was demolished in the early 2000s so that the Cheonggyecheon stream could flow in the open through the city centre.

C  Supporters of daylighting point to several benefits. An open channel can hold more water than a narrow pipe, so it may reduce flooding. Moving water and the plants along its banks also help to cool the surrounding streets in summer, and restored streams provide habitats for fish, insects and birds that disappear when water runs underground.

D  Daylighting is not cheap, however. Removing roads and relocating pipes and cables can cost far more than simply maintaining an existing culvert, and some projects have been criticised for raising property prices so sharply that long-term residents could no longer afford to live nearby. Engineers also warn that an open river must be managed carefully: if pollution from the surrounding area is not controlled first, the city may simply create a visible, unpleasant drain.

E  For these reasons, most experts recommend starting with small, well-studied sections rather than ambitious city-wide plans. Even a short stretch of open water, they argue, can change how people feel about their neighbourhood.`;

const SLEEP = `**Why teenagers sleep late**

List of headings
i    The cost of trying to catch up
ii   A biological explanation for late nights
iii  An old complaint reconsidered
iv   Schools change their schedules
v    Why screens are to blame
vi   A clash with the school day
vii  The benefits of napping

A  Parents have long complained that teenagers stay up late and are impossible to wake in the morning. For years this was blamed on poor discipline. Research over the past few decades, however, suggests that biology plays a much larger role than was once believed.

B  During adolescence, the body's internal clock shifts. The hormone melatonin, which helps to bring on sleep, is released later in the evening than it is in younger children or adults. As a result, many teenagers simply do not feel tired until late at night, even if they go to bed early.

C  This change collides with the timetable of most schools. When classes begin early in the morning, students who fall asleep late cannot get the amount of sleep that specialists generally recommend for their age group. Some teachers report that the first lessons of the day are the hardest to teach.

D  Many teenagers try to repay the debt at weekends, sleeping until midday on Saturday and Sunday. Researchers call the resulting pattern "social jet lag": the body moves between two different schedules every week, much as a traveller does when crossing time zones, and Monday mornings become even harder.

E  In response, a number of school districts have experimented with later start times. Reported results include better attendance and fewer students falling asleep in class, although critics point out that later starts can complicate transport and after-school activities.`;

const BEES = `**How bees share directions**

When a forager honeybee finds a good source of nectar, it returns to the hive and performs a movement known as the waggle dance. The Austrian scientist Karl von Frisch, who shared a Nobel Prize in 1973 for his work on animal behaviour, was among the first to explain what the dance means.

The dance takes place on the vertical surface of the honeycomb. The bee runs forward in a straight line while shaking its body from side to side, then circles back and repeats the run. The angle of this straight run, measured from the vertical, shows the angle between the food source and the sun. If the bee runs straight upwards, for example, the food lies in the direction of the sun.

The length of the waggle run carries information about distance: the longer the bee waggles, the further away the flowers are. Other bees follow the dancer closely, and they also pick up the scent of the flowers it has visited, which helps them to recognise the right plants when they arrive.

Not every detail of the system is understood. Researchers still debate, for instance, how precisely bees can measure distance on windy days, when flying takes more effort.`;

const NOTES = `**Should students still take notes by hand?**

Laptops are now a familiar sight in lecture halls, and it is easy to see why. Typing is faster than writing, notes can be searched later, and nothing is lost if a page goes missing. Yet I am not convinced that speed is what students most need.

When we write by hand, we cannot record every word a lecturer says. We are forced to decide what matters and to put ideas into our own words, and that act of selection is itself a form of learning. Several studies have suggested that students who take notes by hand understand concepts at least as well as those who type, even though they write less. The research is not unanimous, and much depends on how the notes are used afterwards, but it should make us question the assumption that more notes mean better learning.

None of this means that laptops should be banned. For students with certain disabilities, typing is essential, and many courses now require digital work. My argument is a narrower one: universities should teach students how to take notes, rather than leaving the choice of tool to habit. A student who types thoughtfully will learn more than one who copies by hand without thinking.`;

const MUSEUMS = {
  caption: "Visitors to three museums in one city (thousands)",
  head: ["Year", "Science Museum", "Art Gallery", "History Museum"],
  rows: [
    ["2015", "420", "310", "150"],
    ["2017", "460", "300", "180"],
    ["2019", "510", "290", "240"],
    ["2021", "230", "140", "120"],
    ["2023", "530", "260", "270"],
  ],
};

const withPassage = <T extends ChoiceQuestion | InputQuestion>(text: string, q: T): T => ({ ...q, passages: [{ text }] });

export const IELTS: Course = {
  id: "ielts",
  title: "IELTS Academic",
  short: "IELTS",
  description: "Все пять навыков IELTS Academic в формате настоящего экзамена.",
  units: [
    // ---------------------------------------------------------- Reading --
    {
      id: "reading",
      title: "Reading",
      subtitle: "Три текста, 40 вопросов, 60 минут",
      lessons: [
        {
          id: "reading-tfng",
          title: "Reading: True / False / Not Given",
          summary: "Самый коварный тип вопросов IELTS",
          skill: "Reading",
          minutes: 15,
          official: SAMPLES,
          theory: [
            {
              body:
                "В Academic Reading три длинных текста и 40 вопросов на 60 минут — около 20 минут на текст. Вопросы True / False / Not Given проверяют, **совпадает ли утверждение с тем, что сказано в тексте** — не с тем, что правда в мире.",
            },
            {
              heading: "Как различать",
              body:
                "• **True** — текст говорит то же самое, обычно другими словами.\n• **False** — текст говорит противоположное.\n• **Not Given** — в тексте нет информации, чтобы решить.\n\nГлавная ошибка — отвечать False, когда информации просто нет. Если не можешь показать пальцем на фразу, которая противоречит утверждению, — это Not Given.",
            },
            {
              heading: "Сигнальные слова",
              body:
                "Слова **all, always, never, only, most** в утверждении требуют такой же силы в тексте. «Some cities» в тексте и «all cities» в вопросе — почти всегда False или Not Given.",
            },
          ],
          questions: [
            withPassage(RIVERS, tfng("In the twentieth century, some cities built over small rivers to make space for construction.", 0, "Абзац A: реки закрывали, а землю над ними использовали «for roads, car parks and buildings». Это то же самое другими словами.")),
            withPassage(RIVERS, tfng("Most residents campaigned against covering their local rivers.", 2, "О протестах жителей в тексте ничего нет. Сказано только, что жители забыли о реках, — но это не значит, что они не протестовали.")),
            withPassage(RIVERS, tfng("The Seoul project involved removing a motorway.", 0, "Абзац B: «an elevated motorway was demolished»; demolished = removed.")),
            withPassage(RIVERS, tfng("An open channel is able to carry less water than an underground pipe.", 1, "Абзац C говорит обратное: «An open channel can hold more water than a narrow pipe».")),
            withPassage(RIVERS, tfng("Daylighting projects are always cheaper than maintaining existing culverts.", 1, "Абзац D: убирать дороги и трубы «can cost far more than simply maintaining an existing culvert». Утверждение противоречит тексту.")),
            withPassage(RIVERS, tfng("Experts generally advise beginning with limited sections of river.", 0, "Абзац E: «most experts recommend starting with small, well-studied sections». Limited sections = small sections.")),
          ],
        },
        {
          id: "reading-headings",
          title: "Reading: Matching Headings",
          summary: "Найти главную мысль каждого абзаца",
          skill: "Reading",
          minutes: 15,
          official: SAMPLES,
          theory: [
            {
              body:
                "Даётся список заголовков (обычно больше, чем абзацев) и нужно подобрать заголовок к каждому абзацу. Заголовок отражает **главную мысль** абзаца, а не отдельную деталь.",
            },
            {
              heading: "Стратегия",
              body:
                "• Прочитай первое и последнее предложение абзаца — главная мысль чаще всего там.\n• Сформулируй её своими словами в 3–4 слова.\n• Ищи заголовок, совпадающий по смыслу, а не по одинаковым словам. Совпадение слов — частая ловушка.\n• Начинай с абзацев, в которых уверен, — список сократится.",
            },
          ],
          questions: (
            [
              ["A", 2, ["i The cost of trying to catch up", "ii A biological explanation for late nights", "iii An old complaint reconsidered", "vii The benefits of napping"], "Абзац A: давняя жалоба родителей, которую исследования заставляют пересмотреть — iii."],
              ["B", 1, ["iii An old complaint reconsidered", "ii A biological explanation for late nights", "v Why screens are to blame", "vi A clash with the school day"], "Абзац B о гормоне мелатонине и внутренних часах — биологическое объяснение, ii. Про экраны (v) в тексте нет ни слова."],
              ["C", 3, ["iv Schools change their schedules", "i The cost of trying to catch up", "ii A biological explanation for late nights", "vi A clash with the school day"], "Абзац C: биологический сдвиг «collides with the timetable of most schools» — столкновение со школьным днём, vi. iv — о решении, оно в абзаце E."],
              ["D", 0, ["i The cost of trying to catch up", "vii The benefits of napping", "iii An old complaint reconsidered", "iv Schools change their schedules"], "Абзац D: попытка отоспаться в выходные и её цена — social jet lag. Это i."],
              ["E", 1, ["vi A clash with the school day", "iv Schools change their schedules", "v Why screens are to blame", "ii A biological explanation for late nights"], "Абзац E: школы пробуют начинать позже — iv."],
            ] as const
          ).map(([para, answer, options, explanation]) => ({
            kind: "choice" as const,
            passages: [{ text: SLEEP }],
            prompt: `Choose the correct heading for paragraph ${para}.`,
            options: [...options],
            answer,
            explanation,
          })),
        },
        {
          id: "reading-completion",
          title: "Reading: Sentence Completion",
          summary: "Вписать слова из текста",
          skill: "Reading",
          minutes: 12,
          official: SAMPLES,
          theory: [
            {
              body:
                "В заданиях на дополнение нужно вписать слова **из текста**, соблюдая лимит: «NO MORE THAN TWO WORDS» значит одно или два слова. Превысил лимит — ответ не засчитают, даже если смысл верный.",
            },
            {
              heading: "Стратегия",
              body:
                "• Определи, какая часть речи нужна в пропуске: существительное, прилагательное, число.\n• Найди в тексте место по ключевым словам — вопросы идут в порядке текста.\n• Переписывай слова точно, без изменения формы.\n• Проверь грамматику: предложение с твоим словом должно читаться правильно.",
            },
          ],
          questions: [
            gap("Complete the sentence. Write NO MORE THAN TWO WORDS.\n\nThe waggle dance is performed on the ______ surface of the honeycomb.", ["vertical"], "Второй абзац: «The dance takes place on the vertical surface of the honeycomb»."),
            gap("Complete the sentence. Write NO MORE THAN TWO WORDS.\n\nThe direction of the straight run shows the angle between the food and ______.", ["the sun", "sun"], "«shows the angle between the food source and the sun»."),
            gap("Complete the sentence. Write NO MORE THAN TWO WORDS.\n\nA longer waggle run means that the flowers are ______.", ["further away", "farther away", "further", "farther"], "«the longer the bee waggles, the further away the flowers are»."),
            gap("Complete the sentence. Write NO MORE THAN TWO WORDS.\n\nBees following the dancer also learn the ______ of the flowers it visited.", ["scent"], "«they also pick up the scent of the flowers it has visited»."),
            gap("Complete the sentence. Write NO MORE THAN TWO WORDS.\n\nScientists are still unsure how accurately bees judge distance on ______ days.", ["windy"], "Последний абзац: «how precisely bees can measure distance on windy days»."),
          ].map((q) => withPassage(BEES, q)),
        },
        {
          id: "reading-views",
          title: "Reading: Yes / No / Not Given",
          summary: "Мнение автора и вопросы с выбором",
          skill: "Reading",
          minutes: 12,
          official: SAMPLES,
          theory: [
            {
              body:
                "Yes / No / Not Given похоже на True / False / Not Given, но проверяет **мнения автора**, а не факты. Такие задания идут к текстам-рассуждениям.",
            },
            {
              heading: "Как читать",
              body:
                "• Ищи слова, где автор выражает позицию: I believe, I am not convinced, should, my argument is.\n• Отличай мнение автора от мнений, которые он пересказывает или с которыми спорит.\n• Если автор не высказывается о чём-то — Not Given, даже если тема упомянута.",
            },
          ],
          questions: [
            withPassage(NOTES, { kind: "choice" as const, prompt: "Does the writer believe that the speed of typing is the most important advantage for students?", options: YNNG, answer: 1, explanation: "«I am not convinced that speed is what students most need» — автор с этим не согласен: No." }),
            withPassage(NOTES, { kind: "choice" as const, prompt: "Does the writer claim that all research supports handwriting over typing?", options: YNNG, answer: 1, explanation: "Автор прямо пишет: «The research is not unanimous». Значит, No." }),
            withPassage(NOTES, { kind: "choice" as const, prompt: "Does the writer think universities should prohibit laptops in lectures?", options: YNNG, answer: 1, explanation: "«None of this means that laptops should be banned» — No." }),
            withPassage(NOTES, { kind: "choice" as const, prompt: "Has the writer personally taught courses on note-taking?", options: YNNG, answer: 2, explanation: "О собственном опыте преподавания автор ничего не говорит — Not Given." }),
            withPassage(NOTES, {
              kind: "choice" as const,
              prompt: "According to the writer, why might handwriting help learning?",
              options: [
                "It forces students to select and rephrase ideas.",
                "It is faster than typing.",
                "Handwritten notes are easier to search.",
                "Lecturers prefer handwritten notes.",
              ],
              answer: 0,
              explanation: "«We are forced to decide what matters and to put ideas into our own words, and that act of selection is itself a form of learning».",
            }),
            withPassage(NOTES, {
              kind: "choice" as const,
              prompt: "What is the writer's main recommendation?",
              options: [
                "Universities should teach students how to take notes.",
                "Students should always write by hand.",
                "Laptops should be banned from lecture halls.",
                "Notes should be shared online after every lecture.",
              ],
              answer: 0,
              explanation: "«My argument is a narrower one: universities should teach students how to take notes».",
            }),
          ],
        },
      ],
    },

    // ------------------------------------------------------- Vocabulary --
    {
      id: "vocabulary",
      title: "Vocabulary",
      subtitle: "Академическая лексика и перефразирование",
      lessons: [
        {
          id: "vocab-collocations",
          title: "Vocabulary: Academic Collocations",
          summary: "Слова, которые ходят парами",
          skill: "Vocabulary",
          minutes: 10,
          theory: [
            {
              body:
                "Lexical Resource — четверть оценки за Writing и Speaking. Экзаменаторы ценят не редкие слова, а **точные сочетания**: conduct research, a significant increase, have an impact on.",
            },
            {
              heading: "Сочетания, которые стоит знать",
              body:
                "• **conduct / carry out** a study, research, a survey\n• **implement / introduce** a policy, a measure\n• a **significant / sharp / gradual** increase / decline\n• **have an impact / effect on**; affect — глагол, effect — существительное\n• **support / confirm / challenge** a hypothesis, a claim",
            },
          ],
          questions: [
            { kind: "choice", prompt: "The government plans to ______ a new policy on renewable energy.", options: ["make", "implement", "do", "carry"], answer: 1, explanation: "Policy «внедряют» — implement a policy. Make и do с policy не сочетаются." },
            { kind: "choice", prompt: "The researchers ______ a study of 2,000 participants.", options: ["conducted", "made", "did up", "took"], answer: 0, explanation: "Conduct a study — стандартное академическое сочетание." },
            { kind: "choice", prompt: "There has been a ______ increase in the number of international students.", options: ["significant", "strong-minded", "high", "heavy"], answer: 0, explanation: "A significant increase. «High increase» и «heavy increase» звучат неестественно." },
            { kind: "choice", prompt: "The ______ of the new bridge took three years.", options: ["construct", "constructive", "construction", "constructively"], answer: 2, explanation: "После «The» и перед «of» нужно существительное: construction." },
            { kind: "choice", prompt: "These findings ______ the hypothesis that sleep improves memory.", options: ["support", "agree", "approve", "accept to"], answer: 0, explanation: "Findings support a hypothesis. Agree требует with, approve — of." },
            { kind: "choice", prompt: "Air pollution has a negative ______ on public health.", options: ["affect", "impact", "affecting", "effective"], answer: 1, explanation: "Нужно существительное: an impact on. Affect — глагол." },
          ],
        },
        {
          id: "vocab-paraphrase",
          title: "Vocabulary: Paraphrasing",
          summary: "Тот же смысл — другими словами",
          skill: "Vocabulary",
          minutes: 10,
          theory: [
            {
              body:
                "IELTS почти никогда не повторяет слова текста в вопросах: вопросы и ответы перефразированы. Умение узнавать перефразирование — ключ к Reading и Listening, а умение перефразировать — к Writing.",
            },
            {
              heading: "Приёмы перефразирования",
              body:
                "• Синонимы: rise → increase, reduce → cut.\n• Смена части речи: rose sharply → a sharp rise.\n• Смена конструкции: It is widely believed that… → Many people think…\n• Числа и сравнения: doubled → twice as many.",
            },
            {
              heading: "Осторожно",
              body: "**Few** = почти никто, **a few** = несколько. Hardly any, only a small number — синонимы few.",
            },
          ],
          questions: [
            {
              kind: "choice",
              prompt: "Which sentence is closest in meaning to: “The number of cars in the city has doubled since 2010.”",
              options: [
                "There are twice as many cars in the city now as there were in 2010.",
                "Car ownership in the city fell by half after 2010.",
                "Two new car factories have opened in the city since 2010.",
                "The city had more cars in 2010 than it has today.",
              ],
              answer: 0,
              explanation: "Doubled = twice as many.",
            },
            {
              kind: "choice",
              prompt: "Which sentence is closest in meaning to: “Few students completed the survey.”",
              options: [
                "Only a small number of students filled in the questionnaire.",
                "Several students enjoyed answering the survey.",
                "Most students completed the survey.",
                "The survey was given to only a few students.",
              ],
              answer: 0,
              explanation: "Few — почти никто; only a small number — точный перифраз. D меняет смысл: опрос раздали немногим, а не немногие его заполнили.",
            },
            {
              kind: "choice",
              prompt: "Which sentence is closest in meaning to: “The study's findings were inconclusive.”",
              options: [
                "The results did not lead to a clear answer.",
                "The study was never finished.",
                "The results were surprising.",
                "The findings were proved wrong.",
              ],
              answer: 0,
              explanation: "Inconclusive — не приводящий к однозначному выводу.",
            },
            {
              kind: "choice",
              prompt: "Which sentence is closest in meaning to: “It is widely believed that exercise improves mood.”",
              options: [
                "Many people think that physical activity makes people feel better.",
                "Scientists have proved that exercise always improves mood.",
                "Few people agree that exercise affects mood.",
                "Exercise is believed to be harmful in some cases.",
              ],
              answer: 0,
              explanation: "Widely believed = many people think. B слишком сильный: «proved», «always».",
            },
            {
              kind: "choice",
              prompt: "Which sentence is closest in meaning to: “Rising costs have deterred many families from travelling abroad.”",
              options: [
                "Because prices have gone up, many families have been discouraged from going abroad.",
                "Many families travel abroad because it has become cheaper.",
                "Families who travel abroad spend more money than before.",
                "Rising costs have encouraged families to travel more often.",
              ],
              answer: 0,
              explanation: "Deter from = discourage from; rising costs = prices have gone up.",
            },
          ],
        },
      ],
    },

    // -------------------------------------------------------- Listening --
    {
      id: "listening",
      title: "Listening",
      subtitle: "Четыре части, 40 вопросов, около 30 минут",
      lessons: [
        {
          id: "listening-form",
          title: "Listening: Form Completion",
          summary: "Часть 1: разговор и анкета",
          skill: "Listening",
          minutes: 12,
          official: SAMPLES,
          theory: [
            {
              body:
                "Listening состоит из четырёх частей: 1 — бытовой диалог, 2 — бытовой монолог, 3 — учебная дискуссия, 4 — лекция. На экзамене **запись звучит один раз**. В Части 1 обычно нужно заполнить анкету: имена, числа, даты, адреса.",
            },
            {
              heading: "На что обратить внимание",
              body:
                "• Имена и фамилии произносят по буквам — записывай буква за буквой.\n• Говорящие поправляют себя: «Monday… actually, Monday is a holiday» — верен второй вариант.\n• Перед записью у тебя есть время прочитать вопросы. Предскажи, какой ответ нужен: число, слово, дата.",
            },
          ],
          listening: {
            title: "Joining a sports centre",
            context: "You will hear a woman phoning a sports centre to ask about membership.",
            lines: [
              { speaker: "Receptionist", text: "Good morning, Riverside Sports Centre. How can I help you?" },
              { speaker: "Caller", text: "Hi, I'd like to join the centre. Can I do that over the phone?" },
              { speaker: "Receptionist", text: "Of course. I just need a few details. Could I have your surname, please?" },
              { speaker: "Caller", text: "Yes, it's Karimova. That's K, A, R, I, M, O, V, A." },
              { speaker: "Receptionist", text: "Thank you. And which membership are you interested in? We have a standard membership and a student membership." },
              { speaker: "Caller", text: "I'm at college, so the student one, please. How much is that?" },
              { speaker: "Receptionist", text: "It's thirty-two pounds a month. The standard one is forty-five." },
              { speaker: "Caller", text: "Thirty-two is fine. Does that include the swimming pool?" },
              { speaker: "Receptionist", text: "It includes the pool and the gym, but not the tennis courts. Those you book separately, at six pounds an hour." },
              { speaker: "Caller", text: "OK. And when could I start?" },
              { speaker: "Receptionist", text: "The earliest would be next Monday. Oh, actually, Monday is a bank holiday, so we're closed. You could start on Tuesday the fourteenth." },
              { speaker: "Caller", text: "Tuesday's great." },
              { speaker: "Receptionist", text: "Perfect. Please bring your student card with you on your first visit. We'll need to see it before we can activate the membership." },
            ],
          },
          questions: [
            gap("Complete the form. Write ONE WORD AND/OR A NUMBER.\n\nSurname: ______", ["Karimova"], "Фамилию произносят по буквам: K-A-R-I-M-O-V-A."),
            gap("Type of membership: ______", ["student"], "«I'm at college, so the student one, please»."),
            gap("Monthly cost: £______", ["32", "thirty-two"], "Студенческий абонемент — thirty-two pounds. Forty-five — стандартный, это отвлекающая цифра."),
            gap("Tennis courts: £______ per hour", ["6", "six"], "«at six pounds an hour»."),
            gap("Start date: Tuesday the ______", ["14", "14th", "fourteenth"], "Сначала звучит Monday, но его тут же исправляют: Monday is a bank holiday. Верно — Tuesday the fourteenth."),
            gap("Bring on first visit: ______ card", ["student"], "«Please bring your student card with you on your first visit»."),
          ],
        },
        {
          id: "listening-lecture",
          title: "Listening: Lecture",
          summary: "Часть 4: лекция и вопросы с выбором",
          skill: "Listening",
          minutes: 12,
          official: SAMPLES,
          theory: [
            {
              body:
                "Часть 4 — академическая лекция одного говорящего без пауз. Вопросы идут в порядке лекции. Слушай **структуру**: лектор сам подсказывает, что сейчас будет важное.",
            },
            {
              heading: "Сигналы лектора",
              body:
                "• **That's the key point** / The main reason is — сейчас прозвучит ответ.\n• **Rarely… More often…** — противопоставление: верен второй вариант.\n• **Important, but on its own it doesn't…** — уступка, за которой ограничение.\n• **For next week** — в конце часто есть вопрос о задании.",
            },
          ],
          listening: {
            title: "Why languages disappear",
            context: "You will hear part of a lecture on language endangerment.",
            lines: [
              { speaker: "Lecturer", text: "Good afternoon. Today I want to look at language endangerment, in other words, why some languages stop being spoken. Linguists estimate that there are around seven thousand languages in the world today, and a large share of them are spoken by relatively small communities." },
              { speaker: "Lecturer", text: "A language is usually considered endangered when children are no longer learning it at home. That's the key point. A language can have thousands of elderly speakers and still be in danger, if the next generation isn't picking it up." },
              { speaker: "Lecturer", text: "So why does this happen? Rarely because people are forbidden to speak a language, although that has certainly happened in history. More often, families make a practical choice. If a different language offers better jobs or a better education, parents may decide to speak that language with their children." },
              { speaker: "Lecturer", text: "What can be done? Recording and documenting languages is important, but on its own it doesn't keep a language alive. The most successful revival programmes have focused on very young children, for example, so-called language nests, where pre-school children are cared for entirely in the community language." },
              { speaker: "Lecturer", text: "Technology may also help. Some communities have created keyboards, online dictionaries and even social media groups in their languages, which makes them feel modern rather than old-fashioned to teenagers." },
              { speaker: "Lecturer", text: "For next week, I'd like you to read the article on the Māori language nest movement in New Zealand, which we'll use as our first case study." },
            ],
          },
          questions: [
            {
              kind: "choice",
              prompt: "According to the lecturer, a language is usually considered endangered when",
              options: [
                "children no longer learn it at home.",
                "it has fewer than a thousand speakers.",
                "it is not taught at universities.",
                "it has no written form.",
              ],
              answer: 0,
              explanation: "«A language is usually considered endangered when children are no longer learning it at home. That's the key point.»",
            },
            {
              kind: "choice",
              prompt: "What does the lecturer say is the most common reason families stop using a language?",
              options: [
                "Another language offers better jobs or education.",
                "The government has banned the language.",
                "Teachers put pressure on parents.",
                "The grammar is too difficult for children.",
              ],
              answer: 0,
              explanation: "«Rarely because people are forbidden… More often, families make a practical choice» — работа и образование.",
            },
            {
              kind: "choice",
              prompt: "What is the lecturer's view of documenting languages?",
              options: [
                "It is useful but not enough by itself.",
                "It is the main solution to the problem.",
                "It is a waste of resources.",
                "It is only of interest to linguists.",
              ],
              answer: 0,
              explanation: "«important, but on its own it doesn't keep a language alive».",
            },
            {
              kind: "choice",
              prompt: "'Language nests' are programmes for",
              options: ["pre-school children.", "teenagers.", "elderly speakers.", "university students."],
              answer: 0,
              explanation: "«where pre-school children are cared for entirely in the community language».",
            },
            {
              kind: "choice",
              prompt: "What will students read for next week?",
              options: [
                "An article about language nests in New Zealand.",
                "A dictionary of an endangered language.",
                "A report on technology in schools.",
                "A history of language bans.",
              ],
              answer: 0,
              explanation: "«read the article on the Māori language nest movement in New Zealand».",
            },
          ],
        },
      ],
    },

    // --------------------------------------------------------- Speaking --
    {
      id: "speaking",
      title: "Speaking",
      subtitle: "Интервью с экзаменатором, 11–14 минут",
      lessons: [
        {
          id: "speaking-part1",
          title: "Speaking: Part 1",
          summary: "Вопросы о тебе и привычных темах",
          skill: "Speaking",
          minutes: 8,
          official: SAMPLES,
          theory: [
            {
              body:
                "Speaking — живой разговор с экзаменатором из трёх частей. Часть 1 (4–5 минут) — простые вопросы о тебе: дом, учёба, хобби. Оценивают четыре критерия: Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, Pronunciation.",
            },
            {
              heading: "Как отвечать",
              body:
                "• Отвечай в 2–3 предложениях: ответ → причина → пример.\n• Не отвечай одним словом и не уходи в монолог на минуту.\n• Используй связки: because, so, actually, for example, although.",
            },
            {
              heading: "Пример",
              body:
                "Q: Do you prefer printed books or reading on a screen?\nA: I definitely prefer printed books, **because** I find it easier to concentrate on paper. **For example**, when I read on my phone, I keep checking messages, **so** I hardly remember what I've read.",
            },
          ],
          questions: [],
          speaking: {
            part: 1,
            intro: "Good morning. My name is Sarah, and I'll be your examiner today. In this first part, I'd like to ask you some questions about yourself.",
            questions: [
              "Let's talk about where you live. Do you live in a house or an apartment?",
              "What do you like most about your neighbourhood?",
              "Do you work, or are you a student?",
              "What subject do you enjoy most, and why?",
              "Let's move on to reading. How often do you read for pleasure?",
              "Do you prefer printed books or reading on a screen? Why?",
            ],
            targetWords: [20, 60],
          },
        },
        {
          id: "speaking-part2",
          title: "Speaking: Part 2",
          summary: "Монолог по карточке",
          skill: "Speaking",
          minutes: 10,
          official: SAMPLES,
          theory: [
            {
              body:
                "В Части 2 экзаменатор даёт карточку с темой и тремя-четырьмя пунктами. Минута на подготовку (можно делать пометки), затем говоришь **от одной до двух минут** без перерыва. В конце — один-два коротких вопроса.",
            },
            {
              heading: "Структура монолога",
              body:
                "• Вступление: о чём ты расскажешь.\n• Пройди по пунктам карточки по порядку — это готовый план.\n• Последний пункт («explain…») — самый важный: здесь нужно рассуждение, а не факты.\n• Используй прошедшие времена, если тема о прошлом, и связки последовательности: at first, after a while, eventually.",
            },
          ],
          questions: [],
          speaking: {
            part: 2,
            intro: "Now I'm going to give you a topic, and I'd like you to talk about it for one to two minutes. You have one minute to think about what you're going to say. You can make some notes if you wish.",
            questions: [
              "Please describe a skill you learned that was difficult at first.",
              "Do you think you will keep developing this skill in the future?",
            ],
            cueCard: {
              topic: "Describe a skill you learned that was difficult at first.",
              points: ["what the skill was", "when and how you learned it", "why it was difficult", "and explain how you feel about it now"],
            },
            targetWords: [150, 280],
          },
        },
        {
          id: "speaking-part3",
          title: "Speaking: Part 3",
          summary: "Дискуссия на абстрактные темы",
          skill: "Speaking",
          minutes: 10,
          official: SAMPLES,
          theory: [
            {
              body:
                "Часть 3 (4–5 минут) продолжает тему Части 2, но вопросы общие и абстрактные: общество, образование, будущее. Здесь проверяют умение **рассуждать**: высказать мнение, обосновать, сравнить, предположить.",
            },
            {
              heading: "Полезные конструкции",
              body:
                "• Мнение: I'd say that…, From my point of view…\n• Уступка: Although…, While it's true that…\n• Предположение: It's likely that…, In the future, people might…\n• Сравнение: Compared with my parents' generation, …",
            },
          ],
          questions: [],
          speaking: {
            part: 3,
            intro: "We've been talking about a skill you learned. I'd like to discuss with you some more general questions related to this.",
            questions: [
              "What skills do you think young people need most today?",
              "Should schools teach practical skills, such as cooking or managing money? Why or why not?",
              "Some people say technology makes it easier to learn new skills. Do you agree?",
              "How might the skills that employers value change in the future?",
            ],
            targetWords: [40, 110],
          },
        },
      ],
    },

    // ---------------------------------------------------------- Writing --
    {
      id: "writing",
      title: "Writing",
      subtitle: "Две задачи, 60 минут",
      lessons: [
        {
          id: "writing-task1",
          title: "Writing: Task 1",
          summary: "Описать таблицу или график",
          skill: "Writing",
          minutes: 25,
          official: SAMPLES,
          theory: [
            {
              body:
                "Task 1 — описание графика, таблицы, диаграммы или процесса, **не меньше 150 слов** за 20 минут. Мнение не нужно: только факты и сравнения. Task 1 весит вдвое меньше, чем Task 2.",
            },
            {
              heading: "Структура из четырёх абзацев",
              body:
                "• **Введение** — перефразируй задание одним предложением.\n• **Overview** — 1–2 предложения о главных тенденциях без цифр. Без overview оценка за Task Achievement редко выше 5.\n• **Детали 1 и 2** — сгруппируй данные и подкрепи цифрами.",
            },
            {
              heading: "Язык",
              body:
                "rose sharply / fell slightly / remained stable / peaked at / the lowest figure / compared with / while / whereas. Не перечисляй все числа подряд — выбирай ключевые.",
            },
          ],
          questions: [
            {
              kind: "choice",
              table: MUSEUMS,
              prompt: "Which sentence is the best overview for this table?",
              options: [
                "Overall, the Science Museum was the most popular throughout the period, and all three museums saw a sharp fall in 2021.",
                "In 2015, the Science Museum had 420,000 visitors.",
                "I think museums are very important for a city.",
                "The table shows visitors to three museums between 2015 and 2023.",
              ],
              answer: 0,
              explanation: "Overview называет главные тенденции без конкретных цифр. B — деталь, C — мнение (не нужно в Task 1), D — пересказ задания (это введение).",
            },
            {
              kind: "choice",
              table: MUSEUMS,
              prompt: "Which sentence describes the Art Gallery accurately?",
              options: [
                "Visitor numbers at the Art Gallery declined gradually from 310,000 in 2015 to 290,000 in 2019.",
                "The Art Gallery became the most visited museum in 2023.",
                "Visitor numbers at the Art Gallery rose steadily throughout the period.",
                "The Art Gallery had the fewest visitors in every year.",
              ],
              answer: 0,
              explanation: "310 → 300 → 290: постепенный спад. В 2023 году лидер — Science Museum; меньше всех чаще History Museum.",
            },
            {
              kind: "choice",
              table: MUSEUMS,
              prompt: "Which comparison is correct?",
              options: [
                "By 2023, the History Museum had overtaken the Art Gallery.",
                "The History Museum always had more visitors than the Art Gallery.",
                "The Science Museum had fewer visitors in 2023 than in 2015.",
                "All three museums recovered to their 2019 levels by 2023.",
              ],
              answer: 0,
              explanation: "В 2023 году History Museum — 270 тыс., Art Gallery — 260 тыс. Art Gallery до 2019 уровня (290) не восстановилась.",
            },
          ],
          writing: {
            prompt:
              "The table below shows the number of visitors (in thousands) to three museums in one city between 2015 and 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
            minWords: 150,
            maxWords: 220,
            table: MUSEUMS,
            rubric: [
              "Введение перефразирует задание, а не копирует его",
              "Есть overview с главными тенденциями (Overall, …)",
              "Данные сгруппированы и сравнены, ключевые цифры названы",
              "Нет личного мнения",
              "Четыре абзаца",
            ],
            starters: ["The table illustrates…", "Overall, …", "In contrast, …", "By 2023, …"],
            checks: { profile: "ielts1" },
          },
        },
        {
          id: "writing-task2",
          title: "Writing: Task 2",
          summary: "Эссе: обсудить две точки зрения",
          skill: "Writing",
          minutes: 40,
          official: SAMPLES,
          theory: [
            {
              body:
                "Task 2 — эссе **не меньше 250 слов** за 40 минут. Типы заданий: agree/disagree, discuss both views, advantages/disadvantages, problem/solution. Самая частая потеря баллов — **не ответить на все части вопроса**.",
            },
            {
              heading: "Структура «discuss both views and give your opinion»",
              body:
                "• **Введение** — перефразируй тему и сразу дай свою позицию.\n• **Абзац 1** — первая точка зрения с объяснением и примером.\n• **Абзац 2** — вторая точка зрения.\n• **Заключение** — повтори позицию, ничего нового.",
            },
            {
              heading: "Что оценивают",
              body:
                "Task Response, Coherence and Cohesion, Lexical Resource, Grammatical Range and Accuracy — по четверти оценки каждый. Связки (However, Furthermore, As a result) должны быть разными и уместными, а не в каждом предложении.",
            },
          ],
          questions: [
            {
              kind: "choice",
              prompt:
                "Task: “Some people believe that universities should focus on preparing students for employment. Others think universities should offer knowledge for its own sake. Discuss both views and give your own opinion.” Which parts must the essay include?",
              options: [
                "Both views and the writer's own opinion",
                "Only the writer's opinion",
                "Advantages and disadvantages of employment",
                "A solution to unemployment",
              ],
              answer: 0,
              explanation: "Задание из трёх частей: view 1, view 2, your opinion. Пропуск любой части ограничивает Task Response.",
            },
            {
              kind: "choice",
              prompt: "Which is the strongest final sentence for the introduction?",
              options: [
                "While job preparation matters, I believe universities should, above all, teach students to think independently.",
                "This essay will talk about universities.",
                "There are many opinions about this topic.",
                "Universities are very important in the modern world.",
              ],
              answer: 0,
              explanation: "Сильная позиция — конкретная и спорная, с намёком на обе стороны. Остальные варианты ничего не утверждают.",
            },
            {
              kind: "choice",
              prompt: "Which linking phrase best introduces the opposing view in the second body paragraph?",
              options: ["On the other hand,", "As a result,", "For instance,", "In addition,"],
              answer: 0,
              explanation: "Противопоставление — On the other hand. As a result — следствие, For instance — пример, In addition — добавление.",
            },
          ],
          writing: {
            prompt:
              "Some people believe that universities should focus on preparing students for employment. Others think universities should offer knowledge for its own sake. Discuss both views and give your own opinion. Write at least 250 words.",
            minWords: 250,
            maxWords: 340,
            rubric: [
              "Обе точки зрения раскрыты в отдельных абзацах",
              "Позиция автора ясна во введении и в заключении",
              "У каждой идеи есть объяснение и пример",
              "Связки разнообразны и уместны",
              "Четыре-пять абзацев",
            ],
            starters: ["It is often argued that…", "On the one hand, …", "On the other hand, …", "In conclusion, …"],
            checks: { profile: "ielts2" },
          },
        },
      ],
    },
  ],
};

/**
 * The order IELTS lessons appear in the track: skills interleaved so no two
 * IELTS days in a row train the same thing.
 */
export const IELTS_ORDER = [
  "reading-tfng",
  "listening-form",
  "vocab-collocations",
  "speaking-part1",
  "writing-task1",
  "reading-headings",
  "listening-lecture",
  "vocab-paraphrase",
  "speaking-part2",
  "reading-completion",
  "writing-task2",
  "reading-views",
  "speaking-part3",
];
