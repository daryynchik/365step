import type { ChoiceQuestion, InputQuestion, Unit } from "./types";

/**
 * IELTS, second pass: new reading passages, recordings, writing tasks and a
 * speaking card, scheduled after the first pass so the IELTS days continue.
 */

const SAMPLES = {
  label: "Официальные примеры заданий IELTS (ielts.org)",
  url: "https://ielts.org/take-a-test/preparation-resources/sample-test-questions",
};

const TFNG = ["True", "False", "Not Given"];
const YNNG = ["Yes", "No", "Not Given"];

const choice = (passage: string | undefined, prompt: string, options: string[], answer: number, explanation: string): ChoiceQuestion => ({
  kind: "choice",
  passages: passage ? [{ text: passage }] : undefined,
  prompt,
  options,
  answer,
  explanation,
});

const gap = (passage: string | undefined, prompt: string, answers: string[], explanation: string): InputQuestion => ({
  kind: "input",
  passages: passage ? [{ text: passage }] : undefined,
  prompt,
  answers,
  explanation,
});

const GLACIERS = `**Watching a glacier shrink**

A  High in the mountains south of Almaty lies the Tuyuksu glacier, one of the most closely studied glaciers in Central Asia. Scientists have measured it regularly since the 1950s, recording how much snow it gains each winter and how much ice it loses each summer.

B  Their records show that, like most mountain glaciers around the world, Tuyuksu has been losing more ice than it gains for decades. Its front edge has moved hundreds of metres uphill, and the glacier has become noticeably thinner.

C  This matters far beyond the mountains. Rivers that flow from the Tien Shan supply water to cities and farms on the plains below. In hot, dry summers, meltwater from glaciers can make up a large share of river flow just when demand for water is highest.

D  In the short term, faster melting can actually increase the amount of water in rivers. Over the longer term, however, smaller glaciers will hold less ice to melt, and summer flows are expected to fall. Planners therefore face the challenge of preparing for a future in which water may be scarcer precisely when it is most needed.`;

const BIKES = `**From hobby horse to modern bicycle**

List of headings
i    A dangerous design that was popular with young men
ii   A machine without pedals
iii  The tyre that made riding comfortable
iv   Why bicycles are better than cars
v    Adding pedals to the front wheel
vi   A safer shape that lasted

A  In 1817 the German inventor Karl Drais demonstrated a two-wheeled “running machine”. Riders sat between the wheels and pushed themselves along with their feet. It was fast on smooth paths but useless on rough roads.

B  In the 1860s, French makers attached pedals directly to the front wheel, creating the velocipede. Riders no longer had to touch the ground, but the heavy wooden frames and iron tyres earned these machines the nickname “boneshakers”.

C  Because one turn of the pedals meant one turn of the front wheel, makers began enlarging that wheel to go faster. The result, the high-wheeled “penny-farthing”, could be very quick and became fashionable among daring young men, but riders sat so high that falls were frequent and often serious.

D  In the 1880s, the so-called safety bicycle brought back two wheels of similar size and used a chain to drive the rear wheel. Its basic layout is still used in most bicycles today.

E  The last major problem was comfort. In 1888 John Boyd Dunlop developed a practical air-filled tyre, which absorbed bumps far better than solid rubber and helped make cycling popular with the general public.`;

const HEADPHONES = `**How noise-cancelling headphones work**

Sound travels as waves of changing air pressure. Noise-cancelling headphones use small microphones to detect sound from the surroundings. A chip inside the headphones then produces a second sound wave that is the exact mirror image of the first: where the original wave has high pressure, the new one has low pressure.

When the two waves meet, they cancel each other out, an effect known as destructive interference. This works best for steady, low-pitched sounds, such as the hum of an aircraft engine. Sudden or high-pitched sounds, like voices or a dog barking, change too quickly to be cancelled completely, which is why the headphones also rely on well-sealed ear cushions to block them physically.`;

const CARFREE = `**Should city centres be car-free?**

Several European cities have closed parts of their centres to private cars, and the results are often presented as an unqualified success. Air quality improves, streets become quieter and pedestrians fill spaces once occupied by traffic. I support these changes, but I think their success depends on conditions that are too often ignored.

A car-free centre works when people have good alternatives: frequent public transport, safe cycle routes and shops within walking distance. Without them, closing streets simply moves traffic to surrounding neighbourhoods and makes life harder for older and disabled residents. The cities that have succeeded usually spent years improving transport before they removed a single car.

Shopkeepers are often the loudest opponents, fearing that customers will disappear. The evidence on this is mixed; some businesses gain from greater numbers of pedestrians, while those selling heavy goods may lose out. Cities should therefore introduce such schemes gradually and adjust them according to what actually happens.`;

const MONITOR = {
  caption: "Households with internet access (%)",
  head: ["Year", "Region A", "Region B", "Region C"],
  rows: [
    ["2005", "20", "8", "35"],
    ["2010", "45", "15", "60"],
    ["2015", "70", "35", "78"],
    ["2020", "88", "62", "90"],
  ],
};

export const IELTS_PRACTICE: Unit[] = [
  {
    id: "reading-practice",
    title: "Reading · практика",
    subtitle: "Новые тексты в форматах IELTS",
    lessons: [
      {
        id: "p-reading-tfng",
        title: "Reading: True / False / Not Given (2)",
        summary: "Новый текст: ледники Тянь-Шаня",
        skill: "Reading",
        minutes: 15,
        official: SAMPLES,
        theory: [{ body: "Вспомни правило: **False** — текст говорит обратное, **Not Given** — информации нет. Ищи фразу, на которую можно показать пальцем." }],
        questions: [
          choice(GLACIERS, "The Tuyuksu glacier has been measured regularly since the 1950s.", TFNG, 0, "Абзац A: «Scientists have measured it regularly since the 1950s»."),
          choice(GLACIERS, "Tuyuksu is the largest glacier in Central Asia.", TFNG, 2, "Сказано «one of the most closely studied», о размере ничего нет."),
          choice(GLACIERS, "The front edge of the glacier has moved downhill.", TFNG, 1, "Абзац B: край сдвинулся «uphill» — вверх."),
          choice(GLACIERS, "Glacier meltwater can be especially important in hot, dry summers.", TFNG, 0, "Абзац C прямо это утверждает."),
          choice(GLACIERS, "Faster melting always reduces the amount of water in rivers.", TFNG, 1, "Абзац D: в краткосрочной перспективе таяние может увеличить сток."),
          choice(GLACIERS, "Planners in Almaty have already built new reservoirs.", TFNG, 2, "О водохранилищах в тексте ничего нет."),
        ],
      },
      {
        id: "p-reading-headings",
        title: "Reading: Matching Headings (2)",
        summary: "Новый текст: история велосипеда",
        skill: "Reading",
        minutes: 15,
        official: SAMPLES,
        theory: [{ body: "Заголовок — главная мысль абзаца, а не деталь. Совпадение слов в заголовке и абзаце — частая ловушка." }],
        questions: (
          [
            ["A", 1, ["i A dangerous design that was popular with young men", "ii A machine without pedals", "v Adding pedals to the front wheel", "vi A safer shape that lasted"], "Машина Драйса двигалась толчками ног — без педалей (ii)."],
            ["B", 2, ["iii The tyre that made riding comfortable", "vi A safer shape that lasted", "v Adding pedals to the front wheel", "ii A machine without pedals"], "Педали на переднем колесе — велосипед-«костотряс» (v)."],
            ["C", 0, ["i A dangerous design that was popular with young men", "iv Why bicycles are better than cars", "iii The tyre that made riding comfortable", "vi A safer shape that lasted"], "Penny-farthing — быстрый, модный среди смелых молодых людей и опасный: это заголовок i."],
            ["D", 3, ["v Adding pedals to the front wheel", "ii A machine without pedals", "iv Why bicycles are better than cars", "vi A safer shape that lasted"], "Safety bicycle: схема, которая сохранилась до наших дней (vi)."],
            ["E", 1, ["vi A safer shape that lasted", "iii The tyre that made riding comfortable", "i A dangerous design that was popular with young men", "iv Why bicycles are better than cars"], "Пневматическая шина Данлопа — комфорт (iii)."],
          ] as const
        ).map(([para, answer, options, explanation]) => choice(BIKES, `Choose the correct heading for paragraph ${para}.`, [...options], answer, explanation)),
      },
      {
        id: "p-reading-completion",
        title: "Reading: Sentence Completion (2)",
        summary: "Новый текст: шумоподавление",
        skill: "Reading",
        minutes: 12,
        official: SAMPLES,
        theory: [{ body: "Лимит слов — строгий. Определи, какая часть речи нужна, найди место по ключевым словам и перепиши слова из текста точно." }],
        questions: [
          gap(HEADPHONES, "Complete the sentence. Write NO MORE THAN TWO WORDS.\n\nThe headphones use small ______ to detect surrounding sound.", ["microphones"], "«use small microphones to detect sound»."),
          gap(HEADPHONES, "Complete the sentence. Write NO MORE THAN TWO WORDS.\n\nThe new wave is the exact ______ of the original wave.", ["mirror image"], "«the exact mirror image of the first»."),
          gap(HEADPHONES, "Complete the sentence. Write NO MORE THAN TWO WORDS.\n\nThe cancelling effect is called destructive ______.", ["interference"], "«an effect known as destructive interference»."),
          gap(HEADPHONES, "Complete the sentence. Write ONE WORD ONLY.\n\nThe technology works best for steady, ______ sounds such as an engine's hum.", ["low-pitched", "low pitched"], "«steady, low-pitched sounds»."),
          gap(HEADPHONES, "Complete the sentence. Write NO MORE THAN TWO WORDS.\n\nSudden sounds are blocked physically by well-sealed ______.", ["ear cushions", "cushions"], "«well-sealed ear cushions to block them physically»."),
        ],
      },
      {
        id: "p-reading-views",
        title: "Reading: Yes / No / Not Given (2)",
        summary: "Новый текст: города без машин",
        skill: "Reading",
        minutes: 12,
        official: SAMPLES,
        theory: [{ body: "Yes / No / Not Given — о мнении автора. Отличай его взгляды от взглядов, которые он пересказывает." }],
        questions: [
          choice(CARFREE, "Does the writer support car-free city centres?", YNNG, 0, "«I support these changes»."),
          choice(CARFREE, "Does the writer believe car-free schemes succeed regardless of local conditions?", YNNG, 1, "Наоборот: успех «depends on conditions that are too often ignored»."),
          choice(CARFREE, "Does the writer think older residents prefer to drive?", YNNG, 2, "Автор говорит, что без альтернатив им станет труднее, но не об их предпочтениях."),
          choice(CARFREE, "Does the writer recommend introducing schemes all at once?", YNNG, 1, "«introduce such schemes gradually»."),
          choice(CARFREE, "What does the writer say about the effect on shops?", [
            "The evidence is mixed: some gain and some may lose.",
            "All shops lose customers.",
            "All shops gain customers.",
            "Shops are not affected.",
          ], 0, "«The evidence on this is mixed»."),
          choice(CARFREE, "According to the writer, what did successful cities usually do first?", [
            "Improve public transport and cycling for years",
            "Close every street at once",
            "Ask shopkeepers to leave",
            "Build more car parks",
          ], 0, "«spent years improving transport before they removed a single car»."),
        ],
      },
    ],
  },
  {
    id: "listening-practice",
    title: "Listening · практика",
    subtitle: "Новые записи частей 2 и 3",
    lessons: [
      {
        id: "p-listening-part2",
        title: "Listening: Part 2",
        summary: "Монолог: информация о парке",
        skill: "Listening",
        minutes: 12,
        official: SAMPLES,
        theory: [{ body: "Часть 2 — монолог на бытовую тему: экскурсия, объявление, инструктаж. Следи за числами, временем и за тем, что говорящий **исправляет**." }],
        listening: {
          title: "Riverside Park visitor information",
          context: "You will hear a guide giving information to a group of visitors at a city park.",
          lines: [
            { speaker: "Guide", text: "Good morning, everyone, and welcome to Riverside Park. Before you set off, let me give you a few practical details." },
            { speaker: "Guide", text: "The park is open every day from seven in the morning until ten at night, although the glasshouses close earlier, at six." },
            { speaker: "Guide", text: "If you'd like something to eat, the café is next to the main lake, not by the entrance as it used to be. It moved there last spring." },
            { speaker: "Guide", text: "We run a free guided walk every afternoon. It used to start at two o'clock, but this season it begins at half past three, from the clock tower." },
            { speaker: "Guide", text: "Bicycles can be hired near the north gate for eight hundred tenge an hour. Please remember that cycling isn't allowed in the rose garden." },
            { speaker: "Guide", text: "And finally, if you lose anything, the lost property office is in the visitor centre, which is the green building on your left." },
          ],
        },
        questions: [
          gap(undefined, "Complete the notes. Write ONE WORD AND/OR A NUMBER.\n\nThe glasshouses close at ______ p.m.", ["6", "six"], "«the glasshouses close earlier, at six»."),
          choice(undefined, "Where is the café now?", ["Next to the main lake", "By the entrance", "In the visitor centre", "Near the north gate"], 0, "Кафе переехало к озеру; у входа оно было раньше."),
          choice(undefined, "What time does the guided walk start this season?", ["3:30", "2:00", "3:00", "4:30"], 0, "Раньше в два, теперь в половине четвёртого."),
          gap(undefined, "Bicycle hire costs ______ tenge an hour.", ["800", "eight hundred"], "«eight hundred tenge an hour»."),
          choice(undefined, "Where is cycling not allowed?", ["In the rose garden", "Near the lake", "At the north gate", "On the main paths"], 0, "«cycling isn't allowed in the rose garden»."),
        ],
      },
      {
        id: "p-listening-part3",
        title: "Listening: Part 3",
        summary: "Дискуссия студентов с преподавателем",
        skill: "Listening",
        minutes: 12,
        official: SAMPLES,
        theory: [{ body: "Часть 3 — разговор двух-трёх человек об учёбе. Важно понять, **кто** что думает и к какому **решению** они приходят." }],
        listening: {
          title: "Planning a survey project",
          context: "You will hear two students, Asel and Tom, discussing their project with their tutor.",
          lines: [
            { speaker: "Tutor", text: "So, how is your survey on students' study habits going?" },
            { speaker: "Asel", text: "We've written the questions, but we're not sure about the size of the sample. Tom wants to ask everyone in our year." },
            { speaker: "Tom", text: "I thought more answers would make the results more reliable." },
            { speaker: "Tutor", text: "More isn't always better if the sample isn't random. Who would actually reply?" },
            { speaker: "Asel", text: "Probably mostly our friends, and they study the same way we do." },
            { speaker: "Tutor", text: "Exactly. I'd suggest choosing about sixty students at random from the class lists instead." },
            { speaker: "Tom", text: "That makes sense. And should we do it online or on paper?" },
            { speaker: "Tutor", text: "Online is fine, but send one reminder after three days. Response rates usually drop quickly otherwise." },
            { speaker: "Asel", text: "Then we'll present the results in the seminar in two weeks, rather than next week as we planned." },
          ],
        },
        questions: [
          choice(undefined, "What is Tom's original idea?", ["To survey everyone in their year", "To survey only their friends", "To use paper questionnaires", "To present next week"], 0, "«Tom wants to ask everyone in our year»."),
          choice(undefined, "What concern does the tutor raise?", ["The sample might not be random", "The questions are too long", "Online surveys are not allowed", "The project is too late"], 0, "«More isn't always better if the sample isn't random»."),
          gap(undefined, "The tutor suggests choosing about ______ students at random.", ["60", "sixty"], "«about sixty students at random»."),
          choice(undefined, "What does the tutor advise about the online survey?", ["Send one reminder after three days", "Send reminders every day", "Avoid reminders", "Use paper instead"], 0, "«send one reminder after three days»."),
          choice(undefined, "When will they now present their results?", ["In two weeks", "Next week", "Tomorrow", "At the end of the term"], 0, "Они переносят презентацию на две недели."),
        ],
      },
    ],
  },
  {
    id: "writing-practice",
    title: "Writing · практика",
    subtitle: "Новые задания Task 1 и Task 2",
    lessons: [
      {
        id: "p-writing-task1",
        title: "Writing: Task 1 (2)",
        summary: "Новая таблица: доступ к интернету",
        skill: "Writing",
        minutes: 25,
        official: SAMPLES,
        theory: [{ body: "Структура та же: перефразированное введение, overview с главными тенденциями, два абзаца деталей с цифрами. Мнения нет." }],
        questions: [
          {
            kind: "choice",
            table: MONITOR,
            prompt: "Which sentence is the best overview?",
            options: [
              "Overall, internet access rose in all three regions, with Region B growing from the lowest starting point.",
              "In 2005, 20% of households in Region A had internet access.",
              "I think internet access is important for education.",
              "The table shows households with internet access.",
            ],
            answer: 0,
            explanation: "Overview — общие тенденции без деталей и мнений.",
          },
        ],
        writing: {
          prompt:
            "The table below shows the percentage of households with internet access in three regions between 2005 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
          minWords: 150,
          maxWords: 220,
          table: MONITOR,
          rubric: [
            "Введение перефразирует задание",
            "Есть overview (Overall, …)",
            "Сравнения регионов подкреплены цифрами",
            "Нет личного мнения",
          ],
          starters: ["The table compares…", "Overall, …", "Region B, by contrast, …"],
          checks: { profile: "ielts1" },
        },
      },
      {
        id: "p-writing-task2",
        title: "Writing: Task 2 (2)",
        summary: "Эссе: agree or disagree",
        skill: "Writing",
        minutes: 40,
        official: SAMPLES,
        theory: [
          { body: "В типе «To what extent do you agree?» нужна ясная позиция с первого абзаца и до конца. Можно частично соглашаться, но тогда объясни, в чём именно." },
        ],
        questions: [
          {
            kind: "choice",
            prompt: "Task: “Some people think that university education should be free for everyone. To what extent do you agree or disagree?” Which introduction ending states a clear position?",
            options: [
              "I largely agree, because free tuition widens opportunity, although some contribution from wealthier students may be fair.",
              "There are many views on this topic.",
              "University is an important stage of life.",
              "This essay will discuss universities.",
            ],
            answer: 0,
            explanation: "Ясная позиция с причиной и оговоркой.",
          },
        ],
        writing: {
          prompt:
            "Some people think that university education should be free for everyone. To what extent do you agree or disagree? Give reasons for your answer and include any relevant examples from your own knowledge or experience. Write at least 250 words.",
          minWords: 250,
          maxWords: 340,
          rubric: [
            "Позиция ясна во введении и сохраняется до конца",
            "Каждый абзац — одна главная идея с объяснением и примером",
            "Есть ответ на противоположную точку зрения",
            "Заключение повторяет позицию",
          ],
          starters: ["I largely agree that…", "Firstly, …", "Admittedly, …", "In conclusion, …"],
          checks: { profile: "ielts2" },
        },
      },
    ],
  },
  {
    id: "speaking-practice",
    title: "Speaking · практика",
    subtitle: "Новая карточка Части 2",
    lessons: [
      {
        id: "p-speaking-part2",
        title: "Speaking: Part 2 (2)",
        summary: "Карточка: любимое место в городе",
        skill: "Speaking",
        minutes: 10,
        official: SAMPLES,
        theory: [{ body: "Пройди по пунктам карточки по порядку и потрать больше всего времени на последний — «explain why». Описывай детали: что видно, слышно, кто там бывает." }],
        questions: [],
        speaking: {
          part: 2,
          intro: "Now I'm going to give you a topic, and I'd like you to talk about it for one to two minutes. You have one minute to think about what you're going to say.",
          questions: ["Please describe a place in your city that you like to visit.", "Do you think this place will change in the future?"],
          cueCard: {
            topic: "Describe a place in your city that you like to visit.",
            points: ["where it is", "how often you go there", "what you do there", "and explain why you like it"],
          },
          targetWords: [150, 280],
        },
      },
    ],
  },
];

/** Where the second-pass IELTS lessons go in the alternating English schedule. */
export const IELTS_PRACTICE_ORDER = [
  "p-reading-tfng",
  "p-listening-part2",
  "p-writing-task1",
  "p-reading-headings",
  "p-speaking-part2",
  "p-reading-completion",
  "p-listening-part3",
  "p-writing-task2",
  "p-reading-views",
];
