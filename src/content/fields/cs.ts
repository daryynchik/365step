import { makeText, TFNG, type FieldMeta } from "./make";

export const CS: FieldMeta = {
  id: "cs",
  title: "IT и компьютерные науки",
  short: "IT",
  intro: "Тексты об алгоритмах, сетях, данных и безопасности — без кода, на языке, которым пишут учебники и научно-популярные статьи по информатике.",
};

export const CS_TEXTS = [
  makeText(CS, 1, "What makes an algorithm efficient",
    `An algorithm is a precise, step-by-step procedure for solving a problem. Two algorithms can solve the same problem correctly yet differ enormously in speed. Imagine searching for a name in a sorted list of one million entries. Checking each name in turn might take up to a million steps.

Binary search is far faster. It looks at the middle entry and asks whether the target comes before or after it, then discards the half that cannot contain the name. Repeating this halving, it finds any name in about twenty steps. Computer scientists compare algorithms by how the number of steps grows as the input grows, because for large data the difference between approaches matters far more than the speed of the computer.`,
    [
      ["What is an algorithm, according to the text?", ["A precise step-by-step procedure for solving a problem", "A type of computer", "A programming language", "A list of names"], 0, "Определение в первом предложении."],
      ["How does binary search find a name?", ["By repeatedly discarding the half that cannot contain it", "By checking every name in turn", "By guessing randomly", "By sorting the list again"], 0, "Каждый шаг отбрасывает половину списка."],
      ["About how many steps does binary search need for one million entries?", ["About twenty", "About one million", "About a thousand", "Exactly one"], 0, "2²⁰ ≈ 1 000 000, поэтому около двадцати шагов."],
      ["Why do computer scientists focus on how the number of steps grows?", ["For large data the approach matters more than the computer's speed", "Faster computers do not exist", "Small inputs are more common", "It is easier to calculate"], 0, "Последнее предложение."],
      ["True, False or Not Given: Binary search checks every name in the list one by one.", TFNG, 1, "Наоборот: он каждый раз отбрасывает половину списка, а перебор каждого имени — это медленный способ из первого абзаца."],
    ]),

  makeText(CS, 2, "How data travels across the internet",
    `When you send a message or load a web page, the data does not travel as a single piece. It is divided into small units called packets. Each packet carries part of the data along with the address of its destination, much like a letter in an envelope.

Routers along the way read these addresses and forward each packet towards its goal. Packets from the same message may take different routes and arrive out of order. A set of rules known as TCP makes sure that missing packets are sent again and that the receiving computer puts them back in the right order. This design makes the network resilient: if one route fails, packets can simply travel another way.`,
    [
      ["What are packets?", ["Small units into which data is divided", "Types of routers", "Web pages", "Computer viruses"], 0, "«It is divided into small units called packets»."],
      ["What do routers do?", ["Forward packets towards their destination", "Store web pages", "Create packets", "Check spelling"], 0, "Маршрутизаторы читают адрес и пересылают пакет."],
      ["What is one job of TCP?", ["Putting packets back in the right order", "Choosing the colour of web pages", "Making packets larger", "Blocking all traffic"], 0, "TCP повторно отправляет потерянные пакеты и собирает их по порядку."],
      ["The word “resilient” is closest in meaning to", ["able to keep working when parts fail", "very fast", "expensive", "easy to hack"], 0, "Устойчивость: если один маршрут падает, пакеты идут другим."],
      ["True, False or Not Given: All packets from one message always follow the same route.", TFNG, 1, "«Packets from the same message may take different routes»."],
    ]),

  makeText(CS, 3, "Public-key encryption",
    `Encryption scrambles information so that only someone with the right key can read it. For centuries, both sender and receiver had to share the same secret key, which created a problem: how could they exchange the key safely in the first place?

Public-key cryptography, developed in the 1970s, solved this. Each person has two linked keys. The public key can be shared with anyone and is used to encrypt messages. Only the matching private key, which its owner keeps secret, can decrypt them. When your browser shows a padlock next to a website address, this method has been used to set up a secure connection, protecting passwords and payment details from anyone listening in.`,
    [
      ["What problem did public-key cryptography solve?", ["How to share a secret key safely", "How to make computers faster", "How to store more data", "How to design websites"], 0, "Проблема — безопасный обмен общим секретным ключом."],
      ["Which key is used to encrypt messages?", ["The public key", "The private key", "Both keys together", "No key"], 0, "«The public key… is used to encrypt messages»."],
      ["Who should know the private key?", ["Only its owner", "Everyone", "Only the website", "The government"], 0, "«which its owner keeps secret»."],
      ["What does the padlock in a browser indicate?", ["A secure connection has been set up", "The website is free", "The page is loading", "The site has no passwords"], 0, "Замок означает защищённое соединение."],
      ["True, False or Not Given: Public-key cryptography was developed in the 1970s.", TFNG, 0, "«developed in the 1970s»."],
    ]),

  makeText(CS, 4, "How machines learn from data",
    `Machine learning is a way of building computer programs that improve by studying examples rather than by following rules written by a programmer. To recognise photos of cats, for instance, a system is shown many labelled images and gradually adjusts its internal settings until its guesses match the labels.

A model is usually trained on one set of data and evaluated on a separate set it has never seen. This matters because a model can “memorise” its training examples, performing perfectly on them but poorly on new data, a problem known as overfitting. The quality of the training data is also crucial: if the examples are unrepresentative or biased, the model's decisions will reflect those flaws.`,
    [
      ["How does machine learning differ from traditional programming?", ["Programs improve by studying examples", "Programmers write every rule", "Computers do not need data", "It works only with images"], 0, "Первое предложение."],
      ["Why is a model tested on separate data?", ["To check how it performs on examples it has not seen", "To make training faster", "Because training data is lost", "To reduce the cost"], 0, "Это проверка на новых данных."],
      ["What is overfitting?", ["Performing well on training data but poorly on new data", "Using too little data", "A computer running too hot", "Labelling images incorrectly"], 0, "Определение во втором абзаце."],
      ["What does the text say about biased training data?", ["The model's decisions will reflect the bias", "It makes models more accurate", "It does not matter", "It prevents overfitting"], 0, "Последнее предложение."],
      ["True, False or Not Given: Machine learning was first used to recognise cats.", TFNG, 2, "Кошки — пример, а не история первого применения."],
    ]),

  makeText(CS, 5, "Bugs and testing",
    `A bug is an error in a program that causes it to behave unexpectedly. The word was used by engineers long before computers, but a famous story comes from 1947, when operators of the Harvard Mark II computer found a moth trapped in a relay and taped it into their logbook as the “first actual case of bug being found.”

Modern software teams try to catch bugs before users do. One common practice is unit testing: writing small automated checks that confirm each part of a program works as expected. Whenever the code changes, the tests run again, quickly revealing whether a change has broken something that used to work.`,
    [
      ["What is a bug?", ["An error that makes a program behave unexpectedly", "A small computer", "An insect inside every computer", "A type of test"], 0, "Определение в первом предложении."],
      ["What does the 1947 story describe?", ["A moth found in a computer relay", "The invention of the computer", "The first programming language", "A virus attack"], 0, "Мотылёк в реле Harvard Mark II."],
      ["According to the text, the word “bug” was", ["used by engineers before computers existed", "invented in 1947", "invented by programmers in the 2000s", "never used before computers"], 0, "«used by engineers long before computers»."],
      ["What is unit testing?", ["Writing small automated checks for parts of a program", "Testing a computer's hardware", "Asking users to report problems", "Rewriting the whole program"], 0, "Определение во втором абзаце."],
      ["Why are tests run again after code changes?", ["To reveal whether something that worked is now broken", "To make the code longer", "Because tests expire", "To check the computer's speed"], 0, "Последнее предложение."],
    ]),

  makeText(CS, 6, "Counting in binary",
    `Computers store all information, from text to music, as long sequences of two symbols: 0 and 1. Each of these is called a bit. Electronic circuits can represent two states very reliably, for example a voltage that is either high or low, which is why the binary system is so practical.

In the decimal system each position is worth ten times the one to its right; in binary, each is worth twice as much. So the binary number 101 means one four, no twos and one one, which equals five. Bits are grouped into bytes of eight bits each. A single byte can represent 256 different values, enough for every letter of the English alphabet in both cases, plus digits and punctuation.`,
    [
      ["Why is the binary system practical for computers?", ["Circuits can represent two states very reliably", "It is easier for people to read", "It uses fewer digits than decimal for every number", "It was invented first"], 0, "Две устойчивые позиции — высокое и низкое напряжение."],
      ["What is the decimal value of binary 101?", ["5", "101", "3", "6"], 0, "1·4 + 0·2 + 1·1 = 5."],
      ["How many bits are in a byte?", ["8", "2", "10", "256"], 0, "«bytes of eight bits each»."],
      ["How many different values can one byte represent?", ["256", "8", "100", "1,024"], 0, "2⁸ = 256."],
      ["True, False or Not Given: In binary, each position is worth ten times the one to its right.", TFNG, 1, "В двоичной системе — вдвое, а не в десять раз."],
    ]),

  makeText(CS, 7, "Databases and keys",
    `Most applications, from online shops to school registers, store their information in databases. In a relational database, data is organised into tables made of rows and columns. A table of students, for example, might have one row per student and columns for name, class and date of birth.

Each row needs a value that identifies it uniquely, called a primary key, such as a student number. Names are poor keys because two people can share the same name. Tables are connected through these keys: a table of exam results can store each student's number instead of repeating their full details. This avoids contradictions, because each fact is stored in only one place.`,
    [
      ["How is data organised in a relational database?", ["In tables of rows and columns", "As long lists of words", "As images", "In a single file per letter"], 0, "Второе предложение."],
      ["What is a primary key?", ["A value that identifies each row uniquely", "A password to the database", "The first column of every table", "The largest number in a table"], 0, "Определение во втором абзаце."],
      ["Why are names poor primary keys?", ["Two people can share the same name", "Names are too long", "Names change every year", "Names cannot be stored"], 0, "Имена могут совпадать."],
      ["What is the benefit of storing each fact in only one place?", ["It avoids contradictions", "It uses more memory", "It makes data public", "It removes the need for keys"], 0, "Последнее предложение."],
      ["True, False or Not Given: Online shops never use relational databases.", TFNG, 1, "Текст говорит, что онлайн-магазины хранят данные в базах данных."],
    ]),

  makeText(CS, 8, "Open-source software",
    `Open-source software is software whose source code is published so that anyone can read, use, modify and share it, under the terms of its licence. Thousands of volunteers and companies contribute to large open-source projects, fixing bugs and adding features.

One of the best-known examples is the Linux operating system kernel, first released by Linus Torvalds in 1991. Today it runs most of the world's web servers and forms the basis of Android phones. Supporters argue that open code is often more secure because many people can inspect it. Critics reply that being visible does not guarantee that anyone has actually checked it carefully.`,
    [
      ["What makes software “open source”?", ["Its source code is published for others to use and modify", "It is always free of bugs", "It is written by one company", "It cannot be changed"], 0, "Определение в первом предложении."],
      ["Who first released the Linux kernel?", ["Linus Torvalds", "A large phone company", "A government", "Thousands of volunteers at once"], 0, "«first released by Linus Torvalds in 1991»."],
      ["Which use of Linux is mentioned?", ["It forms the basis of Android phones", "It is used only in schools", "It replaced the internet", "It runs only on old computers"], 0, "Linux лежит в основе Android и большинства веб-серверов."],
      ["What is the critics' point?", ["Visible code is not necessarily checked carefully", "Open code is always insecure", "Nobody uses open-source software", "Licences are too expensive"], 0, "Последнее предложение."],
      ["True, False or Not Given: Every open-source licence allows exactly the same uses.", TFNG, 2, "Текст говорит «under the terms of its licence», но не сравнивает лицензии."],
    ]),

  makeText(CS, 9, "Phishing and human weaknesses",
    `Many cyberattacks do not break through technical defences at all. Instead, they trick people. In a phishing attack, a criminal sends a message that appears to come from a trusted source, such as a bank or a school, and persuades the reader to click a link or enter a password on a fake website.

Phishing messages often create a sense of urgency, warning that an account will be closed unless the reader acts immediately. Security experts recommend checking the sender's address carefully, never entering passwords through links in unexpected messages, and turning on two-factor authentication, which requires a second proof of identity, such as a code sent to a phone, in addition to the password.`,
    [
      ["What does a phishing attack rely on?", ["Tricking people", "Breaking encryption", "Damaging hardware", "Slowing networks"], 0, "«they trick people»."],
      ["Why do phishing messages often create urgency?", ["To make readers act before thinking", "To be polite", "Because banks require it", "To avoid spam filters"], 0, "Срочность заставляет действовать, не проверяя."],
      ["What is two-factor authentication?", ["Requiring a second proof of identity besides the password", "Using two passwords", "Having two computers", "Checking emails twice"], 0, "Определение в конце текста."],
      ["Which advice is given?", ["Never enter passwords through links in unexpected messages", "Change passwords every day", "Delete all emails", "Use the same password everywhere"], 0, "Прямой совет экспертов в тексте."],
      ["True, False or Not Given: Most cyberattacks are carried out by teenagers.", TFNG, 2, "О том, кто проводит атаки, ничего не сказано."],
    ]),

  makeText(CS, 10, "Alan Turing and the idea of computation",
    `In 1936, before practical electronic computers existed, the British mathematician Alan Turing described an imaginary device now called a Turing machine. It reads and writes symbols on an endless tape according to a simple set of rules. Turing showed that such a machine could, in principle, carry out any calculation that can be described step by step, and that some problems cannot be solved by any such procedure at all.

During the Second World War, Turing worked on breaking German codes at Bletchley Park. In a 1950 paper he proposed what became known as the Turing test: if a machine's written replies could not be distinguished from a human's, should we say that it thinks? The question is still debated today.`,
    [
      ["When did Turing describe the Turing machine?", ["1936", "1950", "1945", "1912"], 0, "«In 1936…»."],
      ["What did Turing show about some problems?", ["They cannot be solved by any step-by-step procedure", "They can be solved only by humans", "They need faster computers", "They were solved during the war"], 0, "Конец первого абзаца."],
      ["What was Turing's work at Bletchley Park?", ["Breaking German codes", "Building the first internet", "Teaching mathematics", "Designing aircraft"], 0, "Второй абзац."],
      ["What question does the Turing test raise?", ["Whether a machine whose replies seem human can be said to think", "Whether humans can compute faster than machines", "Whether codes can be broken", "Whether tapes are endless"], 0, "Суть теста изложена в тексте."],
      ["True, False or Not Given: The Turing machine was a real electronic computer.", TFNG, 1, "Это «imaginary device», описанное до появления электронных компьютеров."],
    ]),
];
