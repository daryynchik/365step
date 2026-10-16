import { makeText, TFNG, type FieldMeta } from "./make";

export const BUSINESS: FieldMeta = {
  id: "business",
  title: "Бизнес и экономика",
  short: "Экономика",
  intro: "Тексты о рынках, деньгах, решениях и компаниях. Обрати внимание на причинно-следственные связи и на то, где автор описывает факт, а где — модель или предположение.",
};

export const BUSINESS_TEXTS = [
  makeText(BUSINESS, 1, "Supply and demand",
    `In a market, the price of a good is shaped by two forces. Demand describes how much of a product buyers want at each price; usually, people buy less when the price rises. Supply describes how much sellers are willing to offer at each price; usually, they offer more when the price rises.

The price at which the amount demanded equals the amount supplied is called the equilibrium price. If the price is above this level, unsold goods pile up and sellers tend to cut prices. If it is below, shortages appear and prices tend to rise. When something changes, such as a poor harvest that reduces the supply of wheat, the equilibrium shifts and a new price is reached.`,
    [
      ["What usually happens to demand when the price rises?", ["People buy less", "People buy more", "Nothing changes", "Sellers stop selling"], 0, "«usually, people buy less when the price rises»."],
      ["What is the equilibrium price?", ["The price at which the amount demanded equals the amount supplied", "The highest possible price", "The price set by the government", "The cost of production"], 0, "Определение во втором абзаце."],
      ["What tends to happen if the price is above equilibrium?", ["Unsold goods pile up and prices tend to fall", "Shortages appear", "Demand rises sharply", "Supply disappears"], 0, "Излишки товара заставляют продавцов снижать цены."],
      ["A poor harvest is given as an example of", ["a change that shifts the equilibrium", "a rise in demand", "a government policy", "a stable market"], 0, "Неурожай сокращает предложение и сдвигает равновесие."],
      ["True, False or Not Given: Shortages tend to push prices up.", TFNG, 0, "«If it is below, shortages appear and prices tend to rise»."],
    ]),

  makeText(BUSINESS, 2, "Inflation and interest rates",
    `Inflation is a general rise in prices across an economy, which means that the same amount of money buys fewer goods over time. A small, steady rate of inflation is generally considered normal, and many central banks aim to keep it at around two per cent a year.

When inflation rises too quickly, a central bank may raise interest rates. Higher rates make borrowing more expensive and saving more attractive, so households and firms tend to spend less. Lower spending eases the pressure on prices. The tool has costs, however: higher interest rates can slow economic growth and increase unemployment, so central banks must balance controlling prices against supporting jobs.`,
    [
      ["What is inflation?", ["A general rise in prices", "A fall in unemployment", "An increase in interest rates", "A rise in the value of money"], 0, "Определение в первом предложении."],
      ["What target do many central banks aim for?", ["Around two per cent a year", "Zero per cent", "Ten per cent", "No target at all"], 0, "«around two per cent a year»."],
      ["How do higher interest rates reduce inflation?", ["They encourage people to spend less", "They print more money", "They raise prices directly", "They reduce saving"], 0, "Дороже кредиты, выгоднее сбережения — расходы падают."],
      ["What is one cost of raising interest rates?", ["It can increase unemployment", "It always causes inflation", "It makes saving less attractive", "It lowers all prices immediately"], 0, "Конец текста."],
      ["True, False or Not Given: Any amount of inflation is considered harmful.", TFNG, 1, "Небольшая стабильная инфляция считается нормальной."],
    ]),

  makeText(BUSINESS, 3, "Opportunity cost",
    `Every choice involves giving something up. Economists call the value of the best alternative you did not choose the opportunity cost. If you spend an evening working a part-time job instead of studying, the opportunity cost is not only the money you might have spent but also the learning you gave up.

The idea applies to businesses and governments too. A company that uses its factory to make bicycles cannot use the same factory at the same time to make scooters. A government that spends more on roads may have less to spend on schools. Thinking in terms of opportunity cost helps decision-makers see hidden costs that do not appear on a price tag.`,
    [
      ["What is opportunity cost?", ["The value of the best alternative not chosen", "The price written on a product", "The total cost of a factory", "A tax on choices"], 0, "Определение в первом абзаце."],
      ["In the example of the part-time job, what is the opportunity cost?", ["The learning given up", "The salary earned", "The cost of transport", "The price of books"], 0, "Упущенная выгода — несостоявшаяся учёба."],
      ["What does the bicycle factory example show?", ["Resources used for one thing cannot be used for another at the same time", "Scooters are more profitable", "Factories should make only one product", "Bicycles are cheap"], 0, "Ресурс ограничен: либо одно, либо другое."],
      ["The phrase “hidden costs that do not appear on a price tag” refers to", ["opportunity costs", "taxes", "discounts", "transport costs"], 0, "Основная мысль текста."],
      ["True, False or Not Given: Opportunity cost applies only to individuals.", TFNG, 1, "«The idea applies to businesses and governments too»."],
    ]),

  makeText(BUSINESS, 4, "The minimum viable product",
    `Many new businesses fail not because their products are badly made, but because nobody wants them. To reduce this risk, many startups begin with a minimum viable product, or MVP: the simplest version of a product that real customers can use.

Instead of spending years perfecting a design in secret, the team releases the MVP early, watches how people use it and collects feedback. They then improve the product in short cycles, adding features customers actually need and dropping those they ignore. This approach does not guarantee success, but it helps founders discover early, and cheaply, whether their idea solves a real problem.`,
    [
      ["According to the text, why do many new businesses fail?", ["Nobody wants their products", "Their products are badly made", "They release products too early", "They have too many customers"], 0, "Первое предложение."],
      ["What is an MVP?", ["The simplest version of a product that customers can use", "The final, perfect version", "The most expensive model", "A marketing campaign"], 0, "Определение в тексте."],
      ["What does the team do after releasing the MVP?", ["Watches usage, collects feedback and improves in short cycles", "Stops development", "Keeps the product secret", "Raises the price"], 0, "Второй абзац."],
      ["What does the writer say about this approach?", ["It does not guarantee success but reveals early whether the idea works", "It always guarantees success", "It is too expensive for startups", "It is used only by large companies"], 0, "Последнее предложение."],
      ["True, False or Not Given: Most famous companies started with an MVP.", TFNG, 2, "Об известных компаниях в тексте ничего нет."],
    ]),

  makeText(BUSINESS, 5, "Segmenting a market",
    `Few products appeal equally to everyone. Market segmentation is the process of dividing potential customers into groups with similar needs or characteristics, for example by age, location, income or lifestyle. A company then chooses which segments to target and designs its product, price and message for them.

A sports drink might be marketed to serious athletes as a tool for performance, and to casual gym users as a refreshing treat. Targeting allows a company to use its budget more effectively, because a message aimed at a specific group is usually more persuasive than one aimed at nobody in particular. The risk is choosing a segment that is too small to be profitable.`,
    [
      ["What is market segmentation?", ["Dividing customers into groups with similar needs", "Reducing prices for everyone", "Selling only online", "Making a product cheaper"], 0, "Определение в тексте."],
      ["Which is NOT given as a way to divide customers?", ["Blood type", "Age", "Location", "Income"], 0, "Группа крови не упоминается."],
      ["Why is the sports drink example used?", ["To show that one product can be marketed differently to different segments", "To show that sports drinks are unhealthy", "To compare athletes' incomes", "To explain prices"], 0, "Один продукт — разные сообщения для разных сегментов."],
      ["Why is a targeted message usually more effective?", ["A message aimed at a specific group is more persuasive", "It is cheaper to print", "It reaches everyone", "Customers prefer long messages"], 0, "Второй абзац."],
      ["What risk is mentioned?", ["Choosing a segment too small to be profitable", "Losing all customers", "Breaking the law", "Using too many colours"], 0, "Последнее предложение."],
    ]),

  makeText(BUSINESS, 6, "The power of compound interest",
    `When money earns interest, the interest itself can begin to earn interest. This is called compounding. Suppose you save 100,000 tenge at 10% a year. After one year you have 110,000. In the second year you earn 10% on 110,000, not on the original 100,000, so you end with 121,000.

Over short periods the difference looks small, but over decades it becomes enormous, because growth builds on growth. The same principle works against borrowers: unpaid debt on a credit card can grow surprisingly fast. For this reason, financial advisers often say that starting to save early matters more than saving large amounts later.`,
    [
      ["What is compounding?", ["Earning interest on previously earned interest", "Paying no interest", "Borrowing money from a bank", "Saving money without a bank"], 0, "Определение в первом абзаце."],
      ["How much would you have after two years in the example?", ["121,000 tenge", "120,000 tenge", "110,000 tenge", "200,000 tenge"], 0, "100 000 → 110 000 → 121 000."],
      ["Why does the difference become enormous over decades?", ["Growth builds on growth", "Interest rates always rise", "Banks add bonuses", "Prices fall"], 0, "«because growth builds on growth»."],
      ["How does compounding affect borrowers?", ["Unpaid debt can grow fast", "It reduces their debt", "It does not affect them", "It cancels their interest"], 0, "Тот же механизм работает против должника."],
      ["What do financial advisers often say, according to the text?", ["Starting to save early matters more than saving large amounts later", "Saving is not useful", "Credit cards are always safe", "Only large savings grow"], 0, "Последнее предложение."],
    ]),

  makeText(BUSINESS, 7, "Comparative advantage",
    `In the early nineteenth century, the economist David Ricardo explained why countries benefit from trade even when one of them is better at producing everything. The key is comparative advantage: what matters is not who is best at a task, but who gives up the least to do it.

Imagine a lawyer who types faster than her assistant. It may still make sense for the assistant to do the typing, because every hour the lawyer spends typing is an hour she cannot spend on legal work, which is far more valuable. In the same way, countries can gain by specialising in what they produce at the lowest opportunity cost and trading for the rest.`,
    [
      ["Who explained comparative advantage, according to the text?", ["David Ricardo", "Adam Smith", "A modern lawyer", "The text does not say"], 0, "Первое предложение."],
      ["What matters in comparative advantage?", ["Who gives up the least to do a task", "Who is best at every task", "Who works the longest hours", "Who has the most money"], 0, "«who gives up the least to do it»."],
      ["Why should the assistant do the typing even if the lawyer types faster?", ["The lawyer's time is more valuable for legal work", "The assistant types better", "Lawyers are not allowed to type", "Typing is unimportant"], 0, "Час юриста на печать — потерянный час юридической работы."],
      ["What does the text recommend countries do?", ["Specialise where their opportunity cost is lowest and trade", "Produce everything themselves", "Stop trading", "Copy other countries"], 0, "Последнее предложение."],
      ["True, False or Not Given: Ricardo argued that only the best producer benefits from trade.", TFNG, 1, "Наоборот: выгоду получают обе стороны."],
    ]),

  makeText(BUSINESS, 8, "Why losses feel bigger than gains",
    `Traditional economic models assume that people make rational decisions. Research by the psychologists Daniel Kahneman and Amos Tversky showed that real decisions often follow different patterns. One of their best-known findings is loss aversion: losing a sum of money tends to feel roughly twice as painful as gaining the same sum feels pleasant.

Loss aversion helps explain why people hold on to falling investments too long, hoping to avoid admitting a loss, and why free trials work so well: once customers feel they own something, giving it up feels like a loss. Kahneman received the Nobel Prize in economics in 2002 for this work, which helped found the field of behavioural economics.`,
    [
      ["What do traditional economic models assume?", ["People make rational decisions", "People always lose money", "Losses do not matter", "Psychology is irrelevant to markets"], 0, "Первое предложение."],
      ["What is loss aversion?", ["Losses feel more painful than equal gains feel pleasant", "Avoiding all investments", "Preferring free products", "Spending money quickly"], 0, "Определение в тексте."],
      ["Why do free trials work well, according to the text?", ["Giving up something you feel you own feels like a loss", "Customers like long trials", "Free products are better", "Companies lower their prices"], 0, "Второй абзац."],
      ["What did Kahneman receive in 2002?", ["The Nobel Prize in economics", "A business award", "A psychology degree", "A government post"], 0, "Последнее предложение."],
      ["True, False or Not Given: Tversky also received the Nobel Prize in 2002.", TFNG, 2, "Текст говорит только о Канемане."],
    ]),

  makeText(BUSINESS, 9, "Microfinance",
    `Banks have traditionally been reluctant to lend to very poor people, who usually have no property to offer as security. In the 1970s, the Bangladeshi economist Muhammad Yunus began lending small amounts to poor villagers, many of them women, so they could start or expand tiny businesses. He went on to found the Grameen Bank.

Many of Grameen's loans were made to groups whose members supported one another and shared responsibility for repayment. Yunus and the bank received the Nobel Peace Prize in 2006. Later studies found that microfinance helps some families but, on average, has smaller effects on poverty than early supporters hoped, a reminder that a promising idea still needs careful evaluation.`,
    [
      ["Why were banks reluctant to lend to very poor people?", ["They usually had no property to offer as security", "They did not want loans", "Interest rates were too low", "Banks did not exist in villages"], 0, "Первое предложение."],
      ["What did Yunus found?", ["The Grameen Bank", "A university", "A government ministry", "A charity for students"], 0, "Конец первого абзаца."],
      ["How were many Grameen loans organised?", ["Through groups that shared responsibility for repayment", "Through large companies", "Without any repayment", "Only for men"], 0, "Второй абзац."],
      ["What did later studies find?", ["Effects on poverty were smaller on average than hoped", "Microfinance ended poverty", "Microfinance had no effects at all", "Only banks benefited"], 0, "Последнее предложение."],
      ["What lesson does the writer draw at the end?", ["Promising ideas still need careful evaluation", "Banks should stop lending", "Prizes guarantee success", "Microfinance should be banned"], 0, "«a reminder that a promising idea still needs careful evaluation»."],
    ]),

  makeText(BUSINESS, 10, "Measuring more than profit",
    `For much of the twentieth century, many people believed that a company's only responsibility was to make profit for its owners. Today, investors, customers and employees increasingly ask companies to report on their environmental and social impact as well, such as their carbon emissions, working conditions and treatment of local communities.

Supporters argue that such reporting encourages firms to manage long-term risks, like climate change, that could eventually harm profits. Critics warn of “greenwashing”: presenting a misleadingly positive picture of a company's impact without making real changes. For this reason, some governments now require companies to follow standard reporting rules, so that claims can be compared and checked.`,
    [
      ["What view was common for much of the twentieth century?", ["A company's only responsibility was profit for its owners", "Companies should report on emissions", "Profit is unimportant", "Governments should own companies"], 0, "Первое предложение."],
      ["Which is given as an example of social or environmental impact?", ["Working conditions", "Share price", "Office design", "Advertising budget"], 0, "Перечислены выбросы, условия труда, отношение к местным сообществам."],
      ["What is “greenwashing”?", ["Presenting a misleadingly positive picture without real change", "Cleaning factories", "Investing in forests", "Reducing emissions"], 0, "Определение во втором абзаце."],
      ["Why do some governments require standard reporting rules?", ["So that claims can be compared and checked", "To raise taxes", "To ban advertising", "To reduce profits"], 0, "Последнее предложение."],
      ["True, False or Not Given: Every country now requires companies to report their emissions.", TFNG, 1, "«some governments», а не все страны."],
    ]),
];
