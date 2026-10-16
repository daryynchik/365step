import { SAT_RW_PRACTICE } from "./sat-rw-practice";
import type { Course } from "./types";

/**
 * SAT Reading and Writing, organised exactly as the College Board organises the
 * digital SAT: four content domains, eleven skills. One lesson per skill.
 *
 * The questions are original, written in the format of the official ones. The
 * official questions themselves belong to College Board, so each lesson links
 * to the Student Question Bank, where every official question for that skill
 * can be filtered and practised for free.
 */

const QUESTION_BANK = "https://satsuite.collegeboard.org/practice/student-question-bank";

const official = (domain: string, skill: string) => ({
  label: `Официальные задания: Reading and Writing → ${domain} → ${skill}`,
  url: QUESTION_BANK,
});

export const SAT_RW: Course = {
  id: "sat-rw",
  title: "SAT Reading and Writing",
  short: "Reading & Writing",
  description:
    "Четыре домена и одиннадцать навыков цифрового SAT — в том порядке, в каком их описывает College Board.",
  units: [
    // ------------------------------------------------------------------ 1 --
    {
      id: "information-and-ideas",
      title: "Information and Ideas",
      subtitle: "Понять, что говорит текст, и найти доказательства",
      lessons: [
        {
          id: "central-ideas",
          title: "Central Ideas and Details",
          summary: "Главная мысль и детали текста",
          minutes: 10,
          official: official("Information and Ideas", "Central Ideas and Details"),
          theory: [
            {
              body:
                "Это самые частые вопросы раздела: **Which choice best states the main idea of the text?** или **According to the text, what…?** Текст всегда короткий — от 25 до 150 слов, — поэтому ответ почти всегда можно найти, не додумывая.",
            },
            {
              heading: "Как решать",
              body:
                "• Прочитай текст целиком, не глядя на варианты.\n• Скажи главную мысль своими словами — коротко, в одном предложении.\n• Только потом открой варианты и найди тот, что совпадает с твоей формулировкой.\n• В вопросах на детали ищи строчку в тексте, которая прямо подтверждает ответ.",
            },
            {
              heading: "Ловушки",
              body:
                "• **Слишком узко** — вариант пересказывает одну деталь, а не весь текст.\n• **Слишком широко** — вариант обобщает сильнее, чем позволяет текст.\n• **Правда, но не здесь** — утверждение звучит разумно, но в тексте его нет.\n• **Перевёрнуто** — слова из текста, но смысл противоположный.",
            },
          ],
          questions: [
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "Urban beekeeping has grown rapidly in many European cities over the past decade. While the hobby is often promoted as a way to help struggling bee populations, ecologist Elena Moroni points out that honeybees are managed livestock, not wild pollinators at risk. In cities where hive numbers have climbed sharply, her surveys found that wild bees had fewer flowers to forage on, suggesting that adding honeybees may sometimes harm the very insects the hobby claims to protect.",
                },
              ],
              prompt: "Which choice best states the main idea of the text?",
              options: [
                "Urban beekeeping has become one of the most popular hobbies in European cities.",
                "Moroni's research suggests that urban beekeeping may not help, and could even harm, wild bee populations.",
                "Wild bees are more effective pollinators than honeybees in urban environments.",
                "Cities should ban beekeeping in order to protect wild pollinators.",
              ],
              answer: 1,
              explanation:
                "Текст строится вокруг поворота: хобби считают полезным, но исследование Морони показывает обратное. Вариант A — только первая фраза (слишком узко). C в тексте не сравнивается. D — слишком сильный вывод: о запрете никто не говорит.",
            },
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "The following text is from a short story. Mara had rehearsed the speech for weeks, reciting it in the shower, on the bus, and under her breath during math class. But when she finally stood at the podium and looked out at the rows of faces, the words she had memorized seemed to belong to someone else. She set her notes aside and began to talk, simply, about her grandmother's garden.",
                },
              ],
              prompt: "According to the text, what does Mara do when she reaches the podium?",
              options: [
                "She reads her speech exactly as she had practiced it.",
                "She sets aside her prepared remarks and speaks about something personal.",
                "She asks the audience to share stories about their grandparents.",
                "She forgets what to say and leaves the stage.",
              ],
              answer: 1,
              explanation:
                "Последнее предложение прямо говорит: «She set her notes aside and began to talk… about her grandmother's garden». Вариант D звучит драматично, но в тексте она не уходит со сцены.",
            },
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "Researchers studying octopuses in a laboratory noticed that some animals repeatedly squirted water at particular staff members but not at others. To test whether the octopuses could tell people apart, the team had two researchers, dressed identically, interact with the animals: one always offered food, while the other always touched them with a bristly stick. Within two weeks, most octopuses approached the first researcher and avoided the second.",
                },
              ],
              prompt: "Which choice best states the main finding described in the text?",
              options: [
                "Octopuses prefer researchers who wear particular clothing.",
                "Octopuses can learn to tell individual humans apart based on how those humans have treated them.",
                "Octopuses become aggressive when they are kept in laboratories for long periods.",
                "Octopuses squirt water at people as a way of asking for food.",
              ],
              answer: 1,
              explanation:
                "Исследователи были одеты одинаково — значит, дело не в одежде (A неверен). Осьминоги отличали людей по тому, как те с ними обращались. C и D в тексте не подтверждаются.",
            },
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "Many people assume that the invention of the printing press quickly made books cheap and widely available. Historian Rachel Iyer argues that the change was slower than this story suggests: for decades after Gutenberg's press appeared around 1450, printed books remained expensive, and most were bought by the same wealthy institutions—churches and universities—that had previously bought handwritten manuscripts.",
                },
              ],
              prompt: "Which choice best states the main idea of the text?",
              options: [
                "Gutenberg built his press around 1450 in response to demand from universities.",
                "According to Iyer, the printing press did not quickly make books affordable to most people.",
                "Handwritten manuscripts were of higher quality than early printed books.",
                "Churches and universities tried to prevent the spread of the printing press.",
              ],
              answer: 1,
              explanation:
                "Текст спорит с распространённым мнением и подаёт версию Айер: перемены шли медленно, книги оставались дорогими. A выдумывает причину, C и D в тексте нет.",
            },
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "In 1933, the Chicago Symphony Orchestra performed Florence Price's Symphony in E Minor, making her the first African American woman to have a symphony played by a major American orchestra. Price, who had studied at the New England Conservatory, often drew on spirituals and on the rhythms of the juba, a dance with roots in African traditions, weaving these sources into the form of the European symphony.",
                },
              ],
              prompt: "According to the text, what is one feature of Price's music?",
              options: [
                "It rejected European musical forms in favor of entirely new structures.",
                "It combined elements of African American musical traditions with the form of the European symphony.",
                "It was performed only by the Chicago Symphony Orchestra.",
                "It was based mainly on music Price heard at the New England Conservatory.",
              ],
              answer: 1,
              explanation:
                "Ключевая фраза — «weaving these sources into the form of the European symphony»: она соединяла традиции, а не отвергала европейскую форму (A). C и D — додумывание.",
            },
          ],
        },
        {
          id: "textual-evidence",
          title: "Command of Evidence: Textual",
          summary: "Какая цитата или факт подтверждает утверждение",
          minutes: 12,
          official: official("Information and Ideas", "Command of Evidence"),
          theory: [
            {
              body:
                "Два типа вопросов. Первый: **Which finding, if true, would most directly support (или weaken) the researcher's hypothesis?** Второй: **Which quotation from the poem most effectively illustrates the claim?**",
            },
            {
              heading: "Гипотеза",
              body:
                "• Найди в тексте точную формулировку гипотезы и подчеркни, **что на что влияет**.\n• Правильный ответ проверяет именно эту связь — те же переменные, то же направление.\n• Чтобы ослабить гипотезу, нужен факт, при котором эффект есть без причины или причина есть без эффекта.",
            },
            {
              heading: "Цитата",
              body:
                "• Выдели в утверждении два-три ключевых слова.\n• Правильная цитата покрывает **все** части утверждения, а не одну.\n• Красивая, яркая цитата — частая ловушка: она может быть про другое.",
            },
          ],
          questions: [
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "Biologist Tomás Rivera hypothesizes that a species of desert lizard changes color mainly to regulate its body temperature rather than to hide from predators. The lizards darken in the cool early morning, which helps them absorb heat, and lighten in the midday sun.",
                },
              ],
              prompt: "Which finding, if true, would most directly support Rivera's hypothesis?",
              options: [
                "Lizards kept in enclosures with no predators still darken when temperatures drop and lighten when temperatures rise.",
                "The lizards' main predators hunt mostly at midday.",
                "The lizards' color changes are most dramatic during the breeding season.",
                "Lizards in the wild are darker on average than lizards kept in laboratories.",
              ],
              answer: 0,
              explanation:
                "Если цвет меняется и там, где хищников нет, значит, маскировка — не главная причина, а температура — да. Это прямо поддерживает гипотезу. Остальные варианты не отделяют одну причину от другой.",
            },
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "“Hope” is the thing with feathers - / That perches in the soul - / And sings the tune without the words - / And never stops - at all - … I’ve heard it in the chillest land - / And on the strangest Sea - / Yet - never - in Extremity, / It asked a crumb - of me.\n\n— Emily Dickinson, “Hope” is the thing with feathers (c. 1861)",
                },
              ],
              prompt:
                "A student claims that the speaker presents hope as something that asks for nothing in return, even in the hardest circumstances. Which quotation from the poem most effectively illustrates the claim?",
              options: [
                "“‘Hope’ is the thing with feathers - / That perches in the soul -”",
                "“And sings the tune without the words -”",
                "“I’ve heard it in the chillest land - / And on the strangest Sea -”",
                "“Yet - never - in Extremity, / It asked a crumb - of me.”",
              ],
              answer: 3,
              explanation:
                "В утверждении две части: «ничего не просит» и «даже в самых тяжёлых обстоятельствах». Только D покрывает обе: «never — in Extremity» и «asked a crumb». C — про тяжёлые места, но не про то, что надежда ничего не просит.",
            },
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "Shops along Hollis Street reported a 15 percent rise in sales in the year after the city opened a network of protected bike lanes there. Some local officials argue that the bike lanes caused the increase, since cyclists can stop at shops more easily than drivers can.",
                },
              ],
              prompt: "Which finding, if true, would most directly weaken the officials' argument?",
              options: [
                "Customers who arrive by bike tend to visit shops more often than customers who arrive by car.",
                "Shops on nearby streets without bike lanes reported a similar rise in sales during the same year.",
                "The bike lane network was completed ahead of schedule.",
                "Several shops on Hollis Street added outdoor seating during the year.",
              ],
              answer: 1,
              explanation:
                "Если продажи выросли так же и там, где велодорожек нет, то рост объясняется чем-то другим. Эффект есть без причины — это и ослабляет вывод. A, наоборот, поддерживает. D даёт возможную другую причину, но не показывает, что велодорожки ни при чём.",
            },
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "In Mary Shelley’s 1818 novel Frankenstein, Victor Frankenstein tells the story of how he created a living being. Looking back, he warns his listener that his own pursuit of knowledge was dangerous.",
                },
              ],
              prompt: "Which quotation from Frankenstein most effectively illustrates the claim?",
              options: [
                "“I am by birth a Genevese, and my family is one of the most distinguished of that republic.”",
                "“Learn from me, if not by my precepts, at least by my example, how dangerous is the acquirement of knowledge…”",
                "“It was on a dreary night of November that I beheld the accomplishment of my toils.”",
                "“We were brought up together; there was not quite a year difference in our ages.”",
              ],
              answer: 1,
              explanation:
                "Утверждение — о предупреждении, что знание опасно. Только B прямо об этом говорит («how dangerous is the acquirement of knowledge»). C — про момент создания, но не про опасность знания.",
            },
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "A team of psychologists hypothesized that students who review flashcards in the evening, shortly before sleep, remember more of the material than students who review the same flashcards in the morning.",
                },
              ],
              prompt: "Which finding, if true, would most directly support the psychologists' hypothesis?",
              options: [
                "Most students in the study said they preferred to study in the evening.",
                "When tested 12 hours after studying, students who reviewed in the evening recalled more cards than students who reviewed the same cards in the morning.",
                "Students who slept fewer than six hours recalled fewer cards overall.",
                "Morning study sessions in the study tended to be shorter than evening ones.",
              ],
              answer: 1,
              explanation:
                "B сравнивает ровно то, о чём гипотеза: вечер против утра, одинаковые карточки, одинаковая пауза до теста. A — о предпочтениях, а не о памяти. D, наоборот, даёт другое объяснение.",
            },
          ],
        },
        {
          id: "quantitative-evidence",
          title: "Command of Evidence: Quantitative",
          summary: "Таблицы и графики как доказательство",
          minutes: 12,
          official: official("Information and Ideas", "Command of Evidence"),
          theory: [
            {
              body:
                "Вопрос звучит так: **Which choice most effectively uses data from the table to complete the statement?** Таблица — только инструмент. Ответ должен одновременно (1) быть верным по данным и (2) подтверждать именно то утверждение, которое сделано в тексте.",
            },
            {
              heading: "Как решать",
              body:
                "• Сначала прочитай текст и найди утверждение, которое нужно подкрепить.\n• Потом посмотри на таблицу: названия столбцов, единицы, годы.\n• Отбрось варианты, которые неверны по данным.\n• Из оставшихся выбери тот, что отвечает на утверждение, а не просто пересказывает число.",
            },
            {
              heading: "Главная ловушка",
              body:
                "Почти всегда есть вариант, который **верен по таблице**, но не связан с утверждением. Он выглядит надёжно, потому что «цифры правильные».",
            },
          ],
          questions: [
            {
              kind: "choice",
              table: {
                caption: "Average daily screen time (hours)",
                head: ["Age group", "2015", "2023"],
                rows: [
                  ["13–17", "6.1", "7.4"],
                  ["18–24", "5.8", "6.2"],
                  ["25–34", "4.9", "5.0"],
                ],
              },
              passages: [
                {
                  text:
                    "A researcher claims that between 2015 and 2023, the increase in daily screen time was greatest among the youngest age group in the study.",
                },
              ],
              prompt: "Which choice most effectively uses data from the table to support the researcher's claim?",
              options: [
                "Among 13- to 17-year-olds, screen time rose from 6.1 to 7.4 hours, while in each of the other groups it rose by less than half an hour.",
                "In 2023, 18- to 24-year-olds spent an average of 6.2 hours per day on screens.",
                "The 25–34 age group had the lowest screen time in both 2015 and 2023.",
                "In 2015, 13- to 17-year-olds already spent more than 6 hours per day on screens.",
              ],
              answer: 0,
              explanation:
                "Утверждение — о сравнении прироста. Только A сравнивает прирост: +1,3 часа у младшей группы против +0,4 и +0,1. C и D верны по таблице, но не о приросте.",
            },
            {
              kind: "choice",
              table: {
                caption: "Wheat yield and water use by irrigation method",
                head: ["Method", "Yield (tons per hectare)", "Water used (thousand m³ per hectare)"],
                rows: [
                  ["Flood", "3.1", "7.5"],
                  ["Sprinkler", "3.6", "5.8"],
                  ["Drip", "4.0", "4.2"],
                ],
              },
              passages: [
                {
                  text:
                    "An agronomist compared three irrigation methods on test fields and concluded that drip irrigation was the most efficient of the three because ______",
                },
              ],
              prompt: "Which choice most effectively uses data from the table to complete the statement?",
              options: [
                "it produced the highest yield while using the least water.",
                "flood irrigation used 7.5 thousand cubic meters of water per hectare.",
                "sprinkler irrigation produced 3.6 tons of wheat per hectare.",
                "it used more water than sprinkler irrigation did.",
              ],
              answer: 0,
              explanation:
                "Эффективность = больше урожая на меньшем количестве воды. У капельного полива самый высокий урожай (4,0) и самый низкий расход (4,2). D неверен по данным, B и C не про капельный полив.",
            },
            {
              kind: "choice",
              table: {
                caption: "Residents who used the public library at least once a month",
                head: ["Year", "2010", "2015", "2020", "2023"],
                rows: [["Percent", "34%", "29%", "25%", "31%"]],
              },
              passages: [
                {
                  text:
                    "A city report states that library use declined steadily for a decade before partially recovering.",
                },
              ],
              prompt: "Which choice most effectively uses data from the table to support the report's statement?",
              options: [
                "Library use fell from 34% in 2010 to 25% in 2020 and then rose to 31% in 2023.",
                "In 2023, 31% of residents used the library at least once a month.",
                "More than a quarter of residents used the library every year shown.",
                "Library use increased every five years between 2010 and 2023.",
              ],
              answer: 0,
              explanation:
                "В утверждении две части: десятилетие спада и частичное восстановление. A показывает обе. C неверен: в 2020 было ровно 25%, а не больше четверти. D противоречит данным.",
            },
            {
              kind: "choice",
              table: {
                caption: "Birds counted at two wetland sites",
                head: ["Site", "Herons", "Egrets"],
                rows: [
                  ["Site A", "42", "18"],
                  ["Site B", "15", "37"],
                ],
              },
              passages: [
                {
                  text:
                    "An ecologist observed that the two wetland sites seemed to favor different species of wading birds: ______",
                },
              ],
              prompt: "Which choice most effectively uses data from the table to complete the statement?",
              options: [
                "Site A had more herons than egrets, while Site B had more egrets than herons.",
                "both sites had at least 15 herons.",
                "Site B had 37 egrets.",
                "Site A had more birds in total than Site B did.",
              ],
              answer: 0,
              explanation:
                "Утверждение — о том, что на участках преобладают разные виды. A показывает именно это. D верно (60 против 52), но к видам отношения не имеет.",
            },
            {
              kind: "choice",
              table: {
                caption: "Three electric car models",
                head: ["Model", "Time to charge to 80% (min)", "Range (km)"],
                rows: [
                  ["X", "25", "380"],
                  ["Y", "40", "520"],
                  ["Z", "32", "450"],
                ],
              },
              passages: [
                {
                  text:
                    "A reviewer noted that among the three models tested, faster charging did not go together with a longer range.",
                },
              ],
              prompt: "Which choice most effectively uses data from the table to illustrate the reviewer's point?",
              options: [
                "Model X charged the fastest, in 25 minutes, but had the shortest range, 380 km.",
                "Model Y had a range of 520 km.",
                "Model Z charged to 80% in 32 minutes and had a range of 450 km.",
                "All three models had a range of more than 350 km.",
              ],
              answer: 0,
              explanation:
                "Чтобы показать, что быстрая зарядка не означает большой запас хода, нужен пример: самая быстрая модель — с самым маленьким запасом. Это A.",
            },
          ],
        },
        {
          id: "inferences",
          title: "Inferences",
          summary: "Логично закончить мысль автора",
          minutes: 12,
          official: official("Information and Ideas", "Inferences"),
          theory: [
            {
              body:
                "Вопрос всегда один: **Which choice most logically completes the text?** Текст обрывается пропуском, и нужно выбрать вывод, который **неизбежно следует** из сказанного.",
            },
            {
              heading: "Как решать",
              body:
                "• Прочитай текст как цепочку: факт → факт → ______.\n• Подумай, какой вывод делают из этих фактов, до того как смотреть варианты.\n• Обрати внимание на слова-сигналы: however, because, thus, these findings suggest.\n• Правильный ответ всегда осторожен: «may», «likely», «suggests». Слишком смелый вывод — почти всегда ловушка.",
            },
          ],
          questions: [
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "Glaciologists have found that dark particles such as soot and dust settling on glaciers absorb more sunlight than clean ice does. Because absorbed sunlight warms the ice, researchers have concluded that glaciers downwind of large industrial cities, which release substantial amounts of soot, ______",
                },
              ],
              prompt: "Which choice most logically completes the text?",
              options: [
                "are likely to melt faster than comparable glaciers far from such sources.",
                "reflect more sunlight than other glaciers do.",
                "produce soot that is carried back to the cities.",
                "are unaffected by changes in air temperature.",
              ],
              answer: 0,
              explanation:
                "Цепочка: сажа → больше поглощённого света → лёд нагревается. Ледники рядом с источником сажи получают её больше → тают быстрее. B — наоборот.",
            },
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "Historians have long relied on the diary of merchant John Hale for details about trade in 1740s Boston. However, a recent analysis showed that the diary's paper was manufactured no earlier than 1790, and its handwriting closely matches letters written by Hale's grandson in the 1800s. These findings suggest that ______",
                },
              ],
              prompt: "Which choice most logically completes the text?",
              options: [
                "the diary may have been written or copied decades after the events it describes, so historians should be cautious about treating it as a firsthand record.",
                "trade in 1740s Boston was less active than historians previously believed.",
                "Hale's grandson was also a successful merchant.",
                "historians had never read the diary carefully before.",
              ],
              answer: 0,
              explanation:
                "Бумага сделана после 1790 года, почерк — внука. Значит, дневник, скорее всего, написан или переписан позже, и ему нельзя доверять как свидетельству очевидца. B — про торговлю, о которой новых данных нет.",
            },
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "In a study of 200 hospital patients recovering from the same kind of surgery, those whose rooms faced a garden needed, on average, less pain medication than those whose rooms faced a brick wall. Patients were assigned to rooms at random, and the two groups were similar in age and overall health. These results suggest that ______",
                },
              ],
              prompt: "Which choice most logically completes the text?",
              options: [
                "a view of nature may help reduce patients' need for pain medication.",
                "brick walls cause patients to experience more pain.",
                "older patients prefer rooms with a view of a garden.",
                "surgery is less painful in newer hospitals.",
              ],
              answer: 0,
              explanation:
                "Случайное распределение по палатам делает вывод о влиянии вида из окна обоснованным, но формулировка должна быть осторожной: «may help». B сильнее, чем позволяют данные. C и D в тексте не обсуждаются.",
            },
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "Many flowering plants reward pollinators with nectar. Some orchids, however, attract male wasps by releasing scents that mimic those of female wasps. Male wasps try to mate with the flower and carry pollen away when they leave. Because these orchids offer no nectar at all, ______",
                },
              ],
              prompt: "Which choice most logically completes the text?",
              options: [
                "their pollination depends on deceiving the wasps rather than rewarding them.",
                "female wasps visit them more often than male wasps do.",
                "bees are their main pollinators.",
                "the wasps feed on their pollen instead.",
              ],
              answer: 0,
              explanation:
                "Нектара нет, а осы прилетают из-за обманного запаха. Значит, опыление держится на обмане, а не на награде. Остальные варианты противоречат тексту или ничем не подкреплены.",
            },
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "Linguists studying a community where two languages are spoken found that children often switch between the languages within a single sentence. Earlier researchers had assumed that such switching signaled weak knowledge of both languages. But the switching followed consistent grammatical patterns, and the children who switched most often scored highest on vocabulary tests in both languages. Thus, the findings challenge the assumption that ______",
                },
              ],
              prompt: "Which choice most logically completes the text?",
              options: [
                "switching between languages reflects a lack of skill.",
                "children learn languages faster than adults do.",
                "vocabulary tests accurately measure grammar.",
                "bilingual communities are rare.",
              ],
              answer: 0,
              explanation:
                "Ранее считали, что переключение = слабое знание языков. Новые данные показывают обратное. Значит, опровергается именно это предположение.",
            },
          ],
        },
      ],
    },

    // ------------------------------------------------------------------ 2 --
    {
      id: "craft-and-structure",
      title: "Craft and Structure",
      subtitle: "Слова, строение текста и диалог двух текстов",
      lessons: [
        {
          id: "words-in-context",
          title: "Words in Context",
          summary: "Точное слово для этого контекста",
          minutes: 10,
          official: official("Craft and Structure", "Words in Context"),
          theory: [
            {
              body:
                "Вопрос: **Which choice completes the text with the most logical and precise word or phrase?** Иногда: **As used in the text, what does the word … most nearly mean?** Проверяется не знание редких слов, а умение увидеть, какое значение требует контекст.",
            },
            {
              heading: "Как решать",
              body:
                "• Закрой варианты и вставь в пропуск своё простое слово.\n• Найди в тексте подсказку: контраст (although, yet, but), причину (because), уточнение после двоеточия.\n• Выбери вариант, ближайший к твоему слову по смыслу и по «силе».\n• Для «most nearly mean» подставь каждый вариант вместо слова и проверь, не изменился ли смысл.",
            },
          ],
          questions: [
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "Although the committee's report ran to more than three hundred pages, its central recommendation was strikingly ______: the city should plant ten thousand trees within five years.",
                },
              ],
              prompt: "Which choice completes the text with the most logical and precise word or phrase?",
              options: ["succinct", "ambiguous", "elaborate", "tentative"],
              answer: 0,
              explanation:
                "«Although» задаёт контраст: длинный отчёт — но главная рекомендация… короткая. После двоеточия идёт одна простая фраза. Succinct = краткий и ясный.",
            },
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "The paleontologist was initially ______ about the new fossil's age, but after a second laboratory confirmed the results, she announced them publicly.",
                },
              ],
              prompt: "Which choice completes the text with the most logical and precise word or phrase?",
              options: ["skeptical", "enthusiastic", "indifferent", "certain"],
              answer: 0,
              explanation:
                "Ей понадобилось подтверждение второй лаборатории, прежде чем объявить результат. Значит, сначала она сомневалась — skeptical. Certain противоречит смыслу «but after… confirmed».",
            },
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "Sculptor Ruth Asawa's looped-wire forms appear delicate, yet they are remarkably ______: many have survived decades of public display without losing their shape.",
                },
              ],
              prompt: "Which choice completes the text with the most logical and precise word or phrase?",
              options: ["durable", "fragile", "ornate", "transparent"],
              answer: 0,
              explanation:
                "«Appear delicate, yet…» — контраст, а после двоеточия: прослужили десятилетия. Нужно слово про прочность — durable. Fragile — ровно противоположное.",
            },
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "The spread of the disease was finally checked by a vaccine that reached even remote mountain villages within weeks.",
                },
              ],
              prompt: "As used in the text, what does the word “checked” most nearly mean?",
              options: ["examined", "halted", "marked", "verified"],
              answer: 1,
              explanation:
                "Вакцина не «проверила» распространение болезни, а остановила его. Подставь «halted» — смысл сохраняется. Examined и verified — частые, но здесь неверные значения слова check.",
            },
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "In her memoir, the chef recalls that her grandmother's cooking was never ______: each dish was adjusted to the day's weather, the season's produce, and the mood of the household.",
                },
              ],
              prompt: "Which choice completes the text with the most logical and precise word or phrase?",
              options: ["improvised", "static", "flavorful", "generous"],
              answer: 1,
              explanation:
                "После двоеточия: каждое блюдо менялось. Значит, кухня никогда не была неизменной — static. Improvised дало бы противоположный смысл.",
            },
          ],
        },
        {
          id: "text-structure",
          title: "Text Structure and Purpose",
          summary: "Зачем автор написал текст или фразу",
          minutes: 12,
          official: official("Craft and Structure", "Text Structure and Purpose"),
          theory: [
            {
              body:
                "Вопросы: **Which choice best describes the function of the underlined sentence?**, **…the overall structure of the text?**, **…the main purpose of the text?** Здесь важно не что сказано, а **зачем**.",
            },
            {
              heading: "Как решать",
              body:
                "• Для подчёркнутой фразы спроси: что она делает по отношению к соседним? Вводит, уточняет, возражает, приводит пример, ограничивает?\n• Для структуры подпиши каждую фразу одним глаголом: «утверждает», «опровергает», «объясняет».\n• Смотри на первое слово варианта ответа: оно должно точно описывать действие (describes, challenges, illustrates, qualifies).",
            },
          ],
          questions: [
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "For more than a century, many European mapmakers drew California as an island. __The error persisted even after explorers had traveled overland and reported that California was connected to the mainland.__ Copying older maps was far cheaper than commissioning new surveys, so the mistake was reproduced again and again.",
                },
              ],
              prompt: "Which choice best describes the function of the underlined sentence in the text as a whole?",
              options: [
                "It shows that the mistake continued despite evidence that contradicted it.",
                "It explains why explorers traveled overland to California.",
                "It introduces a mapmaker who eventually corrected the error.",
                "It suggests that California was once separated from the mainland.",
              ],
              answer: 0,
              explanation:
                "Подчёркнутая фраза говорит: ошибку продолжали повторять, хотя уже были данные об обратном. Следующая фраза объясняет почему. Никакого картографа-исправителя (C) в тексте нет.",
            },
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "Many people believe that all sharks must swim constantly in order to breathe. This is true of some species, such as the great white, which rely on water flowing over their gills as they move. Other species, however, such as the nurse shark, can pump water over their gills while resting on the sea floor. The common belief, then, applies to only some members of a diverse group.",
                },
              ],
              prompt: "Which choice best describes the overall structure of the text?",
              options: [
                "It presents a common belief, shows that it holds in some cases but not others, and then qualifies the belief.",
                "It describes an experiment on sharks and then reports its results.",
                "It compares two scientific theories and argues in favor of one of them.",
                "It lists several shark species in order of size.",
              ],
              answer: 0,
              explanation:
                "Убеждение → верно для одних → неверно для других → вывод-ограничение. Это ровно A. Эксперимента (B) и спора двух теорий (C) в тексте нет.",
            },
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "The following text is from a personal essay. Every evening, the narrow street outside my window fills with sounds: a vendor folding up his stall, children being called home for dinner, a radio playing the same old song from an upstairs flat. None of these sounds is remarkable on its own. Together, though, they tell me that the day has ended and that the street, like the people on it, is getting ready to rest.",
                },
              ],
              prompt: "Which choice best states the main purpose of the text?",
              options: [
                "To describe how ordinary sounds together signal the end of the day for the narrator.",
                "To complain about the noise on the narrator's street.",
                "To explain how street vendors set up and close their stalls.",
                "To argue that cities should be quieter in the evening.",
              ],
              answer: 0,
              explanation:
                "Тон спокойный, без жалоб (B) и без призывов (D). Автор описывает, как обычные звуки вместе означают для него конец дня.",
            },
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "Volcanologists can sometimes forecast eruptions by monitoring swarms of small earthquakes beneath a volcano. __Such forecasts are far from perfect, however: at some volcanoes, intense earthquake swarms have come and gone without any eruption following.__ Researchers are therefore combining earthquake data with measurements of gas emissions and ground swelling.",
                },
              ],
              prompt: "Which choice best describes the function of the underlined sentence in the text as a whole?",
              options: [
                "It points out a limitation of the method described in the previous sentence.",
                "It gives an example of a forecast that turned out to be accurate.",
                "It explains why volcanoes erupt.",
                "It argues that gas measurements are less useful than earthquake data.",
              ],
              answer: 0,
              explanation:
                "«Far from perfect, however» — сигнал ограничения. Фраза показывает слабое место метода, а следующая — как исследователи на это отвечают.",
            },
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "Economist Rita Ochoa expected that raising parking fees in a city's downtown would reduce traffic there. Instead, after the fees rose, traffic barely changed, though the number of people riding the city's buses increased slightly. Ochoa now suspects that most downtown drivers are commuters who have few practical alternatives to driving.",
                },
              ],
              prompt: "Which choice best states the main purpose of the text?",
              options: [
                "To describe a result that differed from a researcher's expectation and her revised explanation.",
                "To argue that cities should lower parking fees.",
                "To explain how city bus systems are funded.",
                "To compare traffic patterns in several cities.",
              ],
              answer: 0,
              explanation:
                "Ожидание → неожиданный результат → новое объяснение. Текст ничего не советует (B) и говорит об одном городе (D).",
            },
          ],
        },
        {
          id: "cross-text",
          title: "Cross-Text Connections",
          summary: "Как один автор ответил бы другому",
          minutes: 12,
          official: official("Craft and Structure", "Cross-Text Connections"),
          theory: [
            {
              body:
                "Два коротких текста на одну тему. Вопрос: **Based on the texts, how would the author of Text 2 most likely respond to …in Text 1?**",
            },
            {
              heading: "Как решать",
              body:
                "• Сформулируй позицию каждого текста в одной строке.\n• Определи отношение: согласен, возражает, уточняет, усложняет картину?\n• Чаще всего Text 2 не «полностью опровергает», а **показывает, что Text 1 что-то упустил**.\n• Отбрасывай варианты, где автору Text 2 приписывают мнения о том, о чём он не писал.",
            },
          ],
          questions: [
            {
              kind: "choice",
              passages: [
                {
                  label: "Text 1",
                  text:
                    "Many educators argue that students should be allowed to use calculators on all math tests. Calculators, they claim, free students from tedious arithmetic so that they can concentrate on reasoning and problem solving.",
                },
                {
                  label: "Text 2",
                  text:
                    "Researcher Lin Zhao found that students who relied on calculators early in their schooling had more difficulty judging whether an answer was reasonable. Zhao suggests that practice with basic arithmetic builds a “number sense” that later supports mathematical reasoning.",
                },
              ],
              prompt: "Based on the texts, how would Zhao (Text 2) most likely respond to the educators in Text 1?",
              options: [
                "By suggesting that arithmetic practice may itself help build the reasoning skills the educators value.",
                "By agreeing that calculators should be allowed on every math test.",
                "By arguing that reasoning is less important than arithmetic.",
                "By claiming that calculators are too expensive for most schools.",
              ],
              answer: 0,
              explanation:
                "Педагоги противопоставляют арифметику и рассуждение. Чжао показывает, что одно поддерживает другое. Она не говорит, что рассуждение менее важно (C).",
            },
            {
              kind: "choice",
              passages: [
                {
                  label: "Text 1",
                  text:
                    "Some historians credit the rapid growth of nineteenth-century cities mainly to factory jobs, which drew workers away from the countryside.",
                },
                {
                  label: "Text 2",
                  text:
                    "Historian Amara Diallo notes that many cities grew quickly even before large factories appeared there, because improvements in farming meant that fewer people were needed to work the land.",
                },
              ],
              prompt: "Based on the texts, how would Diallo most likely respond to the historians in Text 1?",
              options: [
                "She would argue that their explanation overlooks changes in the countryside that pushed people toward cities.",
                "She would agree that factory jobs were the only reason cities grew.",
                "She would argue that nineteenth-century cities did not actually grow.",
                "She would claim that improvements in farming happened only after factories were built.",
              ],
              answer: 0,
              explanation:
                "Text 1 видит причину в притяжении городов (фабрики), Text 2 — в выталкивании из деревни. Диалло дополняет картину, а не отрицает рост городов.",
            },
            {
              kind: "choice",
              passages: [
                {
                  label: "Text 1",
                  text:
                    "A new study reports that people who drink coffee every day live longer, on average, than people who do not. The study's authors recommend daily coffee for its health benefits.",
                },
                {
                  label: "Text 2",
                  text:
                    "Daily coffee drinkers in such studies often differ from non-drinkers in other ways—for example, they may have higher incomes and better access to health care. Unless researchers account for these differences, it is hard to know what effect coffee itself has.",
                },
              ],
              prompt: "Based on the texts, how would the author of Text 2 most likely respond to the recommendation in Text 1?",
              options: [
                "The recommendation may be premature, because other factors could explain the longer lifespans.",
                "Coffee is harmful and should be avoided.",
                "The study included too many participants to be reliable.",
                "The recommendation is fully supported by the evidence.",
              ],
              answer: 0,
              explanation:
                "Автор Text 2 не утверждает, что кофе вреден (B). Он говорит, что связь может объясняться другими факторами — значит, рекомендация преждевременна.",
            },
            {
              kind: "choice",
              passages: [
                {
                  label: "Text 1",
                  text:
                    "Critics of social media argue that it isolates teenagers by replacing face-to-face friendships with shallow online contact.",
                },
                {
                  label: "Text 2",
                  text:
                    "In interviews with 120 teenagers, sociologist Mei Tanaka found that most used social media mainly to stay in touch with friends they also saw at school—often to plan meeting in person.",
                },
              ],
              prompt: "Which choice best describes how Text 2 relates to Text 1?",
              options: [
                "Text 2 presents findings that complicate the critics' claim in Text 1.",
                "Text 2 gives an example that supports the critics' claim in Text 1.",
                "Text 2 explains the history of the concern described in Text 1.",
                "Text 2 proposes a solution to the problem described in Text 1.",
              ],
              answer: 0,
              explanation:
                "Критики говорят, что соцсети заменяют живое общение. Данные Танаки показывают, что они часто помогают встречаться вживую. Это усложняет их тезис.",
            },
            {
              kind: "choice",
              passages: [
                {
                  label: "Text 1",
                  text:
                    "Linguist Paolo Rinaldi argues that languages with more speakers tend to have simpler grammar. Adult learners, who often struggle with complex rules, gradually wear those rules away as a language spreads.",
                },
                {
                  label: "Text 2",
                  text:
                    "A team analyzing grammatical data from more than 2,000 languages found no consistent relationship between a language's number of speakers and its grammatical complexity once they accounted for how closely related the languages were.",
                },
              ],
              prompt: "Based on the texts, how would the team in Text 2 most likely respond to Rinaldi's argument?",
              options: [
                "They would question whether the pattern Rinaldi describes actually exists once related languages are taken into account.",
                "They would agree that widely spoken languages have simpler grammar.",
                "They would argue that adult learners have no effect on how languages change.",
                "They would claim that languages with few speakers have the simplest grammar.",
              ],
              answer: 0,
              explanation:
                "Ринальди объясняет закономерность. Команда показывает, что самой закономерности в данных нет. О роли взрослых учащихся (C) она ничего не утверждает.",
            },
          ],
        },
      ],
    },

    // ------------------------------------------------------------------ 3 --
    {
      id: "expression-of-ideas",
      title: "Expression of Ideas",
      subtitle: "Собрать мысль из заметок и связать предложения",
      lessons: [
        {
          id: "rhetorical-synthesis",
          title: "Rhetorical Synthesis",
          summary: "Выбрать из заметок то, что решает задачу",
          minutes: 10,
          official: official("Expression of Ideas", "Rhetorical Synthesis"),
          theory: [
            {
              body:
                "Даны заметки студента и цель: **The student wants to emphasize…, introduce…, contrast…** Нужно выбрать предложение, которое **решает именно эту цель**.",
            },
            {
              heading: "Главный секрет",
              body:
                "Заметки читать почти не нужно. Все варианты верны по фактам — отличаются они только тем, выполняют ли цель.\n\n• Прочитай цель и подчеркни глагол: emphasize, contrast, introduce, explain.\n• Проверь каждый вариант: делает ли он то, что сказано в цели?\n• «Contrast» требует двух сторон. «Introduce to an unfamiliar audience» — объяснения, кто это. «Emphasize the scale» — числа.",
            },
          ],
          questions: [
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "While researching a topic, a student has taken the following notes:\n\n• The Great Green Wall is an initiative to restore land across Africa's Sahel region.\n• It was launched in 2007 by the African Union.\n• Its goal is to restore 100 million hectares of degraded land by 2030.\n• Projects include planting trees and reviving traditional water-harvesting methods.",
                },
              ],
              prompt:
                "The student wants to emphasize the scale of the initiative's goal. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
              options: [
                "The Great Green Wall, launched in 2007, includes tree-planting projects.",
                "The Great Green Wall aims to restore 100 million hectares of degraded land across the Sahel by 2030.",
                "The African Union launched an initiative in Africa's Sahel region.",
                "Traditional water-harvesting methods are being revived in the Sahel.",
              ],
              answer: 1,
              explanation:
                "Масштаб цели = 100 миллионов гектаров. Только B говорит о размере цели.",
            },
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "While researching a topic, a student has taken the following notes:\n\n• Kurmangazy Sagyrbayuly was a nineteenth-century Kazakh composer.\n• He was a master of the dombra, a two-stringed lute.\n• His best-known kui (instrumental piece), “Adai,” is fast and energetic.\n• Kazakhstan's national orchestra of folk instruments is named after him.",
                },
              ],
              prompt:
                "The student wants to introduce Kurmangazy to an audience unfamiliar with him. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
              options: [
                "“Adai” is fast and energetic.",
                "Kurmangazy Sagyrbayuly, a nineteenth-century Kazakh composer and master of the dombra—a two-stringed lute—is best known for his energetic kui “Adai.”",
                "Kazakhstan's national orchestra of folk instruments is named after Kurmangazy.",
                "The dombra is a lute with two strings.",
              ],
              answer: 1,
              explanation:
                "Незнакомой аудитории нужно объяснить, кто это: время, страна, профессия, чем известен — и даже что такое домбра. Это делает только B.",
            },
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "While researching a topic, a student has taken the following notes:\n\n• Mangroves are trees that grow in salty coastal water.\n• Their tangled roots slow incoming waves and reduce coastal erosion.\n• Mangrove forests store large amounts of carbon in their soil.\n• Many mangrove forests have been cleared to make room for shrimp farms.",
                },
              ],
              prompt:
                "The student wants to present reasons for protecting mangrove forests. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
              options: [
                "Mangroves are trees that grow in salty water along coasts.",
                "Because they slow waves, reduce erosion, and store large amounts of carbon, mangrove forests are worth protecting.",
                "Many mangrove forests have been cleared for shrimp farms.",
                "Mangroves have tangled roots and grow in coastal water.",
              ],
              answer: 1,
              explanation:
                "Цель — причины защищать. B называет пользу мангровых лесов и прямо связывает её с защитой. C описывает угрозу, но не причину защищать.",
            },
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "While researching a topic, a student has taken the following notes:\n\n• Study A tested a reading app with 300 students for six weeks.\n• In Study A, reading scores rose by 4 percent.\n• Study B tested the same app with 3,000 students for a full school year.\n• In Study B, reading scores did not change.",
                },
              ],
              prompt:
                "The student wants to contrast the findings of the two studies. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
              options: [
                "Study A included 300 students and lasted six weeks.",
                "While a six-week study of 300 students found a 4 percent rise in reading scores, a year-long study of 3,000 students found no change.",
                "Both studies tested the same reading app.",
                "Study B lasted a full school year.",
              ],
              answer: 1,
              explanation:
                "Контраст требует двух сторон и слова-противопоставления (while). B сравнивает результаты обоих исследований. C говорит об их сходстве.",
            },
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "While researching a topic, a student has taken the following notes:\n\n• Ada Lovelace (1815–1852) was an English mathematician.\n• She wrote detailed notes on Charles Babbage's proposed Analytical Engine.\n• Her notes included a method for calculating Bernoulli numbers with the machine.\n• This method is often described as the first published computer program.",
                },
              ],
              prompt:
                "The student wants to explain why Lovelace is considered important in the history of computing. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
              options: [
                "Ada Lovelace was an English mathematician born in 1815.",
                "Lovelace wrote detailed notes on a machine proposed by Charles Babbage.",
                "Lovelace's notes on Babbage's Analytical Engine included a method for calculating Bernoulli numbers that is often described as the first published computer program.",
                "Charles Babbage proposed a machine called the Analytical Engine.",
              ],
              answer: 2,
              explanation:
                "Объяснить важность = сказать, что она сделала особенного. Только C упоминает «первую опубликованную программу».",
            },
          ],
        },
        {
          id: "transitions",
          title: "Transitions",
          summary: "Логическая связка между предложениями",
          minutes: 8,
          official: official("Expression of Ideas", "Transitions"),
          theory: [
            {
              body:
                "Вопрос: **Which choice completes the text with the most logical transition?** Нужно понять **логическое отношение** между предложениями, и только потом выбрать слово.",
            },
            {
              heading: "Четыре отношения",
              body:
                "• **Причина → следствие:** therefore, thus, as a result, consequently.\n• **Контраст:** however, by contrast, instead, nevertheless.\n• **Пример или уточнение:** for example, for instance, in other words, specifically.\n• **Добавление или последовательность:** moreover, in addition, next, finally, similarly.",
            },
            {
              heading: "Приём",
              body:
                "Прочитай оба предложения без связки и спроси: второе — это следствие, противоположность, пример или продолжение? Если два варианта значат одно и то же (thus и therefore), оба неверны.",
            },
          ],
          questions: [
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "Octopuses have no bones. ______ they can squeeze through any opening larger than their hard beak.",
                },
              ],
              prompt: "Which choice completes the text with the most logical transition?",
              options: ["As a result,", "However,", "For example,", "Similarly,"],
              answer: 0,
              explanation:
                "Нет костей → могут протиснуться в любую щель. Это причина и следствие: As a result.",
            },
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "The museum's new wing was expected to draw more visitors. ______ attendance fell during the first year after the wing opened, possibly because ticket prices rose at the same time.",
                },
              ],
              prompt: "Which choice completes the text with the most logical transition?",
              options: ["Indeed,", "Instead,", "Thus,", "Likewise,"],
              answer: 1,
              explanation:
                "Ожидали рост — получили спад. Это контраст между ожиданием и результатом: Instead.",
            },
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "Many desert plants store water in thick stems or leaves. The saguaro cactus, ______ can expand its ribbed trunk to hold hundreds of liters of water after a heavy rain.",
                },
              ],
              prompt: "Which choice completes the text with the most logical transition?",
              options: ["for example,", "nevertheless,", "in contrast,", "meanwhile,"],
              answer: 0,
              explanation:
                "Общее утверждение о пустынных растениях → конкретный кактус. Это пример: for example.",
            },
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "The first draft of the novel took the author ten years to complete. The second draft, ______ took only eight months.",
                },
              ],
              prompt: "Which choice completes the text with the most logical transition?",
              options: ["by contrast,", "consequently,", "similarly,", "in addition,"],
              answer: 0,
              explanation:
                "Десять лет против восьми месяцев — противопоставление: by contrast.",
            },
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "Researchers first measured how far the bees traveled each day using tiny radio tags. ______ they compared these ranges with maps of nearby farmland to see which crops the bees were visiting.",
                },
              ],
              prompt: "Which choice completes the text with the most logical transition?",
              options: ["Next,", "Nonetheless,", "In other words,", "Conversely,"],
              answer: 0,
              explanation:
                "«First» в первом предложении подсказывает последовательность шагов: Next.",
            },
          ],
        },
      ],
    },

    // ------------------------------------------------------------------ 4 --
    {
      id: "standard-english-conventions",
      title: "Standard English Conventions",
      subtitle: "Пунктуация и грамматика",
      lessons: [
        {
          id: "boundaries",
          title: "Boundaries",
          summary: "Где ставить точку, запятую, двоеточие",
          minutes: 12,
          official: official("Standard English Conventions", "Boundaries"),
          theory: [
            {
              body:
                "Вопрос: **Which choice completes the text so that it conforms to the conventions of Standard English?** В «Boundaries» проверяют знаки между частями предложения.",
            },
            {
              heading: "Правила, которые решают почти всё",
              body:
                "• Два **независимых предложения** нельзя соединить одной запятой. Можно точкой, точкой с запятой или запятой + and, but, so.\n• **Двоеточие** ставится после законченного предложения и вводит пояснение или список.\n• **Не ставь** запятую между подлежащим и сказуемым или между глаголом и дополнением.\n• Вставку выделяют **парными** знаками: две запятые или два тире, не вперемешку.",
            },
            {
              heading: "Быстрая проверка",
              body:
                "Закрой пальцем часть после пропуска. Слева законченное предложение? Справа тоже? Если оба да — нужна точка, точка с запятой или запятая с союзом.",
            },
          ],
          questions: [
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "The Silk Road was not a single ______ was a network of trade routes linking China with the Mediterranean world.",
                },
              ],
              prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
              options: ["road, it", "road; it", "road it", "road and, it"],
              answer: 1,
              explanation:
                "Слева и справа — законченные предложения. Запятая между ними (A) — ошибка comma splice. Точка с запятой соединяет их правильно.",
            },
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "The field biologist's most important ______ a simple notebook in which she recorded every observation by hand.",
                },
              ],
              prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
              options: ["tool was:", "tool was,", "tool was", "tool, was"],
              answer: 2,
              explanation:
                "Между глаголом «was» и тем, что идёт дальше, знак не нужен, и между подлежащим и сказуемым тоже.",
            },
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "Marie Curie won two Nobel ______ one in physics in 1903 and one in chemistry in 1911.",
                },
              ],
              prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
              options: ["Prizes:", "Prizes;", "Prizes.", "Prizes, they were"],
              answer: 0,
              explanation:
                "Слева законченное предложение, справа — пояснение, какие именно премии. Двоеточие вводит такое пояснение. Справа нет законченного предложения, поэтому точка с запятой и точка не подходят.",
            },
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "Washington Roebling, the Brooklyn Bridge's chief engineer, fell ill during construction. His wife, Emily Warren ______ took over many of his duties and became the link between him and the workers on site.",
                },
              ],
              prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
              options: ["Roebling,", "Roebling", "Roebling;", "Roebling—"],
              answer: 0,
              explanation:
                "Имя — вставка, открытая запятой после «His wife». Её нужно закрыть тем же знаком: запятой.",
            },
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "In 1969, the Apollo 11 mission landed the first humans on the ______ only sixty-six years after the Wright brothers' first powered flight.",
                },
              ],
              prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
              options: ["Moon,", "Moon;", "Moon.", "Moon, this was"],
              answer: 0,
              explanation:
                "Часть после пропуска — не предложение, а уточнение. Её присоединяют запятой. Точка с запятой и точка оставили бы её обрывком.",
            },
          ],
        },
        {
          id: "form-structure-sense",
          title: "Form, Structure, and Sense",
          summary: "Согласование, времена, местоимения",
          minutes: 12,
          official: official("Standard English Conventions", "Form, Structure, and Sense"),
          theory: [
            {
              body:
                "Здесь проверяют грамматику: согласование подлежащего и сказуемого, местоимения, времена глаголов, причастные обороты, притяжательные формы.",
            },
            {
              heading: "Что проверять",
              body:
                "• **Найди настоящее подлежащее.** Вычеркни всё между ним и глаголом: «The collection [of coins] spans…».\n• **Each, every, one of** — единственное число.\n• **Коллективные существительные** (team, orchestra, committee) обычно в единственном числе: its, not their.\n• **Время** определяй по подсказкам: last year → прошедшее.\n• **Причастный оборот** в начале относится к подлежащему сразу после запятой: «Walking in, **Aigerim** noticed…».",
            },
          ],
          questions: [
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "The collection of ancient coins displayed in the museum's east gallery ______ more than 2,000 years of history.",
                },
              ],
              prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
              options: ["span", "spans", "are spanning", "have spanned"],
              answer: 1,
              explanation:
                "Подлежащее — collection (единственное число), а не coins. Поэтому spans.",
            },
            {
              kind: "choice",
              passages: [
                {
                  text: "When the orchestra finished ______ final piece, the audience rose to its feet.",
                },
              ],
              prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
              options: ["their", "its", "it's", "they're"],
              answer: 1,
              explanation:
                "Orchestra — одно целое, местоимение its. It's = it is, это не притяжательная форма.",
            },
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "Last summer, the research team ______ water samples from twelve lakes in northern Kazakhstan.",
                },
              ],
              prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
              options: ["collects", "will collect", "collected", "has been collecting"],
              answer: 2,
              explanation: "«Last summer» — законченное время в прошлом, поэтому Past Simple: collected.",
            },
            {
              kind: "choice",
              passages: [{ text: "Walking into the old library for the first time, ______" }],
              prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
              options: [
                "the smell of dusty paper surprised Aigerim.",
                "Aigerim was surprised by the smell of dusty paper.",
                "dusty paper's smell surprised Aigerim.",
                "it was a surprise to Aigerim to smell the dusty paper.",
              ],
              answer: 1,
              explanation:
                "Входит в библиотеку Айгерим, а не запах. Значит, сразу после запятой должно стоять «Aigerim».",
            },
            {
              kind: "choice",
              passages: [
                {
                  text:
                    "Each of the students in the robotics club ______ responsible for designing one part of the machine.",
                },
              ],
              prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
              options: ["are", "is", "were", "have been"],
              answer: 1,
              explanation: "Подлежащее — each (каждый), единственное число. «Of the students» — вставка.",
            },
          ],
        },
      ],
    },
    // Second pass: the same skills on new texts, scheduled weeks later.
    ...SAT_RW_PRACTICE,
  ],
};
