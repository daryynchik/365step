import type { Course } from "./types";

/**
 * Admissions roadmap: the stages of applying to universities abroad, from
 * choosing where to apply to the personal statement and financial aid.
 *
 * Rules that change every cycle (exact deadlines, test policies, prompts) are
 * described as patterns, and every lesson sends the student to the official
 * source to confirm them.
 */

const COMMON_APP = { label: "Темы эссе Common App (commonapp.org)", url: "https://www.commonapp.org/apply/essay-prompts" };
const UCAS_PS = {
  label: "Personal statement на сайте UCAS",
  url: "https://www.ucas.com/applying/applying-to-university/writing-your-personal-statement",
};
const BIGFUTURE = { label: "BigFuture от College Board: поиск вузов и стипендий", url: "https://bigfuture.collegeboard.org/" };

export const ADMISSIONS: Course = {
  id: "admissions",
  title: "Поступление за рубеж",
  short: "Поступление",
  description: "Этапы поступления: выбор вузов, тесты, дедлайны, активности, эссе, рекомендации и финансирование.",
  units: [
    {
      id: "strategy",
      title: "Стратегия",
      subtitle: "Куда и когда подавать",
      lessons: [
        {
          id: "map",
          title: "Карта поступления",
          summary: "Как устроено поступление в разных странах",
          skill: "Обзор",
          minutes: 10,
          official: BIGFUTURE,
          theory: [
            {
              body:
                "Готовиться лучше за 12–18 месяцев до подачи. За это время нужно сдать тесты, выбрать вузы, собрать активности, написать эссе и получить рекомендации. Системы разных стран заметно отличаются.",
            },
            {
              heading: "США",
              body:
                "**Холистический отбор**: смотрят на оценки, тесты, активности, эссе и рекомендации вместе. Большинство вузов принимают заявку через **Common App** — одну анкету и одно главное эссе для многих вузов, плюс дополнительные эссе отдельных вузов.",
            },
            {
              heading: "Великобритания",
              body:
                "Подача через **UCAS**: до **пяти программ** одной заявкой и один personal statement на все. Поступают сразу на конкретную специальность, поэтому эссе — о предмете, а не о жизни в целом.",
            },
            {
              heading: "Европа и Азия",
              body:
                "Часто решают оценки, языковой сертификат и мотивационное письмо. Во многих странах обучение в государственных вузах заметно дешевле, чем в США и Великобритании. Требования всегда проверяй на сайте конкретного вуза.",
            },
          ],
          questions: [
            {
              kind: "choice",
              prompt: "Сколько программ можно указать в одной заявке UCAS?",
              options: ["До пяти", "Одну", "До десяти", "Без ограничений"],
              answer: 0,
              explanation: "UCAS позволяет выбрать до пяти программ, и все они видят один и тот же personal statement.",
            },
            {
              kind: "choice",
              prompt: "Что означает «холистический отбор» в вузах США?",
              options: [
                "Заявку оценивают целиком: оценки, тесты, активности, эссе, рекомендации",
                "Решение принимают только по результатам SAT",
                "Принимают всех, кто подал документы вовремя",
                "Решение принимает компьютер по баллам",
              ],
              answer: 0,
              explanation: "Холистический отбор — оценка человека целиком, а не по одному числу.",
            },
            {
              kind: "choice",
              prompt: "О чём в первую очередь должен быть UK personal statement?",
              options: [
                "О выбранном предмете и подготовке к нему",
                "О детстве и семье",
                "О любимых фильмах",
                "О желании жить в Лондоне",
              ],
              answer: 0,
              explanation: "В Великобритании поступают на конкретную программу, поэтому главное — интерес к предмету и подготовка.",
            },
          ],
        },
        {
          id: "tests",
          title: "Тесты и требования",
          summary: "SAT, IELTS и что проверять у каждого вуза",
          skill: "Тесты",
          minutes: 10,
          official: { label: "SAT: регистрация и даты (College Board)", url: "https://satsuite.collegeboard.org/sat" },
          theory: [
            {
              body:
                "Для зарубежных вузов обычно нужен **языковой сертификат** (IELTS Academic или его аналоги) и, для США, часто **SAT или ACT**. Политика вузов меняется: после волны test-optional часть ведущих университетов США снова требует SAT/ACT.",
            },
            {
              heading: "Как планировать",
              body:
                "• Выпиши для каждого вуза: нужен ли SAT, минимальный IELTS (общий балл и по секциям), принимает ли он результаты онлайн-версий.\n• Закладывай две попытки на каждый тест: первая — за 6–9 месяцев до дедлайна.\n• Результаты отправляются в вузы не мгновенно — оставь запас в несколько недель.",
            },
          ],
          questions: [
            {
              kind: "choice",
              prompt: "Вуз пишет: «IELTS 7.0 overall, no band below 6.5». У тебя 7.0 overall и 6.0 за Writing. Что это значит?",
              options: [
                "Требование не выполнено: одна секция ниже 6.5",
                "Требование выполнено: общий балл 7.0",
                "Нужно сдать только Writing",
                "Такой балл подходит для всех вузов",
              ],
              answer: 0,
              explanation: "Требование двойное: общий балл И минимум по каждой секции. 6.0 < 6.5 — не проходит.",
            },
            {
              kind: "choice",
              prompt: "Где надёжнее всего проверить, нужен ли вузу SAT?",
              options: [
                "На странице приёмной комиссии этого вуза",
                "В отзывах на форуме",
                "В прошлогодней статье блогера",
                "У друзей, поступивших пять лет назад",
              ],
              answer: 0,
              explanation: "Политика тестов меняется почти каждый год. Источник истины — сайт admissions самого вуза.",
            },
            {
              kind: "choice",
              prompt: "Когда разумно сдавать IELTS впервые, если дедлайн в январе?",
              options: ["Весной или летом предыдущего года", "В декабре", "После дедлайна", "За неделю до дедлайна"],
              answer: 0,
              explanation: "Ранняя попытка оставляет время на пересдачу и отправку результатов.",
            },
          ],
        },
        {
          id: "college-list",
          title: "Список вузов",
          summary: "Reach, match, safety",
          skill: "Выбор вузов",
          minutes: 20,
          official: BIGFUTURE,
          theory: [
            {
              body:
                "Сбалансированный список защищает от неприятных сюрпризов. Для США обычно выбирают 8–12 вузов, для UCAS — до пяти программ.",
            },
            {
              heading: "Три группы",
              body:
                "• **Reach** — твои баллы ниже типичных для вуза или конкурс очень высокий.\n• **Match** — твои баллы в середине диапазона принятых.\n• **Safety** — баллы выше типичных, и вуз тебе по карману.\n\nДля вузов с конкурсом в единицы процентов «match» не бывает — для всех они reach.",
            },
            {
              heading: "Критерии выбора",
              body: "Сильная программа по твоей специальности, стоимость и финансовая помощь, язык обучения, город и климат, возможности для стажировок.",
            },
          ],
          questions: [
            {
              kind: "choice",
              prompt: "В вузе принимают около 5% абитуриентов. Твой SAT выше среднего у принятых. К какой группе отнести вуз?",
              options: ["Reach", "Match", "Safety", "Такой вуз не стоит добавлять"],
              answer: 0,
              explanation: "При таком конкурсе высокий балл не гарантирует поступления — это reach для всех.",
            },
            {
              kind: "choice",
              prompt: "Что из этого НЕ делает вуз safety?",
              options: [
                "Высокие баллы, но вуз тебе не по карману",
                "Высокие баллы и доступная стоимость",
                "Высокий процент поступающих",
                "Твои оценки выше типичных",
              ],
              answer: 0,
              explanation: "Safety — это вуз, куда ты и поступишь, и сможешь учиться. Без денег он не страховка.",
            },
          ],
          writing: {
            prompt:
              "Составь черновой список из 6 вузов или программ: 2 reach, 2 match, 2 safety. Для каждого одной строкой: название, специальность, почему он тебе подходит, какой нужен SAT/IELTS.",
            minWords: 60,
            maxWords: 300,
            rubric: [
              "Шесть строк — по одной на вуз",
              "Указана группа: reach / match / safety",
              "У каждого вуза есть конкретная причина выбора",
              "Требования к тестам проверены на сайте вуза",
            ],
            starters: ["Reach: …", "Match: …", "Safety: …"],
            checks: { profile: "plan" },
          },
        },
        {
          id: "deadlines",
          title: "Дедлайны",
          summary: "Early Decision, Early Action, Regular",
          skill: "Дедлайны",
          minutes: 10,
          official: { label: "Даты и дедлайны UCAS", url: "https://www.ucas.com/applying/applying-to-university/dates-and-deadlines-for-uni-applications" },
          theory: [
            {
              body:
                "Пропущенный дедлайн нельзя исправить хорошим эссе. Типичные сроки повторяются из года в год, но **точные даты меняются** — проверяй каждую на сайте вуза и записывай в планировщик справа.",
            },
            {
              heading: "США",
              body:
                "• **Early Decision (ED)** — ранняя подача, **обязывающая**: если приняли, ты обязан поступить и отозвать другие заявки. Обычно ноябрь.\n• **Early Action (EA)** — ранняя подача без обязательств. Обычно ноябрь.\n• **Regular Decision (RD)** — обычный срок, чаще всего начало января.\n• Дедлайны финансовой помощи и стипендий нередко раньше основных.",
            },
            {
              heading: "Великобритания",
              body:
                "Для Оксфорда, Кембриджа и большинства программ по медицине — **середина октября**. Для остальных программ — **январь**. Точные даты на текущий год — на сайте UCAS.",
            },
          ],
          questions: [
            {
              kind: "choice",
              prompt: "Чем Early Decision отличается от Early Action?",
              options: [
                "ED обязывает поступить в случае зачисления, EA — нет",
                "EA обязывает, ED — нет",
                "Это одно и то же",
                "ED бывает только в Великобритании",
              ],
              answer: 0,
              explanation: "Early Decision — binding: при зачислении нужно поступить. Early Action — non-binding.",
            },
            {
              kind: "choice",
              prompt: "Когда обычно подают заявку в Оксфорд или Кембридж через UCAS?",
              options: ["В середине октября", "В мае", "В конце марта", "В любое время года"],
              answer: 0,
              explanation: "Для Oxbridge и большинства медицинских программ дедлайн UCAS — середина октября, на несколько месяцев раньше основного.",
            },
            {
              kind: "choice",
              prompt: "Почему стоит отдельно проверять дедлайны стипендий?",
              options: [
                "Они часто раньше дедлайнов подачи заявки",
                "Их не бывает",
                "Они всегда позже",
                "Стипендии дают без заявки",
              ],
              answer: 0,
              explanation: "Многие стипендии и программы помощи закрываются раньше основной подачи.",
            },
          ],
        },
      ],
    },
    {
      id: "profile",
      title: "Профиль",
      subtitle: "Активности и рекомендации",
      lessons: [
        {
          id: "extracurriculars",
          title: "Внеучебная деятельность",
          summary: "Глубина важнее количества",
          skill: "Активности",
          minutes: 10,
          theory: [
            {
              body:
                "Активности показывают, кто ты вне уроков. Приёмные комиссии ценят **глубину и влияние**: два года развития одного проекта говорят больше, чем десять кружков по месяцу.",
            },
            {
              heading: "Что усиливает активность",
              body:
                "• **Инициатива**: ты что-то начал, а не только участвовал.\n• **Рост ответственности**: участник → организатор → руководитель.\n• **Измеримый результат**: сколько людей, денег, часов, какой итог.\n• Связь с будущей специальностью — плюс, но не обязательное условие.",
            },
            {
              heading: "Формат Common App",
              body: "До **10 активностей**. На каждую — должность до 50 знаков и описание **до 150 знаков**. Короче твита — поэтому каждое слово на счету.",
            },
          ],
          questions: [
            {
              kind: "choice",
              prompt: "Какой профиль активностей, скорее всего, произведёт более сильное впечатление?",
              options: [
                "Два года в школьном клубе робототехники с ростом до капитана команды",
                "Десять разных кружков, в каждом по месяцу",
                "Список всех прочитанных книг",
                "Одна разовая волонтёрская акция",
              ],
              answer: 0,
              explanation: "Глубина, время и рост ответственности ценятся выше количества.",
            },
            {
              kind: "choice",
              prompt: "Какое описание активности сильнее?",
              options: [
                "Founded a free math club; taught 40 students weekly; 12 qualified for the regional olympiad.",
                "I was a member of a math club and it was very interesting.",
                "Math club.",
                "I love math very much and want to study it.",
              ],
              answer: 0,
              explanation: "Сильное описание начинается с глагола действия и показывает масштаб и результат в цифрах.",
            },
            {
              kind: "choice",
              prompt: "Сколько знаков доступно на описание одной активности в Common App?",
              options: ["150", "50", "650", "1 000"],
              answer: 0,
              explanation: "Описание — до 150 знаков; 50 — лимит на название должности, 650 — лимит главного эссе в словах.",
            },
          ],
        },
        {
          id: "activities-list",
          title: "Пишем: список активностей",
          summary: "Три описания по 150 знаков",
          skill: "Активности",
          minutes: 20,
          theory: [
            {
              body:
                "Опиши три свои главные активности в формате Common App. По одной на строку, каждая **не длиннее 150 знаков**, на английском.",
            },
            {
              heading: "Формула",
              body:
                "Глагол действия → что сделал → масштаб → результат.\n\nFounded / Organized / Led / Built / Taught / Raised …\n\n«Led a team of 6 to build a soil-moisture sensor; won 2nd place at the city science fair; now used in the school greenhouse.»",
            },
          ],
          questions: [],
          writing: {
            prompt: "Write three Common App activity descriptions, one per line. Each must be 150 characters or fewer.",
            minWords: 25,
            maxWords: 90,
            rubric: [
              "Три строки — три активности",
              "Каждая строка не длиннее 150 знаков",
              "Каждая начинается с глагола действия",
              "Есть цифры: сколько людей, часов, результат",
            ],
            starters: ["Founded…", "Organized…", "Taught…"],
            checks: { profile: "activities" },
          },
        },
        {
          id: "recommendations",
          title: "Рекомендации и интервью",
          summary: "Кого просить и как подготовиться",
          skill: "Рекомендации",
          minutes: 10,
          theory: [
            {
              body:
                "Американские вузы обычно просят рекомендации от школьного консультанта (counselor) и одного-двух учителей. Лучшая рекомендация — от учителя, который **хорошо знает тебя**, а не от самого известного.",
            },
            {
              heading: "Как просить",
              body:
                "• Проси минимум за 4–6 недель до дедлайна.\n• Дай учителю «brag sheet» — страницу с твоими проектами, достижениями и тем, что ты ценишь в его предмете.\n• Напомни о дедлайне за неделю и обязательно поблагодари.",
            },
            {
              heading: "Интервью",
              body:
                "Часто необязательны и проводятся выпускниками. Подготовь короткие рассказы: почему этот вуз, чем ты увлечён, трудность, которую ты преодолел. Задай собеседнику свои вопросы о вузе.",
            },
          ],
          questions: [
            {
              kind: "choice",
              prompt: "Кого лучше попросить о рекомендации?",
              options: [
                "Учителя предмета, на чьих уроках ты активно работал два года",
                "Директора, который тебя почти не знает",
                "Родственника",
                "Известного человека, с которым ты встречался один раз",
              ],
              answer: 0,
              explanation: "Ценна рекомендация с конкретными примерами, а их может дать тот, кто тебя хорошо знает.",
            },
            {
              kind: "choice",
              prompt: "За сколько времени до дедлайна стоит попросить рекомендацию?",
              options: ["За 4–6 недель или раньше", "За два дня", "В день дедлайна", "После подачи заявки"],
              answer: 0,
              explanation: "Учителю нужно время; у него таких просьб может быть десятки.",
            },
          ],
        },
      ],
    },
    {
      id: "essays",
      title: "Эссе",
      subtitle: "Personal Statement и дополнительные эссе",
      lessons: [
        {
          id: "ps-topic",
          title: "Personal Statement: тема",
          summary: "Найти свою историю",
          skill: "Эссе",
          minutes: 20,
          official: COMMON_APP,
          theory: [
            {
              body:
                "Главное эссе Common App — **до 650 слов** на одну из семи тем (одна из них — «тема на твой выбор»). Это не резюме в прозе: всё о наградах уже есть в анкете. Эссе показывает, **как ты думаешь и что ценишь**.",
            },
            {
              heading: "Как найти тему",
              body:
                "• Вспомни моменты, когда ты изменил мнение, чему-то научился на ошибке, взял на себя ответственность.\n• Хорошая тема часто маленькая: разговор, хобби, привычка, предмет в комнате.\n• Проверка: может ли это эссе написать кто-то другой? Если да — тема слишком общая.",
            },
            {
              heading: "Клише, которых стоит избегать",
              body: "«Since I was a child I have always…», «make the world a better place», цитата из словаря, история про победу в последней секунде матча без выводов.",
            },
          ],
          questions: [
            {
              kind: "choice",
              prompt: "Какая идея лучше подходит для personal statement?",
              options: [
                "Как я чинил старый радиоприёмник деда и понял, что люблю разбираться, почему вещи работают",
                "Список всех моих наград за 9–11 классы",
                "Почему я всегда мечтал поступить в лучший вуз мира",
                "Пересказ сюжета любимой книги",
              ],
              answer: 0,
              explanation: "Маленькая конкретная история, через которую видно мышление и ценности автора.",
            },
            {
              kind: "choice",
              prompt: "Какое начало эссе сильнее?",
              options: [
                "The radio had been silent for eleven years when I unscrewed its back panel.",
                "Since I was a child, I have always been passionate about engineering.",
                "Webster's Dictionary defines engineering as…",
                "In this essay I will tell you about myself.",
              ],
              answer: 0,
              explanation: "Конкретная сцена сразу погружает в историю. Остальные — классические клише.",
            },
          ],
          writing: {
            prompt:
              "Brainstorm: describe, in English, one specific moment from your life that changed how you think. What happened, what did you notice, and what did you learn about yourself? This is a draft for your personal statement, not the final essay.",
            minWords: 150,
            maxWords: 350,
            rubric: [
              "Один конкретный момент, а не обзор всей жизни",
              "Есть детали: место, время, люди, предметы",
              "Объяснено, что ты понял или как изменился",
              "Без клише вроде «since I was a child»",
            ],
            starters: ["It was…", "At that moment I realised…", "Now, when I…"],
            checks: { profile: "statement" },
          },
        },
        {
          id: "ps-draft",
          title: "Personal Statement: черновик",
          summary: "Структура и правило show, don't tell",
          skill: "Эссе",
          minutes: 40,
          official: COMMON_APP,
          theory: [
            {
              body: "Теперь превращаем историю в эссе. Чёткой формулы нет, но у сильных эссе похожий каркас.",
            },
            {
              heading: "Каркас",
              body:
                "• **Сцена** — начни с конкретного момента.\n• **Контекст** — что привело к нему, что было на кону.\n• **Поворот** — что ты сделал или понял.\n• **Рефлексия** — как это изменило твои взгляды и поступки.\n• **Сейчас и дальше** — как это связано с тем, кем ты хочешь стать.",
            },
            {
              heading: "Show, don't tell",
              body:
                "Не «I am very hardworking», а «For three months, I stayed after class every Tuesday to rebuild the code that had failed». Пусть читатель сам сделает вывод о твоих качествах.",
            },
          ],
          questions: [
            {
              kind: "choice",
              prompt: "Какое предложение следует правилу show, don't tell?",
              options: [
                "I rewrote the program eleven times before the sensor finally sent its first correct reading.",
                "I am a very persistent and hardworking person.",
                "Everyone says I never give up.",
                "Persistence is my best quality.",
              ],
              answer: 0,
              explanation: "Действие и деталь показывают упорство, не называя его.",
            },
            {
              kind: "choice",
              prompt: "Какая часть эссе чаще всего оказывается слабой у абитуриентов?",
              options: ["Рефлексия — что ты понял и как изменился", "Первое предложение", "Название", "Количество абзацев"],
              answer: 0,
              explanation: "Истории часто хорошие, но вывод сводится к одной общей фразе. Глубина рефлексии и отличает сильное эссе.",
            },
          ],
          writing: {
            prompt:
              "Write a full draft of your Common App personal statement (up to 650 words). Build it from the moment you described in the previous lesson: scene, context, turning point, reflection, and what it means for your future.",
            minWords: 350,
            maxWords: 650,
            rubric: [
              "Начинается со сцены, а не с общих слов",
              "Есть поворотный момент",
              "Больше половины текста — действия и детали, а не оценки себя",
              "Последние абзацы — рефлексия и взгляд вперёд",
              "Не больше 650 слов",
            ],
            starters: ["The first time I…", "What I didn't expect was…", "Today, …"],
            checks: { profile: "statement" },
          },
        },
        {
          id: "ucas-statement",
          title: "UCAS Personal Statement",
          summary: "Три вопроса, 4 000 знаков",
          skill: "Эссе",
          minutes: 40,
          official: UCAS_PS,
          theory: [
            {
              body:
                "Personal statement UCAS — ответы на **три вопроса**, вместе **до 4 000 знаков** с пробелами. Один текст уходит во все пять выбранных программ, поэтому он о предмете, а не о конкретном вузе.",
            },
            {
              heading: "Три вопроса UCAS",
              body:
                "1. Why do you want to study this course or subject?\n2. How have your qualifications and studies helped you to prepare for this course or subject?\n3. What else have you done to prepare outside of education, and why are these experiences useful?",
            },
            {
              heading: "Как писать",
              body:
                "Около 80% текста — о предмете: что ты читал, решал, исследовал и что из этого понял. Каждый пример сопровождай выводом: «This taught me…», «I realised that…».",
            },
          ],
          questions: [
            {
              kind: "choice",
              prompt: "Почему в UCAS statement не стоит называть конкретный университет?",
              options: [
                "Один и тот же текст увидят все пять выбранных программ",
                "Это запрещено правилами",
                "Университеты не читают эссе",
                "Название не помещается в 4 000 знаков",
              ],
              answer: 0,
              explanation: "Statement один на все заявки; упоминание одного вуза выглядит странно для остальных четырёх.",
            },
            {
              kind: "choice",
              prompt: "Что лучше всего отвечает на вопрос о подготовке вне учёбы?",
              options: [
                "Online course in data analysis: I built a model of local air quality and learned how messy real data is",
                "I like watching documentaries",
                "I am interested in many things",
                "I have always wanted to study in the UK",
              ],
              answer: 0,
              explanation: "Конкретное действие и вывод о том, чему оно научило, — ровно то, что спрашивает вопрос 3.",
            },
          ],
          writing: {
            prompt:
              "Write your UCAS personal statement for your chosen subject. Answer the three questions in order, starting each answer on a new line with “Q1:”, “Q2:” and “Q3:”. Keep the total under 4,000 characters.",
            minWords: 250,
            maxWords: 650,
            rubric: [
              "Три ответа, помеченные Q1, Q2, Q3",
              "Всего не больше 4 000 знаков",
              "Большая часть текста — о предмете",
              "Каждый пример сопровождается выводом",
            ],
            starters: ["Q1: …", "Q2: …", "Q3: …"],
            checks: { profile: "ucas" },
          },
        },
        {
          id: "supplements",
          title: "Эссе «Why us?»",
          summary: "Почему именно этот вуз",
          skill: "Эссе",
          minutes: 25,
          theory: [
            {
              body:
                "Многие вузы США просят дополнительное эссе: почему именно мы? Ответ «престиж и сильные программы» не работает: его можно написать про любой университет.",
            },
            {
              heading: "Как писать",
              body:
                "• Назови 2–3 **конкретные** вещи: курс, профессора, лабораторию, студенческую организацию, особенность учебного плана.\n• Свяжи каждую с собой: что ты уже делал и что будешь там делать.\n• Проверка: если заменить название вуза на другой, эссе должно перестать быть правдой.",
            },
          ],
          questions: [
            {
              kind: "choice",
              prompt: "Какой фрагмент «Why us» сильнее?",
              options: [
                "The university's undergraduate research program would let me continue the air-quality project I started in my city.",
                "Your university is famous and has a beautiful campus.",
                "I have always dreamed of studying at a top university.",
                "Your university offers many majors.",
              ],
              answer: 0,
              explanation: "Конкретная возможность вуза связана с конкретным опытом автора.",
            },
          ],
          writing: {
            prompt:
              "Choose one university from your list and write a “Why us?” essay (150–250 words). Name at least two specific programs, courses, labs or communities, and connect each to something you have already done.",
            minWords: 150,
            maxWords: 250,
            rubric: [
              "Названы минимум две конкретные возможности вуза",
              "Каждая связана с твоим опытом",
              "Эссе перестанет быть правдой, если поменять название вуза",
            ],
            starters: ["At …, I want to…", "Because I have already…"],
            checks: { profile: "statement" },
          },
        },
        {
          id: "motivation-letter",
          title: "Мотивационное письмо",
          summary: "Для вузов Европы и Азии",
          skill: "Эссе",
          minutes: 30,
          theory: [
            {
              body:
                "Многие вузы Европы и Азии вместо эссе Common App просят **мотивационное письмо** (letter of motivation, statement of purpose): одну-две страницы о том, почему ты выбираешь именно эту программу и чем к ней готов.",
            },
            {
              heading: "Структура",
              body:
                "• **Начало** — что именно тебя привлекает в специальности, на конкретном примере.\n• **Подготовка** — предметы, проекты, олимпиады, книги: что ты уже сделал.\n• **Почему эта программа** — 2–3 конкретные особенности (курсы, лаборатории, язык обучения, практика).\n• **Цели** — чем хочешь заниматься после учёбы и как программа помогает.\n• Тон деловой, без пересказа всей биографии.",
            },
            {
              heading: "Частые ошибки",
              body: "Одно письмо на все вузы без изменений, общие слова о «престижном университете», список достижений без объяснения, что они тебе дали.",
            },
          ],
          questions: [
            {
              kind: "choice",
              prompt: "Чем мотивационное письмо обычно отличается от эссе Common App?",
              options: [
                "Оно сосредоточено на выбранной программе и подготовке к ней",
                "Оно всегда длиннее 2 000 слов",
                "В нём нельзя упоминать специальность",
                "Его пишет учитель",
              ],
              answer: 0,
              explanation: "Мотивационное письмо — о программе и твоей готовности к ней; эссе Common App — о тебе как человеке.",
            },
            {
              kind: "choice",
              prompt: "Какая фраза лучше подходит для письма?",
              options: [
                "The programme's compulsory industry semester would let me test the sensor design I began in school.",
                "Your university is very prestigious and famous.",
                "I have always dreamed of studying abroad.",
                "I am the best student in my class.",
              ],
              answer: 0,
              explanation: "Конкретная особенность программы связана с собственным опытом.",
            },
          ],
          writing: {
            prompt:
              "Write a letter of motivation (250–450 words) for one programme from your list: why this field, how you have prepared, why this specific programme, and what you want to do afterwards.",
            minWords: 250,
            maxWords: 450,
            rubric: [
              "Названа конкретная программа и 2–3 её особенности",
              "Подготовка показана через факты, а не через оценки себя",
              "Есть цель после учёбы",
              "Деловой тон, нет пересказа всей биографии",
            ],
            starters: ["My interest in … began when…", "To prepare, I…", "This programme…"],
            checks: { profile: "statement" },
          },
        },
      ],
    },
    {
      id: "finish",
      title: "Финиш",
      subtitle: "Деньги и последняя проверка",
      lessons: [
        {
          id: "financial-aid",
          title: "Финансовая помощь",
          summary: "Need-blind, merit, стипендии",
          skill: "Финансы",
          minutes: 10,
          official: BIGFUTURE,
          theory: [
            {
              body:
                "Стоимость обучения за рубежом часто выше, чем кажется, но помощь бывает существенной. Разберись в терминах заранее: от них зависит, куда стоит подавать.",
            },
            {
              heading: "Термины",
              body:
                "• **Need-blind** — вуз не учитывает твою финансовую ситуацию при решении о зачислении. Для иностранцев так поступают лишь немногие вузы США.\n• **Need-aware** — финансовая ситуация может влиять на решение.\n• **Need-based aid** — помощь по нужде семьи. Многие частные вузы США используют для неё форму **CSS Profile**.\n• **Merit scholarship** — стипендия за достижения, независимо от дохода.",
            },
            {
              heading: "Другие источники",
              body:
                "Государственные программы твоей страны (в Казахстане — «Болашак», условия проверяй на официальном сайте), стипендии фондов и стипендии самих вузов. Почти у каждого источника свой дедлайн — внеси их в планировщик.",
            },
          ],
          questions: [
            {
              kind: "choice",
              prompt: "Что означает need-blind admission?",
              options: [
                "Решение о зачислении принимают без учёта финансов семьи",
                "Обучение бесплатное для всех",
                "Стипендию дают только за оценки",
                "Вуз не принимает иностранцев",
              ],
              answer: 0,
              explanation: "Need-blind касается решения о зачислении, а не размера помощи.",
            },
            {
              kind: "choice",
              prompt: "Чем merit scholarship отличается от need-based aid?",
              options: [
                "Merit — за достижения, need-based — по финансовой нужде семьи",
                "Это одно и то же",
                "Merit дают только спортсменам",
                "Need-based нужно возвращать",
              ],
              answer: 0,
              explanation: "Это два разных основания для помощи; вуз может предлагать одно, оба или ни одного.",
            },
          ],
        },
        {
          id: "final-check",
          title: "Финальная проверка заявки",
          summary: "Чек-лист перед отправкой",
          skill: "Подача",
          minutes: 10,
          theory: [
            {
              body: "Последняя неделя перед дедлайном — не время писать эссе. Это время проверить, что ничего не потеряно.",
            },
            {
              heading: "Чек-лист",
              body:
                "• Имя и дата рождения совпадают с паспортом во всех документах.\n• Результаты SAT и IELTS отправлены в каждый вуз.\n• Рекомендации загружены — проверь статус в личном кабинете.\n• Эссе вычитаны другим человеком; названия вузов в дополнительных эссе правильные.\n• Оплачен сбор за подачу или получено освобождение (fee waiver).\n• Сохранены подтверждения отправки.",
            },
          ],
          questions: [
            {
              kind: "choice",
              prompt: "Что из этого стоит сделать в последнюю неделю перед дедлайном?",
              options: [
                "Проверить статус рекомендаций и отправку результатов тестов",
                "Начать писать главное эссе",
                "Впервые зарегистрироваться на SAT",
                "Выбрать специальность",
              ],
              answer: 0,
              explanation: "Последняя неделя — для проверки, а не для работы, требующей месяцев.",
            },
            {
              kind: "choice",
              prompt: "Самая обидная ошибка в дополнительных эссе:",
              options: [
                "Название другого вуза, оставшееся после копирования",
                "Слишком короткий абзац",
                "Одна опечатка",
                "Отсутствие заголовка",
              ],
              answer: 0,
              explanation: "Копирование «Why us» между вузами без правки названий — частая и заметная ошибка.",
            },
          ],
        },
      ],
    },
  ],
};
