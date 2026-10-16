import { makeText, TFNG, type FieldMeta } from "./make";

export const SOCIAL: FieldMeta = {
  id: "social",
  title: "Социальные и гуманитарные науки",
  short: "Гуманитарные",
  intro: "Тексты по психологии, истории, праву и обществу. Здесь особенно важно отличать факты от интерпретаций и замечать, насколько осторожно автор формулирует выводы.",
};

export const SOCIAL_TEXTS = [
  makeText(SOCIAL, 1, "Confirmation bias",
    `People tend to notice, remember and trust information that supports what they already believe, while overlooking evidence against it. Psychologists call this confirmation bias. It affects everyone, including experts, and it often operates without our being aware of it.

In one classic type of experiment, participants are given a rule to test and tend to look only for cases that would confirm it, rather than cases that could prove it wrong. Scientists try to protect themselves against this bias by deciding in advance what result would count against their hypothesis, and by asking others to review their work. In everyday life, actively searching for the strongest argument on the other side is a useful habit.`,
    [
      ["What is confirmation bias?", ["Favouring information that supports existing beliefs", "Forgetting all information", "Trusting experts too much", "Changing beliefs too often"], 0, "Определение в первом абзаце."],
      ["According to the text, who is affected by confirmation bias?", ["Everyone, including experts", "Only children", "Only people without education", "Only scientists"], 0, "«It affects everyone, including experts»."],
      ["In the experiments described, participants tend to", ["look only for cases that would confirm the rule", "look for cases that could disprove the rule", "refuse to test the rule", "ask others for help"], 0, "Второй абзац."],
      ["How do scientists try to protect themselves against this bias?", ["By deciding in advance what result would count against their hypothesis", "By avoiding experiments", "By working alone", "By ignoring reviews"], 0, "Предрегистрация критерия и рецензирование."],
      ["True, False or Not Given: Confirmation bias always operates consciously.", TFNG, 1, "«often operates without our being aware of it»."],
    ]),

  makeText(SOCIAL, 2, "Primary and secondary sources",
    `Historians distinguish between primary and secondary sources. A primary source comes from the time being studied: a letter, a diary, a government record, a photograph or an object. A secondary source is written later by someone interpreting primary sources, such as a history textbook or an academic article.

Primary sources bring us close to events, but they are not automatically reliable. A diary records one person's view; an official report may reflect what its authors wanted others to believe. Historians therefore ask who created a source, when, for what purpose and for what audience. Comparing several independent sources is the best way to build a trustworthy picture of the past.`,
    [
      ["Which is a primary source?", ["A diary written during the events", "A modern textbook", "An encyclopedia article", "A documentary made decades later"], 0, "Первичный источник создан в изучаемое время."],
      ["What is a secondary source?", ["A later work interpreting primary sources", "A source from the time being studied", "An object from the past", "A government record"], 0, "Определение в первом абзаце."],
      ["What does the text say about primary sources?", ["They are close to events but not automatically reliable", "They are always reliable", "They are less useful than textbooks", "They should be ignored"], 0, "Второй абзац."],
      ["Which question do historians ask about a source?", ["For what purpose was it created?", "How long is it?", "Is it written in English?", "How expensive was it?"], 0, "Кто, когда, с какой целью и для кого."],
      ["What is the best way to build a trustworthy picture of the past, according to the text?", ["Comparing several independent sources", "Reading one long book", "Trusting official reports", "Relying on memory"], 0, "Последнее предложение."],
    ]),

  makeText(SOCIAL, 3, "A world of cities",
    `For most of human history, the great majority of people lived in the countryside. According to the United Nations, more than half of the world's population now lives in urban areas, and that share is expected to keep growing in the coming decades.

People move to cities mainly for work, education and services. Cities can be efficient: they allow many people to share transport, hospitals and universities, and they encourage the exchange of ideas. But rapid growth can also bring problems, such as housing shortages, traffic congestion and air pollution, especially when infrastructure is built more slowly than the population grows.`,
    [
      ["According to the United Nations, what share of people now live in urban areas?", ["More than half", "About a quarter", "Almost everyone", "Less than ten per cent"], 0, "«more than half of the world's population now lives in urban areas»."],
      ["Why do people mainly move to cities?", ["For work, education and services", "To find cheaper housing", "To escape pollution", "To grow food"], 0, "Второй абзац."],
      ["Which is given as an advantage of cities?", ["Many people can share transport, hospitals and universities", "They have less traffic", "They have no pollution", "Housing is always cheap"], 0, "Эффективность за счёт общих услуг."],
      ["When are problems especially likely, according to the text?", ["When infrastructure grows more slowly than the population", "When cities are small", "When people leave cities", "When universities open"], 0, "Последнее предложение."],
      ["True, False or Not Given: The share of people living in cities is expected to fall.", TFNG, 1, "Ожидается рост: «expected to keep growing»."],
    ]),

  makeText(SOCIAL, 4, "Learning a language in childhood",
    `Children who grow up hearing two languages usually learn both without formal lessons, and young learners often develop a more native-like accent than people who start as adults. Some researchers have proposed a “critical period” for language learning, after which acquiring a language to native level becomes much harder.

The evidence is more complicated than the popular idea suggests. Adults often learn grammar and vocabulary faster than children at first, especially in classroom settings. What changes with age seems to be the chance of reaching a fully native level, particularly in pronunciation. For most practical purposes, motivation, the amount of practice and exposure to real communication matter at any age.`,
    [
      ["What do young learners often develop, according to the text?", ["A more native-like accent", "Faster grammar learning than adults", "Less interest in languages", "A larger vocabulary than adults at first"], 0, "Первый абзац."],
      ["What is the “critical period”?", ["A proposed time after which native-level learning becomes much harder", "The first year of school", "An exam period", "A period of illness"], 0, "Определение в первом абзаце."],
      ["What does the text say about adults?", ["They often learn grammar and vocabulary faster at first", "They cannot learn new languages", "They always reach native level", "They learn only pronunciation"], 0, "Второй абзац."],
      ["The writer's view of the popular idea is that", ["the evidence is more complicated", "it is completely correct", "it is completely false", "it applies only to adults"], 0, "«more complicated than the popular idea suggests»."],
      ["True, False or Not Given: Motivation matters only for children.", TFNG, 1, "«matter at any age»."],
    ]),

  makeText(SOCIAL, 5, "The rule of law",
    `The rule of law is the principle that everyone, including the people who govern, is subject to the same laws, and that those laws are public, applied equally and enforced by independent courts. It stands in contrast to rule by the arbitrary will of powerful individuals.

Scholars usually identify several elements: laws must be clear and known in advance, so people can plan their lives; they must apply to officials as well as citizens; and disputes must be decided by impartial judges following fair procedures. Many economists argue that the rule of law also supports prosperity, because people invest and trade more readily when they trust that contracts and property will be protected.`,
    [
      ["What is the rule of law?", ["The principle that everyone, including rulers, is subject to the same laws", "A law about elections", "The power of the strongest person", "A list of crimes"], 0, "Определение в первом предложении."],
      ["Why must laws be known in advance?", ["So people can plan their lives", "So judges can change them", "So they can be kept secret", "So officials are exempt"], 0, "Второй абзац."],
      ["What does “impartial” mean in this context?", ["Not favouring either side", "Very strict", "Highly paid", "Elected by the people"], 0, "Беспристрастный судья не на стороне ни одной из сторон."],
      ["Why might the rule of law support prosperity?", ["People invest and trade more when contracts and property are protected", "It lowers taxes", "It increases the number of laws", "It reduces the number of courts"], 0, "Последнее предложение."],
      ["The rule of law is contrasted with", ["rule by the arbitrary will of powerful individuals", "democracy", "economic growth", "international trade"], 0, "Конец первого абзаца."],
    ]),

  makeText(SOCIAL, 6, "Does social media divide us?",
    `It is widely claimed that social media pushes people into “echo chambers”, where they see only views that match their own and grow more extreme. The evidence for this is mixed. Some studies find that algorithms can promote emotionally charged content, which may reward outrage.

Other research suggests that many users actually encounter a wider range of opinions online than in their offline lives, and that political division in some countries began rising before social media became widespread. Researchers therefore caution against simple explanations. Social media may intensify existing divisions in some contexts without being their main cause, and its effects probably differ between platforms, countries and groups of users.`,
    [
      ["What is the main point of the text?", ["The evidence about social media and division is mixed", "Social media is the main cause of division", "Social media has no effects", "Echo chambers do not exist anywhere"], 0, "Текст показывает разные данные и предостерегает от простых объяснений."],
      ["What do some studies find about algorithms?", ["They can promote emotionally charged content", "They show only neutral content", "They reduce outrage", "They are never used"], 0, "Первый абзац."],
      ["Which finding challenges the echo-chamber idea?", ["Many users encounter a wider range of opinions online", "Algorithms reward outrage", "People prefer their own views", "Social media is popular"], 0, "Второй абзац."],
      ["Why is the timing of rising division mentioned?", ["It began in some countries before social media was widespread", "It proves social media caused it", "It shows division has ended", "It explains algorithms"], 0, "Это аргумент против простой причинной связи."],
      ["The word “intensify” is closest in meaning to", ["make stronger", "create from nothing", "reduce", "measure"], 0, "Intensify — усиливать."],
    ]),

  makeText(SOCIAL, 7, "Al-Farabi, the “Second Teacher”",
    `Abu Nasr al-Farabi was born around 870 in the region of Farab, near the city of Otrar on the Syr Darya river, in what is now southern Kazakhstan. He later lived and worked in Baghdad and died in Damascus in about 950.

Al-Farabi wrote on logic, music, politics and philosophy, and he worked to explain and connect the ideas of Plato and Aristotle. His commentaries were so influential that he became known as the “Second Teacher”, with Aristotle regarded as the first. In his political writings he described an ideal city whose citizens cooperate to achieve happiness under wise leadership. Today Kazakhstan's leading national university bears his name.`,
    [
      ["Where was al-Farabi born, according to the text?", ["In the region of Farab, near Otrar", "In Baghdad", "In Damascus", "In Athens"], 0, "Первое предложение."],
      ["Why was he called the “Second Teacher”?", ["His commentaries on Aristotle and others were very influential", "He was the second son in his family", "He taught at a second university", "He wrote only two books"], 0, "Первым учителем считался Аристотель."],
      ["Which subject is NOT mentioned among his writings?", ["Medicine", "Logic", "Music", "Politics"], 0, "В тексте перечислены логика, музыка, политика и философия."],
      ["What did his political writings describe?", ["An ideal city whose citizens cooperate to achieve happiness", "A plan for war", "A system of taxes", "The history of Otrar"], 0, "Второй абзац."],
      ["True, False or Not Given: Al-Farabi died in Damascus.", TFNG, 0, "«died in Damascus in about 950»."],
    ]),

  makeText(SOCIAL, 8, "How memory reconstructs the past",
    `We often imagine memory as a video recording that we can replay. Psychological research suggests that remembering is closer to rebuilding: each time we recall an event, we reconstruct it from fragments, and the memory can change in the process.

In well-known experiments by the psychologist Elizabeth Loftus, participants watched a film of a car accident. Those later asked how fast the cars were going when they “smashed” into each other gave higher speed estimates than those asked about cars that “hit” each other, and some even remembered broken glass that was not in the film. Such findings have made courts more cautious about relying on eyewitness testimony alone.`,
    [
      ["What does research suggest memory is like?", ["Rebuilding an event from fragments", "A perfect video recording", "A photograph that never changes", "A list of facts"], 0, "Первый абзац."],
      ["In Loftus's experiments, what affected speed estimates?", ["The verb used in the question", "The colour of the cars", "The length of the film", "The age of participants"], 0, "«smashed» против «hit»."],
      ["What did some participants falsely remember?", ["Broken glass", "A second car", "A police officer", "Rain"], 0, "«remembered broken glass that was not in the film»."],
      ["What has been one consequence of such findings?", ["Courts are more cautious about relying on eyewitness testimony alone", "Courts stopped using witnesses", "Films are no longer used in research", "Memory cannot be studied"], 0, "Последнее предложение."],
      ["True, False or Not Given: Every participant in Loftus's experiments remembered broken glass.", TFNG, 1, "«some even remembered» — не все."],
    ]),

  makeText(SOCIAL, 9, "Direct and representative democracy",
    `In a direct democracy, citizens vote on laws and decisions themselves. Ancient Athens is the most famous example, although only adult male citizens could take part, excluding women, slaves and foreigners. In a representative democracy, citizens elect officials who make decisions on their behalf.

Most modern democracies are representative, largely because it is impractical for millions of people to debate every law. Some, however, include elements of direct democracy. Switzerland, for example, regularly holds national referendums in which citizens vote directly on specific proposals. Supporters of referendums praise them for giving citizens a direct voice; critics argue that complex issues are hard to reduce to a simple yes-or-no question.`,
    [
      ["What happens in a direct democracy?", ["Citizens vote on laws themselves", "Citizens elect representatives", "A king makes all decisions", "Judges make laws"], 0, "Определение в первом предложении."],
      ["Who could take part in Athenian democracy?", ["Only adult male citizens", "All residents", "Women and slaves", "Foreigners"], 0, "Первый абзац."],
      ["Why are most modern democracies representative?", ["It is impractical for millions to debate every law", "Citizens do not want to vote", "It is required by international law", "Referendums are illegal"], 0, "Второй абзац."],
      ["What example of direct democracy today is given?", ["National referendums in Switzerland", "Elections in Athens", "Parliament in every country", "Courts"], 0, "Швейцарские референдумы."],
      ["What is the critics' argument about referendums?", ["Complex issues are hard to reduce to yes or no", "They are too expensive", "Citizens never vote", "They give too little voice to citizens"], 0, "Последнее предложение."],
    ]),

  makeText(SOCIAL, 10, "Protecting world heritage",
    `UNESCO's World Heritage List recognises places considered to be of outstanding value to humanity, from natural wonders to historic cities. Inclusion on the list can bring international attention, tourism and support for conservation, but it also obliges countries to protect these sites.

Kazakhstan's sites include the Mausoleum of Khoja Ahmed Yasawi in Turkistan, inscribed in 2003. Built in the late fourteenth century on the orders of Timur, it is admired for its scale and its tilework, and it was left partly unfinished. Heritage experts point out that popularity can create its own problems: large numbers of visitors and new construction nearby can damage the very features that made a site worth protecting.`,
    [
      ["What does the World Heritage List recognise?", ["Places of outstanding value to humanity", "The most visited cities", "Places with the best hotels", "Only natural parks"], 0, "Первое предложение."],
      ["What obligation comes with inclusion on the list?", ["Countries must protect the sites", "Countries must build new hotels", "Sites must be closed to visitors", "Countries must pay UNESCO"], 0, "«obliges countries to protect these sites»."],
      ["When was the Mausoleum of Khoja Ahmed Yasawi inscribed?", ["2003", "1399", "1990", "2013"], 0, "«inscribed in 2003»."],
      ["Who ordered the mausoleum to be built?", ["Timur", "UNESCO", "Khoja Ahmed Yasawi himself", "The text does not say"], 0, "«on the orders of Timur»."],
      ["What problem can popularity create?", ["Visitors and nearby construction can damage the site", "The site may be removed from the list", "Tourism always ends", "The tilework becomes too bright"], 0, "Последнее предложение."],
    ]),
];
