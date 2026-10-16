import type { Course, Lesson, Question } from "./types";

/**
 * Academic vocabulary: ten short sets of words that appear constantly in
 * IELTS, SAT and first-year university reading. Eight questions each.
 */

type V = [string, string[], number, string];

function set(n: number, title: string, summary: string, words: string, items: V[]): Lesson {
  return {
    id: `set-${n}`,
    title: `Лексика: ${title}`,
    summary,
    skill: "Vocabulary",
    minutes: 8,
    theory: [
      { body: `Слова этого набора: ${words}. Их не нужно зубрить списком — запоминай в сочетаниях и в контексте предложения.` },
      {
        heading: "Как работать",
        body: "• Прочитай предложение целиком и подумай, какое значение нужно.\n• Проверь, сочетается ли слово с соседними (предлоги, существительные).\n• После урока составь своё предложение с двумя новыми словами.",
      },
    ],
    questions: items.map(([prompt, options, answer, explanation]): Question => ({ kind: "choice", prompt, options, answer, explanation })),
  };
}

export const VOCAB: Course = {
  id: "vocab",
  title: "Академическая лексика",
  short: "Лексика",
  description: "Слова и сочетания, без которых не обойтись в академических текстах.",
  units: [
    {
      id: "academic",
      title: "Академическая лексика",
      subtitle: "Десять наборов по восемь заданий",
      lessons: [
        set(1, "глаголы анализа", "analyse, assess, examine, identify…", "analyse, assess, examine, identify, interpret, evaluate, investigate, demonstrate", [
          ["The report aims to ______ the causes of the decline in bee populations.", ["investigate", "invent", "involve", "insist"], 0, "Investigate the causes — исследовать причины."],
          ["Researchers must ______ whether the new method is better than the old one.", ["assess", "assist", "assume", "assign"], 0, "Assess whether — оценить, так ли это."],
          ["The results clearly ______ that the drug reduces pain.", ["demonstrate", "describe about", "discuss about", "decide"], 0, "Results demonstrate that — результаты показывают, что."],
          ["It is difficult to ______ the poem's meaning without knowing its historical context.", ["interpret", "interrupt", "intend", "introduce"], 0, "Interpret the meaning — истолковать смысл."],
          ["The first step is to ______ the main problem clearly.", ["identify", "identity", "identical", "identification"], 0, "После «to» нужен глагол: identify."],
          ["Which word is closest in meaning to “examine” in “The study examines how children learn”?", ["looks closely at", "ignores", "creates", "tests students on"], 0, "Examine — внимательно рассматривать, изучать."],
          ["Students should ______ the reliability of each source they use.", ["evaluate", "evacuate", "elevate", "eliminate"], 0, "Evaluate reliability — оценить надёжность."],
          ["The essay ______ the data in great detail.", ["analyses", "analysis", "analytical", "analyst"], 0, "Нужен глагол в 3-м лице: analyses (брит.) / analyzes (амер.)."],
        ]),
        set(2, "существительные исследования", "evidence, data, findings, hypothesis…", "evidence, data, findings, hypothesis, method, sample, variable, conclusion", [
          ["There is little ______ that the new law has reduced crime.", ["evidence", "evidences", "an evidence", "evidently"], 0, "Evidence — неисчисляемое: little evidence, без артикля и без -s."],
          ["The ______ of the study suggest that sleep improves memory.", ["findings", "foundings", "finders", "finds out"], 0, "Findings — результаты исследования."],
          ["A ______ is a proposed explanation that can be tested.", ["hypothesis", "conclusion", "sample", "variable"], 0, "Гипотеза — проверяемое объяснение."],
          ["The researchers surveyed a ______ of 500 students.", ["sample", "simple", "symbol", "single"], 0, "A sample of — выборка из."],
          ["In the experiment, temperature was the only ______ that changed.", ["variable", "valuable", "variety", "vary"], 0, "Variable — переменная."],
          ["The ______ was collected over three years.", ["data", "datas", "date", "dating"], 0, "Data уже форма множественного числа; datas — ошибка."],
          ["Which word best completes: “We used a qualitative ______ based on interviews.”", ["method", "matter", "measure of", "manner of"], 0, "A qualitative method — качественный метод."],
          ["The ______ of the essay summarises the main argument.", ["conclusion", "conclude", "conclusive", "concluding"], 0, "После «The» нужно существительное: conclusion."],
        ]),
        set(3, "осторожные формулировки", "suggest, indicate, likely, may…", "suggest, indicate, appear, tend to, likely, possibly, may, to some extent", [
          ["Which sentence is the most academically cautious?", ["The results suggest that exercise may improve mood.", "The results prove that exercise always improves mood.", "Exercise improves everyone's mood.", "Everybody knows exercise improves mood."], 0, "Академический стиль избегает категоричности: suggest, may."],
          ["Early results ______ that the treatment is effective, but more research is needed.", ["indicate", "insist", "guarantee", "deny"], 0, "Indicate — указывают; guarantee слишком категорично."],
          ["Teenagers ______ to sleep later than adults.", ["tend", "trend", "tense", "attend"], 0, "Tend to do — иметь тенденцию."],
          ["It is ______ that prices will rise next year.", ["likely", "like", "liking", "alike"], 0, "It is likely that — вероятно, что."],
          ["The policy was successful ______ some extent.", ["to", "in", "for", "at"], 0, "To some extent — в некоторой степени."],
          ["Which word weakens a claim appropriately?", ["possibly", "certainly", "undoubtedly", "definitely"], 0, "Possibly смягчает утверждение; остальные усиливают."],
          ["The two variables ______ to be related.", ["appear", "appearance", "apparent", "appeared to be"], 0, "Appear to be — по-видимому, являются."],
          ["Choose the best academic version of “This is totally true.”", ["This appears to be largely accurate.", "This is 100% right.", "This is so true.", "Obviously this is true."], 0, "Осторожная и точная формулировка."],
        ]),
        set(4, "описание изменений", "rise, decline, fluctuate, remain stable…", "rise, increase, decline, drop, fluctuate, remain stable, peak, steady", [
          ["Sales ______ sharply in December and then fell in January.", ["rose", "raised", "risen", "arose"], 0, "Rise (rose) — непереходный глагол «расти»; raise требует дополнения."],
          ["The number of visitors ______ between 2015 and 2020, going up and down each year.", ["fluctuated", "fluently", "flowed", "flattened"], 0, "Fluctuate — колебаться."],
          ["Prices remained ______ throughout the year.", ["stable", "stably", "stability", "stabilise"], 0, "Remain + прилагательное: remain stable."],
          ["Unemployment reached a ______ of 12% in 2009.", ["peak", "pick", "peek", "pack"], 0, "Reach a peak — достичь пика."],
          ["There was a ______ decline in the birth rate.", ["steady", "steadily", "stead", "steadiness"], 0, "Перед существительным — прилагательное: steady decline."],
          ["Which phrase means “fell a lot”?", ["dropped significantly", "rose slightly", "remained constant", "levelled off"], 0, "Drop significantly — значительно снизиться."],
          ["The figure ______ from 20% to 35%.", ["increased", "increased by from", "increasing", "increase of"], 0, "Increased from … to …"],
          ["Which is a noun?", ["a decline", "declined", "to decline", "declining sharply"], 0, "A decline — существительное."],
        ]),
        set(5, "связки и логика", "however, therefore, whereas, moreover…", "however, therefore, whereas, moreover, consequently, nevertheless, in contrast, furthermore", [
          ["The method is cheap. ______, it is not very accurate.", ["However", "Therefore", "Moreover", "For example"], 0, "Противопоставление — However."],
          ["The bridge was damaged. ______, it was closed to traffic.", ["Consequently", "Nevertheless", "In contrast", "Whereas"], 0, "Следствие — Consequently."],
          ["Cats are independent, ______ dogs need constant attention.", ["whereas", "moreover", "therefore", "furthermore"], 0, "Whereas соединяет два контрастных предложения."],
          ["The plan is expensive. ______, it would take ten years.", ["Furthermore", "However", "In contrast", "Nevertheless"], 0, "Добавление ещё одного недостатка — Furthermore."],
          ["He was tired; ______, he finished the essay.", ["nevertheless", "therefore", "for instance", "similarly"], 0, "Несмотря на это — nevertheless."],
          ["Which linker introduces a result?", ["therefore", "although", "whereas", "moreover"], 0, "Therefore — следовательно."],
          ["Which sentence uses “moreover” correctly?", ["The city is safe. Moreover, it has excellent schools.", "The city is safe moreover it.", "Moreover the city, safe.", "The city is moreover safe dangerous."], 0, "Moreover начинает добавляющее предложение и отделяется запятой."],
          ["Urban areas grew quickly. ______, rural areas lost population.", ["In contrast", "Therefore", "For example", "Furthermore"], 0, "Противопоставление двух тенденций."],
        ]),
        set(6, "общество и политика", "policy, community, issue, impact…", "policy, community, issue, impact, measure, authority, welfare, inequality", [
          ["The government introduced new ______ to reduce air pollution.", ["measures", "measurements", "meters", "means of"], 0, "Measures — меры."],
          ["Income ______ has grown in many countries.", ["inequality", "unequal", "inequal", "equality less"], 0, "Inequality — неравенство."],
          ["Local ______ are responsible for collecting rubbish.", ["authorities", "authors", "authorizations", "authentic"], 0, "Local authorities — местные власти."],
          ["Climate change is a global ______ that requires cooperation.", ["issue", "issued", "tissue", "issuing"], 0, "A global issue — глобальная проблема."],
          ["The new factory had a positive ______ on employment.", ["impact", "impress", "import", "impose"], 0, "Impact on — влияние на."],
          ["Which word means “the health and happiness of people”?", ["welfare", "warfare", "fare", "welcome"], 0, "Welfare — благополучие."],
          ["Education ______ should be based on evidence.", ["policy", "politics", "polite", "police"], 0, "Education policy — образовательная политика."],
          ["The project brought the local ______ together.", ["community", "commodity", "commute", "committee of"], 0, "Community — сообщество."],
        ]),
        set(7, "наука и технологии", "innovation, device, efficient, sustainable…", "innovation, device, efficient, sustainable, renewable, emission, automate, breakthrough", [
          ["Solar and wind are ______ sources of energy.", ["renewable", "removable", "renewed", "reviewable"], 0, "Renewable — возобновляемые."],
          ["The new engine is more ______: it uses less fuel for the same distance.", ["efficient", "effective in", "sufficient", "efficiency"], 0, "Efficient — эффективный (без лишних затрат)."],
          ["Factories must reduce their carbon ______.", ["emissions", "missions", "admissions", "omissions"], 0, "Carbon emissions — выбросы углерода."],
          ["The discovery of penicillin was a major ______ in medicine.", ["breakthrough", "breakdown", "breakout", "breakup"], 0, "Breakthrough — прорыв."],
          ["Many tasks in warehouses are now ______ by robots.", ["automated", "automatic", "automobile", "autonomy"], 0, "Are automated — автоматизированы (пассив)."],
          ["A ______ approach meets present needs without harming future generations.", ["sustainable", "sustained", "suspended", "sustenance"], 0, "Sustainable — устойчивый."],
          ["A smartphone is a small electronic ______.", ["device", "devise", "advice", "divide"], 0, "Device — устройство (devise — глагол «придумать»)."],
          ["The company is known for its ______: it releases new ideas every year.", ["innovation", "innovate", "innovative", "innovator of"], 0, "После «its» — существительное: innovation."],
        ]),
        set(8, "аргументы и мнения", "claim, argue, perspective, counterargument…", "claim, argue, perspective, counterargument, justify, support, challenge, assumption", [
          ["Some critics ______ that the policy is unfair.", ["argue", "argument", "arguably", "argued about"], 0, "Argue that — утверждать, что."],
          ["The writer's main ______ is that cities should ban cars.", ["claim", "clam", "clamp", "climb"], 0, "Main claim — главный тезис."],
          ["A strong essay considers more than one ______.", ["perspective", "prospective", "perspire", "prescription"], 0, "Perspective — точка зрения."],
          ["Can you ______ your opinion with evidence?", ["justify", "justice", "just", "justly"], 0, "Justify an opinion — обосновать мнение."],
          ["The new data ______ the old theory.", ["challenge", "change of", "chance", "challenger"], 0, "Challenge a theory — ставить под сомнение."],
          ["An ______ is something accepted as true without proof.", ["assumption", "assignment", "assistance", "absorption"], 0, "Assumption — допущение, предпосылка."],
          ["Which sentence introduces a counterargument?", ["Some might argue that the cost is too high.", "In conclusion, the plan is good.", "Firstly, the plan is cheap.", "For example, it is cheap."], 0, "Some might argue — вводит возражение."],
          ["The statistics ______ the writer's argument.", ["support", "supporter", "supportive", "supporting of"], 0, "Support an argument — подкреплять аргумент."],
        ]),
        set(9, "сочетания для эссе", "play a role, raise awareness, pose a threat…", "play a role, raise awareness, pose a threat, take into account, draw attention to, have access to", [
          ["Schools ______ an important role in shaping young people's values.", ["play", "make", "do", "take"], 0, "Play a role — играть роль."],
          ["The campaign aims to ______ awareness of mental health.", ["raise", "rise", "arise", "grow"], 0, "Raise awareness — повышать осведомлённость."],
          ["Plastic waste ______ a serious threat to marine life.", ["poses", "puts", "makes up", "gives"], 0, "Pose a threat — представлять угрозу."],
          ["Planners must take local needs ______ account.", ["into", "in", "on", "to"], 0, "Take into account — учитывать."],
          ["The report draws attention ______ the lack of teachers.", ["to", "on", "for", "at"], 0, "Draw attention to — обращать внимание на."],
          ["Many villages still do not have ______ to clean water.", ["access", "excess", "assess", "success"], 0, "Have access to — иметь доступ к."],
          ["Which collocation is correct?", ["make a decision", "do a decision", "take a decision of", "play a decision"], 0, "Make a decision (брит. также take a decision)."],
          ["Which collocation is correct?", ["conduct research", "make a research", "do researches", "play research"], 0, "Research — неисчисляемое; conduct research."],
        ]),
        set(10, "образование и поступление", "curriculum, tuition, scholarship, eligible…", "curriculum, tuition, scholarship, eligible, deadline, enrol, transcript, extracurricular", [
          ["The university offers a full ______ to students with excellent grades.", ["scholarship", "scholar", "schooling", "scholastic"], 0, "Full scholarship — полная стипендия."],
          ["International students pay higher ______ fees.", ["tuition", "intuition", "tradition", "nutrition"], 0, "Tuition fees — плата за обучение."],
          ["Only students under 19 are ______ for this programme.", ["eligible", "legible", "illegal", "elected"], 0, "Eligible for — имеющий право на участие."],
          ["The application ______ is 1 January.", ["deadline", "headline", "dateline", "lifeline"], 0, "Deadline — крайний срок."],
          ["Your school ______ shows all your grades.", ["transcript", "transport", "translation", "transmission"], 0, "Transcript — выписка оценок."],
          ["She plans to ______ in a medical degree next year.", ["enrol", "enroll on", "entry", "engage of"], 0, "Enrol (брит.) / enroll (амер.) in — поступить, записаться."],
          ["Robotics club and volunteering are ______ activities.", ["extracurricular", "extraordinary", "extracted", "extreme"], 0, "Extracurricular — внеучебные."],
          ["The new ______ includes more computer science.", ["curriculum", "curricular", "curriculums of", "courier"], 0, "Curriculum — учебная программа."],
        ]),
      ],
    },
  ],
};
