import type { Lesson, Passage, Question, Unit } from "./types";

/**
 * SAT Reading and Writing, second pass: five new questions for each of the
 * eleven skills, scheduled weeks after the first pass.
 */

/** [passages, prompt, options, answer, explanation] */
type Item = [Passage[] | string, string, string[], number, string];

function practice(skill: string, title: string, tip: string, items: Item[]): Lesson {
  return {
    id: `p-${skill}`,
    title: `Практика: ${title}`,
    summary: "Пять новых заданий на знакомый навык",
    minutes: 12,
    theory: [
      { body: `Возвращаемся к навыку «${title}» на новых текстах. Сначала вспомни стратегию, потом решай.` },
      { heading: "Напоминание", body: tip },
    ],
    questions: items.map(
      ([passages, prompt, options, answer, explanation]): Question => ({
        kind: "choice",
        passages: typeof passages === "string" ? [{ text: passages }] : passages,
        prompt,
        options,
        answer,
        explanation,
      }),
    ),
    official: { label: "Официальные задания по этому навыку: Student Question Bank", url: "https://satsuite.collegeboard.org/practice/student-question-bank" },
  };
}

const MAIN = "Which choice best states the main idea of the text?";
const COMPLETE = "Which choice most logically completes the text?";
const WORD = "Which choice completes the text with the most logical and precise word or phrase?";
const CONVENTIONS = "Which choice completes the text so that it conforms to the conventions of Standard English?";
const TRANSITION = "Which choice completes the text with the most logical transition?";

export const SAT_RW_PRACTICE: Unit[] = [
  {
    id: "information-practice",
    title: "Information and Ideas · практика",
    subtitle: "Главная мысль, доказательства, выводы — новые тексты",
    lessons: [
      practice("central-ideas", "Central Ideas and Details", "Сформулируй главную мысль сам до того, как читать варианты. Отбрасывай слишком узкие и слишком широкие ответы.", [
        ["Many people picture desert plants as passive survivors that simply wait for rain. Botanist Laila Omarova argues that some are far more active: certain shrubs in the Kyzylkum desert send roots more than ten meters down to reach groundwater, and they drop their leaves in the hottest weeks to save water, regrowing them when conditions improve.", MAIN, [
          "Some desert plants actively adjust to drought rather than simply waiting for rain.",
          "Desert shrubs in the Kyzylkum have the longest roots of any plant.",
          "Most desert plants die during the hottest weeks of the year.",
          "Groundwater in the Kyzylkum desert is becoming scarce.",
        ], 0, "Текст спорит с образом «пассивных» растений и приводит примеры активной адаптации. B слишком сильный («the longest of any plant»), C и D не сказаны."],
        ["The following text is from a short story. Bota had always thought of her grandfather's workshop as a place of noise: hammers, saws, the radio turned up loud. On the morning after his retirement, she stepped inside and found it silent, every tool hanging neatly in its place, as if waiting for hands that would not come.", "Which choice best describes what happens in the text?", [
          "Bota notices how different the workshop feels now that her grandfather no longer works there.",
          "Bota decides to begin working in the workshop herself.",
          "Bota's grandfather shows her how to use his tools.",
          "Bota finds the workshop in disorder after her grandfather leaves.",
        ], 0, "Контраст шума и тишины показывает перемену после ухода деда. D противоречит тексту: инструменты висят «neatly»."],
        ["When the city of Seoul restored a stream that had been covered by a highway, planners mainly hoped to improve the look of the city centre. They were surprised to find that summer temperatures along the stream became noticeably lower than on nearby streets, and that the number of bird and fish species in the area increased.", "According to the text, what surprised the planners?", [
          "The restored stream had environmental benefits they had not mainly aimed for.",
          "The highway had been more popular than they expected.",
          "The city centre became less attractive after the project.",
          "Birds avoided the area around the restored stream.",
        ], 0, "Главной целью был внешний вид, а охлаждение и рост числа видов стали неожиданностью."],
        ["Economist Arman Seitkali studied small shops that began accepting digital payments. He found that their sales rose on average, but mostly because the shops attracted younger customers who rarely carried cash. Shops in neighbourhoods with mainly older residents saw little change.", MAIN, [
          "The benefit of digital payments for small shops depended largely on who their customers were.",
          "Digital payments always increase the sales of small shops.",
          "Older customers refuse to use digital payments.",
          "Small shops should stop accepting cash.",
        ], 0, "Рост продаж зависел от возраста покупателей. B — слишком общее, C и D — додумывание."],
        ["The Japanese architect Shigeru Ban is known for building with cardboard tubes. Although the material seems fragile, he treats it so that it resists water and fire, and he has used it to build emergency shelters and even churches after earthquakes. For Ban, cheap and easily available materials allow architects to help people quickly when disaster strikes.", "According to the text, why does Ban use cardboard tubes?", [
          "They are cheap and available, which helps him build quickly after disasters.",
          "They are the strongest material available to architects.",
          "They cannot be damaged by water without treatment.",
          "They are required by law in earthquake zones.",
        ], 0, "Последнее предложение прямо называет причину. C противоречит тексту: защита от воды появляется после обработки."],
      ]),
      practice("textual-evidence", "Command of Evidence: Textual", "Найди в гипотезе, что на что влияет, и выбери факт про ту же связь.", [
        ["Ecologist Dana Ibraeva hypothesizes that steppe marmots choose burrow sites mainly to avoid flooding rather than to stay close to food.", "Which finding, if true, would most directly support Ibraeva's hypothesis?", [
          "Marmot burrows are found almost entirely on slightly raised ground, even where the best grasses grow in low areas.",
          "Marmots eat a wide variety of steppe grasses.",
          "Marmot burrows can be several meters deep.",
          "Marmots spend most of the winter asleep.",
        ], 0, "Если норы на возвышенностях даже ценой удаления от лучшей еды, значит важнее защита от воды."],
        ["A student claims that in the poem, the speaker finds comfort in the routine of daily work.", "Which quotation from a poem would most effectively illustrate the student's claim?", [
          "“Each morning the same bucket, the same well, / and in that sameness, a kind of rest.”",
          "“The river runs past, and no one asks it why.”",
          "“I dreamed of cities I would never see.”",
          "“The storm arrived without a word.”",
        ], 0, "Только A соединяет повседневную рутину и чувство покоя."],
        ["Researchers claim that a new teaching method improves students' long-term memory of science concepts, not just their scores on the next test.", "Which finding, if true, would most directly support the researchers' claim?", [
          "Students taught with the method remembered more concepts than other students when tested six months later.",
          "Students enjoyed the new method more than the old one.",
          "Students taught with the method scored higher on a test the following day.",
          "Teachers found the new method easy to learn.",
        ], 0, "Утверждение о долгой памяти: нужен тест через долгое время. C — только ближайший тест."],
        ["Some historians argue that a nineteenth-century trade fair in Nizhny Novgorod mainly served local buyers.", "Which finding, if true, would most directly weaken this argument?", [
          "Records show that most goods sold at the fair were shipped to distant regions and other countries.",
          "The fair took place every summer.",
          "Local newspapers wrote about the fair.",
          "Many merchants at the fair sold cloth.",
        ], 0, "Если товары в основном уходили далеко, значит ярмарка служила не местным покупателям."],
        ["A biologist hypothesizes that a species of frog calls more loudly in noisy environments in order to be heard by mates.", "Which finding, if true, would most directly support the hypothesis?", [
          "Frogs of this species living near busy roads produce louder calls than those living in quiet forests.",
          "The frogs call mainly at night.",
          "Female frogs are larger than male frogs.",
          "The frogs eat insects near roads.",
        ], 0, "Сравнение громкости в шумной и тихой среде прямо проверяет гипотезу."],
      ]),
      practice("quantitative-evidence", "Command of Evidence: Quantitative", "Ответ должен быть верен по таблице и отвечать на утверждение из текста.", [
        ["A study compared three ways of studying vocabulary over four weeks. Students who used spaced review remembered 72% of the words, students who reread lists remembered 48%, and students who copied words remembered 41%. The researchers concluded that spaced review was the most effective method because ______", COMPLETE, [
          "students who used it remembered the largest share of the words.",
          "students who copied words remembered 41% of them.",
          "the study lasted four weeks.",
          "rereading lists was more effective than copying words.",
        ], 0, "Вывод о лучшем методе подкрепляет только сравнение, где spaced review — наибольший результат."],
        ["In 2010, 18% of a city's commuters cycled to work; by 2020, 31% did, while the share driving fell from 55% to 40%. A city report claims that cycling grew as driving declined. Which choice uses the data to support the claim?", "Which choice most effectively uses data to support the report's claim?", [
          "The share of commuters cycling rose from 18% to 31% while the share driving fell from 55% to 40%.",
          "In 2020, 40% of commuters drove to work.",
          "In 2010, more commuters drove than cycled.",
          "In 2020, 31% of commuters cycled.",
        ], 0, "Утверждение о двух тенденциях одновременно — нужны обе."],
        ["Three wheat varieties were grown with the same water: Variety A yielded 3.2 tons per hectare, B yielded 2.7, and C yielded 3.9. A farmer argues that C would be the best choice where water is limited. Which choice best supports the argument, assuming all were given little water?", "Which choice most effectively uses the data to support the farmer's argument?", [
          "With the same limited water, Variety C produced the highest yield, 3.9 tons per hectare.",
          "Variety B produced 2.7 tons per hectare.",
          "Variety A produced more than Variety B.",
          "All three varieties were grown with the same water.",
        ], 0, "Аргумент в пользу C подкрепляется тем, что у C наибольший урожай при одинаковом количестве воды."],
        ["A survey found that 64% of students who slept at least eight hours reported feeling focused in class, compared with 29% of students who slept less than six hours. A researcher argues that sleep may be related to focus. Which choice uses the data to support the argument?", "Which choice most effectively uses data to support the researcher's argument?", [
          "64% of students who slept eight hours or more felt focused, compared with 29% of those who slept under six hours.",
          "29% of students slept less than six hours.",
          "Some students reported feeling focused.",
          "The survey asked students about their classes.",
        ], 0, "Чтобы показать связь, нужно сравнить две группы."],
        ["Museum attendance in a town was 12,000 in 2019, 3,000 in 2020, and 11,500 in 2022. A journalist writes that attendance nearly recovered after a sharp drop. Which choice supports the statement?", "Which choice most effectively uses data to support the journalist's statement?", [
          "Attendance fell from 12,000 to 3,000 and then rose to 11,500.",
          "Attendance was 3,000 in 2020.",
          "Attendance was higher in 2019 than in 2022.",
          "The museum was open in 2022.",
        ], 0, "Нужны и резкое падение, и почти полное восстановление."],
      ]),
      practice("inferences", "Inferences", "Ответ должен неизбежно следовать из фактов и быть осторожным.", [
        ["In laboratory tests, a new coating kept glass free of fog by spreading water into a thin, invisible film rather than allowing it to form droplets. However, the coating wore away after about a hundred cleanings. Therefore, for car windows, which are cleaned often, the coating would probably ______", COMPLETE, [
          "need to be reapplied regularly.",
          "never need to be replaced.",
          "make the glass harder to clean.",
          "create more droplets than ordinary glass.",
        ], 0, "Покрытие стирается после ~100 чисток, а окна чистят часто — значит, его придётся обновлять."],
        ["Archaeologists found Chinese silk in a grave in Central Asia dated to a time before any written records mention trade between the two regions. This suggests that ______", COMPLETE, [
          "goods may have moved between the regions earlier than written records indicate.",
          "Chinese silk was produced in Central Asia.",
          "written records of the period are always inaccurate.",
          "the grave was dated incorrectly.",
        ], 0, "Находка старше письменных упоминаний — вероятно, обмен начался раньше."],
        ["Psychologists found that people solved a puzzle faster after a short walk than after sitting still for the same time. When participants walked on a treadmill facing a blank wall, they performed just as well as those who walked outside. This suggests that the improvement came mainly from ______", COMPLETE, [
          "the physical activity of walking rather than the scenery.",
          "being outdoors in nature.",
          "talking to other participants.",
          "the difficulty of the puzzle.",
        ], 0, "Ходьба у пустой стены дала тот же эффект — значит, дело не в пейзаже."],
        ["A city cut bus fares in half for a year. Bus use rose sharply in poorer neighbourhoods but barely changed in wealthier ones, where most residents drive. The results suggest that the fare cut ______", COMPLETE, [
          "mattered most to residents for whom cost was a real barrier.",
          "had no effect anywhere in the city.",
          "encouraged wealthy residents to stop driving.",
          "made buses less crowded.",
        ], 0, "Эффект был там, где цена — значимое препятствие."],
        ["A study of 500 companies found that those offering flexible working hours had lower staff turnover. However, these companies also paid higher salaries on average. Therefore, the study alone cannot show whether ______", COMPLETE, [
          "flexible hours themselves caused the lower turnover.",
          "companies pay salaries.",
          "staff turnover can be measured.",
          "500 companies is a large number.",
        ], 0, "Высокие зарплаты — альтернативное объяснение, поэтому причинность не доказана."],
      ]),
    ],
  },
  {
    id: "craft-practice",
    title: "Craft and Structure · практика",
    subtitle: "Слова, структура и диалог текстов — новые задания",
    lessons: [
      practice("words-in-context", "Words in Context", "Вставь своё слово, найди подсказку-контраст или пояснение после двоеточия.", [
        ["The critic praised the novel's ______ style: in just two hundred pages, the author covers three generations without a single wasted sentence.", WORD, ["economical", "extravagant", "repetitive", "careless"], 0, "Двести страниц на три поколения без лишнего — экономный стиль."],
        ["Although the first results seemed promising, the scientist remained ______, insisting on repeating the experiment before drawing conclusions.", WORD, ["cautious", "reckless", "delighted", "indifferent"], 0, "«Although… promising» и повтор эксперимента — осторожность."],
        ["The village's water supply was ______: in dry summers the wells regularly ran empty.", WORD, ["unreliable", "abundant", "constant", "expensive"], 0, "Пустые колодцы летом — ненадёжный источник."],
        ["As used in the text, what does the word “sound” most nearly mean? “The engineers concluded that the old bridge was still structurally sound and could remain open.”", "As used in the text, what does the word “sound” most nearly mean?", ["solid and safe", "noisy", "musical", "asleep"], 0, "Structurally sound — конструктивно надёжный."],
        ["The new museum director wanted to ______ the collection, adding works by contemporary artists alongside the older paintings.", WORD, ["broaden", "abandon", "conceal", "shrink"], 0, "Добавлять новые работы — расширять коллекцию."],
      ]),
      practice("text-structure", "Text Structure and Purpose", "Спроси: что делает фраза по отношению к соседним — вводит, ограничивает, приводит пример?", [
        ["For decades, scientists believed that octopuses could not see color because their eyes contain only one type of light receptor. __Recent research suggests that the unusual shape of their pupils may allow them to detect color in a different way.__ If confirmed, this would explain how octopuses match their surroundings so precisely.", "Which choice best describes the function of the underlined sentence?", [
          "It presents new evidence that challenges an earlier belief.",
          "It restates the earlier belief.",
          "It describes how octopuses hunt.",
          "It explains why the research was never confirmed.",
        ], 0, "Фраза вводит новые данные против старого убеждения."],
        ["Some readers find the novel's opening slow: the first chapter describes a single afternoon in a small kitchen. Yet by the final chapter, every object in that kitchen has become part of the story's mystery. The patient opening, it turns out, was laying the groundwork for everything that follows.", "Which choice best describes the overall structure of the text?", [
          "It presents a criticism of the novel and then explains why the criticized feature is valuable.",
          "It summarizes the plot of the novel chapter by chapter.",
          "It compares two different novels.",
          "It describes the author's life.",
        ], 0, "Критика → объяснение, почему это достоинство."],
        ["The following text is from a speech. We often talk about saving water as if it were a private virtue, a matter of shorter showers. But most water in our region is used by farms and factories. If we want real change, we must talk about how water is priced and shared, not only about how each of us washes.", "Which choice best states the main purpose of the text?", [
          "To argue that water saving should focus on how water is priced and shared, not only on personal habits.",
          "To encourage listeners to take shorter showers.",
          "To describe how factories use water.",
          "To praise farmers for saving water.",
        ], 0, "Оратор переводит разговор с личных привычек на систему."],
        ["Bamboo grows faster than almost any other plant, which makes it attractive as a building material. __Its strength, however, varies greatly between species and depends on how it is dried and treated.__ Builders who ignore these differences risk unsafe structures.", "Which choice best describes the function of the underlined sentence?", [
          "It introduces a limitation of the material described in the first sentence.",
          "It gives another reason bamboo is attractive.",
          "It describes how bamboo is planted.",
          "It concludes that bamboo should never be used.",
        ], 0, "«However» — ограничение достоинства из первой фразы."],
        ["Linguist Rustem Aliyev expected that children in bilingual families would mix their languages most at home. Instead, his recordings showed they mixed them most at school, among friends who spoke both languages. He now argues that mixing is a social skill shaped by the listener, not a sign of confusion.", "Which choice best states the main purpose of the text?", [
          "To describe an unexpected finding and the researcher's new interpretation of it.",
          "To argue that bilingual children are confused.",
          "To compare schools in different countries.",
          "To explain how recordings are made.",
        ], 0, "Ожидание → неожиданный результат → новое объяснение."],
      ]),
      practice("cross-text", "Cross-Text Connections", "Сформулируй позицию каждого текста и отношение между ними: согласие, возражение, уточнение.", [
        [[
          { label: "Text 1", text: "Many urban planners argue that building more roads reduces traffic jams by giving cars more space." },
          { label: "Text 2", text: "Researchers studying dozens of cities found that new roads tend to fill up with additional traffic within a few years, as people who previously avoided driving begin to drive more." },
        ], "Based on the texts, how would the researchers in Text 2 most likely respond to the planners in Text 1?", [
          "New roads may not reduce traffic for long because they encourage more driving.",
          "New roads are the only way to reduce traffic.",
          "Cities should build roads faster.",
          "Traffic jams are not a real problem.",
        ], 0, "Text 2 показывает эффект «наведённого спроса», ставя под сомнение логику Text 1."],
        [[
          { label: "Text 1", text: "Some educators claim that homework in primary school builds discipline and improves achievement." },
          { label: "Text 2", text: "A review of many studies found little link between homework and achievement for young children, though the link was stronger for older students." },
        ], "Which choice best describes how Text 2 relates to Text 1?", [
          "It presents evidence that qualifies the claim for young children.",
          "It fully supports the claim.",
          "It describes a homework schedule.",
          "It argues that older students should not do homework.",
        ], 0, "Text 2 ограничивает утверждение: для младших эффекта мало."],
        [[
          { label: "Text 1", text: "Historian Saule Nurlanova argues that the spread of printing in the fifteenth century was driven mainly by demand from universities." },
          { label: "Text 2", text: "Records of early printers show that their best-selling products were cheap religious pamphlets and calendars for ordinary buyers, not academic texts." },
        ], "Based on the texts, how would the author of Text 2 most likely respond to Nurlanova?", [
          "By suggesting that ordinary buyers may have mattered more than universities.",
          "By agreeing that universities were the main buyers.",
          "By arguing that printing did not spread.",
          "By claiming that calendars were academic texts.",
        ], 0, "Данные о продажах указывают на массовых покупателей."],
        [[
          { label: "Text 1", text: "A popular article claims that playing classical music to babies makes them more intelligent." },
          { label: "Text 2", text: "The original study behind this idea tested adults, not babies, and found only a small, short-lived improvement on one type of puzzle." },
        ], "Based on the texts, the author of Text 2 would most likely say that the claim in Text 1", [
          "goes far beyond what the original evidence showed.",
          "is supported by strong evidence about babies.",
          "applies only to music other than classical.",
          "is true for adults but false for puzzles.",
        ], 0, "Исследование было на взрослых и с маленьким кратким эффектом — вывод о младенцах не следует."],
        [[
          { label: "Text 1", text: "Economist Bolat Ermekov argues that raising the minimum wage will lead businesses to hire fewer workers." },
          { label: "Text 2", text: "A study of neighbouring regions found that after one raised its minimum wage, employment there changed little compared with the region that did not." },
        ], "Based on the texts, how would the authors of the study in Text 2 most likely respond to Ermekov?", [
          "They would question whether the predicted fall in hiring necessarily happens.",
          "They would agree that hiring always falls.",
          "They would argue that wages should be lowered.",
          "They would say minimum wages do not exist.",
        ], 0, "Данные не подтверждают предсказанного сокращения занятости."],
      ]),
    ],
  },
  {
    id: "expression-practice",
    title: "Expression of Ideas · практика",
    subtitle: "Синтез заметок и переходы — новые задания",
    lessons: [
      practice("rhetorical-synthesis", "Rhetorical Synthesis", "Смотри на цель: emphasize, contrast, introduce, explain — и ищи вариант, который делает именно это.", [
        ["While researching a topic, a student has taken the following notes:\n\n• The Charyn Canyon is in southeastern Kazakhstan.\n• It is about 154 kilometers long.\n• Its red sandstone formations are often compared with those of the Grand Canyon in the United States.\n• It is part of a national park created in 2004.", "The student wants to introduce the canyon to an international audience. Which choice most effectively uses relevant information from the notes?", [
          "The Charyn Canyon, about 154 kilometers long in southeastern Kazakhstan, is known for red sandstone formations often compared with those of the Grand Canyon.",
          "The national park was created in 2004.",
          "The canyon is 154 kilometers long.",
          "Red sandstone is found in many places.",
        ], 0, "Для незнакомой аудитории нужно где, что это и чем известно."],
        ["While researching a topic, a student has taken the following notes:\n\n• Study 1 tested a reading program for 3 months; scores rose 10%.\n• Study 2 tested the same program for 2 years; scores rose 2%.\n• Both studies used similar students.", "The student wants to contrast the results of the two studies. Which choice most effectively uses relevant information from the notes?", [
          "While a three-month study found a 10% rise in scores, a two-year study of similar students found a rise of only 2%.",
          "Both studies used similar students.",
          "Study 2 lasted two years.",
          "The reading program was tested twice.",
        ], 0, "Контраст требует обоих результатов."],
        ["While researching a topic, a student has taken the following notes:\n\n• Coral reefs cover less than 1% of the ocean floor.\n• They are home to about a quarter of all marine species.\n• Rising sea temperatures cause coral bleaching.", "The student wants to emphasize how important reefs are relative to their size. Which choice most effectively uses relevant information from the notes?", [
          "Although coral reefs cover less than 1% of the ocean floor, they are home to about a quarter of all marine species.",
          "Rising sea temperatures cause coral bleaching.",
          "Coral reefs are found on the ocean floor.",
          "Many marine species live in the ocean.",
        ], 0, "Сопоставление малой площади и огромного разнообразия."],
        ["While researching a topic, a student has taken the following notes:\n\n• Abai Kunanbayev (1845–1904) was a Kazakh poet and thinker.\n• He translated works by Russian and European writers into Kazakh.\n• His “Book of Words” contains reflections on education and morality.", "The student wants to explain one way Abai connected Kazakh readers with other literatures. Which choice most effectively uses relevant information from the notes?", [
          "Abai translated works by Russian and European writers into Kazakh, bringing them to Kazakh readers.",
          "Abai lived from 1845 to 1904.",
          "Abai's “Book of Words” discusses morality.",
          "Abai was a poet and thinker.",
        ], 0, "Связь с другими литературами — переводы."],
        ["While researching a topic, a student has taken the following notes:\n\n• Solar panels convert sunlight into electricity.\n• Their efficiency falls as they get hotter.\n• Some farms grow crops under raised solar panels, which shade the plants and are cooled by them.", "The student wants to present a benefit of combining solar panels with farming. Which choice most effectively uses relevant information from the notes?", [
          "Growing crops under raised solar panels can shade the plants while helping keep the panels cool, which matters because panels lose efficiency as they heat up.",
          "Solar panels convert sunlight into electricity.",
          "Some farms grow crops.",
          "Solar panels get hot in the sun.",
        ], 0, "Польза для обеих сторон — тень растениям и охлаждение панелей."],
      ]),
      practice("transitions", "Transitions", "Определи отношение: следствие, контраст, пример, последовательность.", [
        ["The company's profits doubled last year. ______ it announced plans to open three new offices.", TRANSITION, ["As a result,", "Nevertheless,", "For example,", "In contrast,"], 0, "Рост прибыли → расширение: следствие."],
        ["Many people assume that deserts are always hot. ______ the Gobi Desert regularly experiences winter temperatures far below freezing.", TRANSITION, ["However,", "Therefore,", "Similarly,", "In addition,"], 0, "Противоречие ожиданию — However."],
        ["The recipe calls for several spices common in Central Asian cooking. Cumin, ______ gives the dish its warm, earthy flavor.", TRANSITION, ["for instance,", "nevertheless,", "consequently,", "in contrast,"], 0, "Кумин — пример специи."],
        ["First, the volunteers collected plastic waste from the riverbank. ______ they sorted it by type so that it could be recycled.", TRANSITION, ["Then", "However", "In other words", "Conversely"], 0, "Последовательность шагов."],
        ["The old bridge required constant repairs. The new bridge, ______ has needed almost no maintenance since it opened.", TRANSITION, ["by contrast,", "therefore,", "for example,", "similarly,"], 0, "Сравнение старого и нового — противопоставление."],
      ]),
    ],
  },
  {
    id: "conventions-practice",
    title: "Standard English Conventions · практика",
    subtitle: "Пунктуация и грамматика — новые задания",
    lessons: [
      practice("boundaries", "Boundaries", "Два независимых предложения — точка, точка с запятой или запятая + and/but/so. Двоеточие — после законченного предложения.", [
        ["The festival attracts musicians from many ______ last year, performers came from twenty-three countries.", CONVENTIONS, ["countries;", "countries,", "countries", "countries and,"], 0, "Два независимых предложения: точка с запятой."],
        ["The scientist needed only one ______ a microscope powerful enough to see individual cells.", CONVENTIONS, ["tool:", "tool;", "tool,", "tool. A"], 0, "После законченного предложения двоеточие вводит пояснение."],
        ["Al-Farabi, a philosopher born near ______ wrote influential works on logic and music.", CONVENTIONS, ["Otrar,", "Otrar", "Otrar;", "Otrar:"], 0, "Вставка открыта запятой — закрываем запятой."],
        ["The new library ______ which opened in March, already has more than ten thousand members.", CONVENTIONS, ["building,", "building", "building;", "building:"], 0, "Придаточное which… выделяется парными запятыми."],
        ["The results were clear: the students who slept more performed ______ in every subject.", CONVENTIONS, ["better", "better,", "better;", "better:"], 0, "Между глаголом и обстоятельством знак не нужен."],
      ]),
      practice("form-structure-sense", "Form, Structure, and Sense", "Найди настоящее подлежащее, проверь время и к кому относится оборот в начале.", [
        ["The list of rules posted on the laboratory doors ______ updated every September.", CONVENTIONS, ["is", "are", "were", "have been"], 0, "Подлежащее — list (ед. ч.)."],
        ["Each of the paintings in the exhibition ______ a different season.", CONVENTIONS, ["shows", "show", "are showing", "have shown"], 0, "Each — единственное число."],
        ["By the time the rescue team arrived, the hikers ______ for more than six hours.", CONVENTIONS, ["had waited", "wait", "will wait", "are waiting"], 0, "Действие до момента в прошлом — Past Perfect."],
        ["Having finished the experiment, ______", CONVENTIONS, [
          "the students wrote up their results.",
          "the results were written up by the students.",
          "writing up the results took the students an hour.",
          "the report was long.",
        ], 0, "Закончили эксперимент студенты — они должны стоять сразу после запятой."],
        ["The committee announced ______ decision after a long meeting.", CONVENTIONS, ["its", "it's", "their's", "they're"], 0, "Committee — ед. ч., притяжательное its."],
      ]),
    ],
  },
];
