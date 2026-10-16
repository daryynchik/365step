import { makeText, TFNG, type FieldMeta } from "./make";

export const MEDICINE: FieldMeta = {
  id: "medicine",
  title: "Медицина и биология",
  short: "Медицина",
  intro: "Тексты о том, как устроен организм, как работают лекарства и как медицина проверяет свои выводы. Такой язык встретится в учебниках первого курса и в IELTS Reading.",
};

export const MEDICINE_TEXTS = [
  makeText(MEDICINE, 1, "How vaccines train the immune system",
    `A vaccine works by showing the immune system a harmless version or part of a germ, called an antigen, before the real infection arrives. The body responds as if it were under attack: it produces antibodies and, more importantly, memory cells that can recognise the same antigen years later. If the real pathogen appears, these memory cells allow the immune system to respond far more quickly and strongly than it could the first time.

When a large share of a population is immune, a disease has difficulty spreading from person to person. This effect, known as herd immunity, also protects people who cannot be vaccinated, such as newborn babies or patients with weakened immune systems.`,
    [
      ["What is the main purpose of a vaccine, according to the text?", ["To prepare the immune system to recognise a germ in advance", "To kill germs that are already in the body", "To replace the body's own antibodies", "To cure diseases after symptoms appear"], 0, "Вакцина «показывает» иммунитету безопасную часть микроба заранее, чтобы при настоящей инфекции он узнал её быстрее."],
      ["According to the text, which part of the response is described as “more important”?", ["Memory cells", "Antibodies", "Antigens", "Symptoms"], 0, "«produces antibodies and, more importantly, memory cells»."],
      ["The word “pathogen” in the first paragraph is closest in meaning to", ["a germ that causes disease", "a type of medicine", "a blood cell", "a hospital test"], 0, "Pathogen — болезнетворный микроорганизм; в тексте он противопоставлен безопасному антигену."],
      ["Herd immunity helps people who", ["cannot be vaccinated themselves", "have already recovered from the disease", "work in hospitals", "refuse all medicine"], 0, "«also protects people who cannot be vaccinated, such as newborn babies…»."],
      ["True, False or Not Given: Memory cells disappear from the body within a few weeks.", TFNG, 1, "Текст говорит обратное: memory cells «can recognise the same antigen years later»."],
    ]),

  makeText(MEDICINE, 2, "Antibiotics and resistance",
    `Antibiotics are medicines that kill bacteria or stop them from multiplying. They have saved millions of lives since penicillin came into wide use in the 1940s. However, antibiotics have no effect on viruses, which cause illnesses such as the common cold and influenza.

Every time antibiotics are used, bacteria that happen to be slightly resistant are more likely to survive and pass on their resistance. Over many generations, this process of selection can produce bacteria that common antibiotics can no longer treat. Unnecessary prescriptions, unfinished courses of treatment and the routine use of antibiotics in farm animals all speed up the process. Many health organisations now describe antibiotic resistance as one of the most serious threats to modern medicine.`,
    [
      ["Why are antibiotics not useful against the common cold?", ["The cold is caused by a virus", "The cold is not dangerous", "Antibiotics are too expensive", "The cold bacteria are always resistant"], 0, "«antibiotics have no effect on viruses, which cause illnesses such as the common cold»."],
      ["How does resistance develop, according to the text?", ["Slightly resistant bacteria survive and pass on their resistance", "Patients become allergic to antibiotics", "Antibiotics lose strength when stored", "Viruses turn into bacteria"], 0, "Это естественный отбор: выживают устойчивые бактерии и передают устойчивость дальше."],
      ["Which of these is NOT mentioned as speeding up resistance?", ["Washing hands too rarely", "Unnecessary prescriptions", "Unfinished courses of treatment", "Use of antibiotics in farm animals"], 0, "Мытьё рук в тексте не упоминается. Три остальных фактора названы прямо."],
      ["The word “routine” in the text is closest in meaning to", ["regular", "unusual", "dangerous", "illegal"], 0, "Routine use — регулярное, привычное использование."],
      ["True, False or Not Given: Penicillin was the most expensive medicine of the 1940s.", TFNG, 2, "О цене пенициллина в тексте ничего не сказано."],
    ]),

  makeText(MEDICINE, 3, "The heart as a double pump",
    `The human heart has four chambers: two upper atria and two lower ventricles. It works as two pumps side by side. The right side receives blood that has delivered its oxygen to the body and pumps it to the lungs, where it picks up fresh oxygen and releases carbon dioxide. The left side receives this oxygen-rich blood from the lungs and pumps it out to the rest of the body.

The left ventricle has the thickest muscular wall of the four chambers, because it must push blood through the whole body rather than only to the nearby lungs. Valves between the chambers open and close with each beat, making sure that blood flows in only one direction. The familiar “lub-dub” sound of a heartbeat is the sound of these valves closing.`,
    [
      ["Where does the right side of the heart pump blood?", ["To the lungs", "To the brain", "To the whole body", "To the left atrium directly"], 0, "«The right side… pumps it to the lungs»."],
      ["Why is the wall of the left ventricle the thickest?", ["It pumps blood through the whole body", "It holds the most blood", "It receives blood from the lungs", "It contains the valves"], 0, "Левый желудочек толкает кровь по всему телу, а не только в близкие лёгкие."],
      ["What is the function of the valves?", ["To keep blood flowing in one direction", "To add oxygen to the blood", "To slow the heartbeat", "To filter waste from the blood"], 0, "«making sure that blood flows in only one direction»."],
      ["The “lub-dub” sound is caused by", ["valves closing", "blood entering the lungs", "the heart muscle relaxing", "air in the chambers"], 0, "Последнее предложение: звук — это закрытие клапанов."],
      ["True, False or Not Given: Blood leaving the left side of the heart is rich in oxygen.", TFNG, 0, "Левая сторона получает из лёгких «oxygen-rich blood» и отправляет её в тело."],
    ]),

  makeText(MEDICINE, 4, "Why we need sleep",
    `For a long time, sleep was seen simply as rest. Research over recent decades suggests that it is far more active. During sleep, the brain appears to strengthen important memories formed during the day, a process known as consolidation. Studies in animals have also suggested that the brain clears away certain waste products more efficiently during sleep than during waking hours.

The effects of losing sleep appear quickly. After a single night with little sleep, people typically show slower reactions, weaker attention and poorer judgement. Over longer periods, chronic sleep shortage has been linked to a higher risk of several health problems. Sleep researchers therefore warn that regularly sacrificing sleep to study more may be counterproductive.`,
    [
      ["What is the main idea of the text?", ["Sleep is an active process that is important for the brain and health", "Sleep is only a way for the body to rest", "Animals need more sleep than humans", "Students should study at night"], 0, "Текст спорит со старым взглядом «сон — просто отдых» и показывает его активные функции."],
      ["The word “consolidation” refers to", ["strengthening memories", "falling asleep", "clearing waste", "dreaming"], 0, "«strengthen important memories… a process known as consolidation»."],
      ["According to the text, which effect can appear after just one short night?", ["Slower reactions", "A higher risk of chronic illness", "Permanent memory loss", "Weight gain"], 0, "После одной ночи — медленнее реакция, хуже внимание. Риски для здоровья связаны с хроническим недосыпом."],
      ["The word “counterproductive” suggests that sacrificing sleep to study", ["may make learning worse rather than better", "is always necessary before exams", "has no effect at all", "is recommended by researchers"], 0, "Counterproductive — дающий обратный результат."],
      ["True, False or Not Given: The waste-clearing effect of sleep has been proven in humans beyond doubt.", TFNG, 1, "Текст осторожен: это показано «in animals» и «have suggested», а не доказано у людей без сомнений."],
    ]),

  makeText(MEDICINE, 5, "The placebo effect",
    `A placebo is a treatment with no active ingredient, such as a sugar pill. Surprisingly, patients who receive placebos often report real improvements, especially in symptoms such as pain or nausea. Researchers believe that expectation plays a large role: if people believe a treatment will help, their brains can change how they experience symptoms.

Because of this effect, new medicines are tested against placebos rather than against no treatment at all. In a double-blind trial, neither the patients nor the doctors know who receives the real drug and who receives the placebo. This prevents the expectations of either group from influencing the results. A drug is considered effective only if it performs clearly better than the placebo.`,
    [
      ["What is a placebo?", ["A treatment without an active ingredient", "A very strong medicine", "A type of vaccine", "A surgical procedure"], 0, "«a treatment with no active ingredient, such as a sugar pill»."],
      ["According to researchers, what largely explains the placebo effect?", ["Patients' expectations", "Hidden chemicals in sugar", "The doctor's experience", "The price of the pill"], 0, "«expectation plays a large role»."],
      ["In a double-blind trial, who knows which patients receive the real drug?", ["Neither the patients nor the doctors", "Only the patients", "Only the doctors", "Everyone involved"], 0, "Именно поэтому испытание называется «двойным слепым»."],
      ["Why are new medicines compared with placebos?", ["To separate the drug's real effect from the effect of expectation", "Because placebos are cheaper to produce", "Because patients prefer placebos", "To make trials shorter"], 0, "Лекарство считается эффективным, только если оно заметно лучше плацебо."],
      ["True, False or Not Given: Placebos work equally well for every kind of illness.", TFNG, 1, "Текст говорит, что улучшения заметнее «especially in symptoms such as pain or nausea», то есть не одинаково для всего."],
    ]),

  makeText(MEDICINE, 6, "Genes and DNA",
    `DNA is the molecule that carries genetic instructions in almost all living things. Its structure, a double helix, was described in 1953 by James Watson and Francis Crick, using X-ray images produced by Rosalind Franklin. DNA is made of four chemical bases, and the order of these bases forms a code.

A gene is a section of DNA that usually contains the instructions for making a particular protein. Proteins do most of the work in cells: they build structures, carry signals and speed up chemical reactions. A change in the sequence of bases is called a mutation. Many mutations have no noticeable effect, some are harmful, and a few may even be useful, which is one reason species can change over time.`,
    [
      ["When was the double-helix structure of DNA described?", ["1953", "1903", "1973", "1993"], 0, "«was described in 1953 by James Watson and Francis Crick»."],
      ["What was Rosalind Franklin's contribution, according to the text?", ["She produced X-ray images that were used", "She discovered proteins", "She named the four bases", "She first described mutations"], 0, "«using X-ray images produced by Rosalind Franklin»."],
      ["What does a gene usually contain?", ["Instructions for making a protein", "A complete cell", "Only one chemical base", "Energy for the cell"], 0, "«contains the instructions for making a particular protein»."],
      ["Which statement about mutations matches the text?", ["Their effects range from none to harmful to useful", "They are always harmful", "They never affect proteins", "They only happen in animals"], 0, "Текст называет все три варианта: без эффекта, вредные и иногда полезные."],
      ["True, False or Not Given: All proteins in the body are made in the brain.", TFNG, 2, "О месте синтеза белков в тексте ничего нет."],
    ]),

  makeText(MEDICINE, 7, "Type 2 diabetes",
    `Insulin is a hormone that helps cells take in glucose, the sugar that the body uses for energy. In type 2 diabetes, the body's cells respond poorly to insulin, a condition called insulin resistance, and over time the pancreas may also produce less insulin. As a result, glucose builds up in the blood.

High blood glucose over many years can damage blood vessels, nerves, eyes and kidneys. Risk factors include family history, age, excess body weight and physical inactivity. Unlike type 1 diabetes, which usually appears early in life and cannot currently be prevented, type 2 diabetes can often be delayed or prevented through regular physical activity, a balanced diet and maintaining a healthy weight.`,
    [
      ["What is the role of insulin?", ["It helps cells take in glucose", "It destroys glucose in the blood", "It produces energy in the pancreas", "It carries oxygen"], 0, "«a hormone that helps cells take in glucose»."],
      ["What is insulin resistance?", ["Cells responding poorly to insulin", "The pancreas producing too much insulin", "An allergy to sugar", "A type of kidney disease"], 0, "Определение дано прямо в тексте."],
      ["Which is NOT listed as a risk factor?", ["Drinking too much water", "Family history", "Age", "Physical inactivity"], 0, "Вода в списке факторов риска не упоминается."],
      ["How does type 1 differ from type 2, according to the text?", ["Type 1 cannot currently be prevented", "Type 1 is caused by inactivity", "Type 1 appears only in old age", "Type 1 can be cured with diet"], 0, "«type 1… usually appears early in life and cannot currently be prevented»."],
      ["True, False or Not Given: Type 2 diabetes can often be delayed through lifestyle changes.", TFNG, 0, "«can often be delayed or prevented through regular physical activity, a balanced diet…»."],
    ]),

  makeText(MEDICINE, 8, "Phases of a clinical trial",
    `Before a new medicine reaches patients, it must pass through several stages of testing in humans. Phase I trials involve a small number of people, often healthy volunteers, and focus mainly on safety and on how the body processes the drug. Phase II trials give the drug to a larger group of patients with the condition, to see whether it works and to find a suitable dose.

Phase III trials are much larger, sometimes involving thousands of patients in many hospitals. They compare the new drug with the best existing treatment or with a placebo. Only after successful phase III results does a regulatory agency usually consider approving the medicine. Many drugs fail along the way, often because they are not effective enough or because their side effects outweigh their benefits.`,
    [
      ["What is the main focus of phase I trials?", ["Safety and how the body processes the drug", "Comparing the drug with other treatments", "Finding thousands of patients", "Marketing the drug"], 0, "«focus mainly on safety and on how the body processes the drug»."],
      ["In which phase is a suitable dose mainly found?", ["Phase II", "Phase I", "Phase III", "After approval"], 0, "Phase II: «to see whether it works and to find a suitable dose»."],
      ["What makes phase III different from earlier phases?", ["It is much larger and compares the drug with existing options", "It uses only healthy volunteers", "It takes place before phase I", "It does not involve patients"], 0, "Фаза III — тысячи пациентов и сравнение с лучшим лечением или плацебо."],
      ["The phrase “outweigh their benefits” means the side effects", ["are more important than the advantages", "are less serious than expected", "make the drug cheaper", "disappear over time"], 0, "Outweigh — перевешивать."],
      ["True, False or Not Given: Most drugs that enter phase I are eventually approved.", TFNG, 1, "Текст говорит обратное: «Many drugs fail along the way»."],
    ]),

  makeText(MEDICINE, 9, "The gut microbiome",
    `The human digestive system is home to trillions of microorganisms, mostly bacteria, known together as the gut microbiome. Far from being simply passengers, many of these microbes help to break down fibre that human enzymes cannot digest, producing substances that the body can use.

The microbiome also appears to train and regulate the immune system. The mix of species differs from person to person and is shaped by diet, environment and medicines. Courses of antibiotics, for example, can reduce the variety of gut bacteria for weeks or months. Scientists are now studying links between the microbiome and conditions ranging from allergies to mood, although many of these links are not yet fully understood.`,
    [
      ["What does the phrase “far from being simply passengers” suggest about gut microbes?", ["They play an active, useful role", "They travel through the body quickly", "They are harmful to humans", "They do not affect digestion"], 0, "Мысль автора: микробы не «попутчики», а активные участники пищеварения."],
      ["What can gut bacteria do that human enzymes cannot?", ["Break down certain fibre", "Produce oxygen", "Build bones", "Make insulin"], 0, "«help to break down fibre that human enzymes cannot digest»."],
      ["Which factor is mentioned as shaping the microbiome?", ["Medicines", "Height", "Blood type", "Eye colour"], 0, "«shaped by diet, environment and medicines»."],
      ["What does the text say about links between the microbiome and mood?", ["They are being studied but not fully understood", "They have been fully proven", "They do not exist", "They only affect children"], 0, "«many of these links are not yet fully understood»."],
      ["True, False or Not Given: Antibiotics can reduce the variety of gut bacteria.", TFNG, 0, "«Courses of antibiotics… can reduce the variety of gut bacteria for weeks or months»."],
    ]),

  makeText(MEDICINE, 10, "A doctor who asked colleagues to wash their hands",
    `In 1847, the Hungarian doctor Ignaz Semmelweis was working at Vienna General Hospital, where many women died of a fever after giving birth. He noticed that deaths were far more common in the ward run by doctors and medical students than in the ward run by midwives. The doctors often came directly from performing autopsies.

Semmelweis concluded that something from the bodies was being carried on the doctors' hands. When he required them to wash their hands in a chlorinated lime solution, deaths fell sharply. Yet many of his colleagues rejected his ideas, partly because he could not explain the mechanism. Only later in the century, when scientists showed that germs cause disease, was his practice widely accepted.`,
    [
      ["What did Semmelweis notice about the two wards?", ["Deaths were more common in the doctors' ward", "Midwives worked longer hours", "Both wards had the same death rate", "The midwives' ward was more crowded"], 0, "Смертность была выше в отделении врачей и студентов."],
      ["What did Semmelweis require doctors to do?", ["Wash their hands in a chlorinated lime solution", "Stop performing autopsies", "Work only with midwives", "Use new surgical tools"], 0, "Мытьё рук хлорной известью — его главная мера."],
      ["Why did many colleagues reject his ideas, according to the text?", ["He could not explain how the disease was carried", "His results showed no improvement", "He was not a qualified doctor", "Handwashing was too expensive"], 0, "«partly because he could not explain the mechanism»."],
      ["The word “sharply” in the text is closest in meaning to", ["quickly and by a large amount", "slightly", "painfully", "slowly"], 0, "Fell sharply — резко снизилась."],
      ["What does the final sentence suggest?", ["Germ theory helped his idea to be accepted", "His idea was never accepted", "Midwives discovered germs", "Handwashing became illegal"], 0, "Практику приняли, когда учёные показали, что болезни вызывают микробы."],
    ]),
];
