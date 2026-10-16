import type { DataTable, Lesson, Question, Unit } from "./types";

/**
 * SAT Math, second pass: five new problems for each of the nineteen skills.
 * The plan schedules these after the first pass, so every skill comes back
 * weeks later with fresh questions — spaced practice rather than cramming.
 */

/** ["c", prompt, options, answer, explanation, table?] — a multiple-choice question. */
type C = ["c", string, string[], number, string, DataTable?];
/** ["i", prompt, accepted answers, explanation, table?] — a typed answer. */
type I = ["i", string, string[], string, DataTable?];

function q(item: C | I): Question {
  return item[0] === "c"
    ? { kind: "choice", prompt: item[1], options: item[2], answer: item[3], explanation: item[4], table: item[5] }
    : { kind: "input", prompt: item[1], answers: item[2], explanation: item[3], table: item[4] };
}

function practice(skill: string, title: string, tip: string, items: (C | I)[]): Lesson {
  return {
    id: `p-${skill}`,
    title: `Практика: ${title}`,
    summary: "Пять новых задач на уже знакомый навык",
    minutes: 10,
    theory: [
      { body: `Возвращаемся к навыку «${title}» с новыми задачами. Повторение через несколько недель закрепляет навык надёжнее, чем много задач подряд.` },
      { heading: "Напоминание", body: tip },
    ],
    questions: items.map(q),
    official: { label: "Официальные задания по этому навыку: Student Question Bank", url: "https://satsuite.collegeboard.org/practice/student-question-bank" },
  };
}

const TABLE = {
  caption: "Survey of 150 people",
  head: ["", "Morning", "Evening", "Total"],
  rows: [
    ["Prefers coffee", "40", "20", "60"],
    ["Prefers tea", "30", "60", "90"],
    ["Total", "70", "80", "150"],
  ],
};

export const SAT_MATH_PRACTICE: Unit[] = [
  {
    id: "algebra-practice",
    title: "Algebra · практика",
    subtitle: "Новые задачи на пять навыков алгебры",
    lessons: [
      practice("linear-equations-one", "Linear equations in one variable", "Собери x в одной части, числа в другой. Решений нет, если коэффициенты при x равны, а свободные члены — нет.", [
        ["i", "If 7x − 4 = 3x + 20, what is the value of x?", ["6"], "4x = 24, x = 6."],
        ["c", "If (x + 5) / 3 = 4, what is the value of x?", ["5", "7", "9", "17"], 1, "x + 5 = 12, x = 7."],
        ["c", "In the equation 3(2x − 1) = 2(3x + k), k is a constant. If the equation has infinitely many solutions, what is the value of k?", ["−3/2", "3/2", "−3", "0"], 0, "6x − 3 = 6x + 2k для всех x, значит 2k = −3, k = −3/2."],
        ["i", "A gym charges 15,000 tenge to join and 8,000 tenge per month. Aruzhan paid 79,000 tenge in total. For how many months did she pay?", ["8"], "15 000 + 8 000m = 79 000 → 8 000m = 64 000 → m = 8."],
        ["c", "If 0.5x + 2 = 0.25x + 5, what is the value of x?", ["6", "12", "14", "28"], 1, "0.25x = 3 → x = 12."],
      ]),
      practice("linear-functions", "Linear functions", "Наклон — изменение за единицу x, свободный член — значение при x = 0.", [
        ["i", "The function f is defined by f(x) = 4x − 7. What is the value of f(3)?", ["5"], "4 · 3 − 7 = 5."],
        ["c", "A line has a slope of −2 and passes through the point (1, 5). What is its y-intercept?", ["3", "5", "7", "−7"], 2, "5 = −2 · 1 + b → b = 7."],
        ["c", "A plant is 12 centimeters tall and grows 0.5 centimeter per day. Which equation gives its height h, in centimeters, after d days?", ["h = 12 + 0.5d", "h = 0.5 + 12d", "h = 12 − 0.5d", "h = 12.5d"], 0, "Начальная высота 12, каждый день +0,5."],
        ["c", "For a linear function f, f(0) = 3 and f(4) = 11. Which of the following defines f?", ["f(x) = 2x + 3", "f(x) = 3x + 2", "f(x) = 8x + 3", "f(x) = 2x + 11"], 0, "Наклон (11 − 3) / 4 = 2, f(0) = 3."],
        ["i", "The cost, in tenge, of printing n flyers is C = 20n + 1,500. By how many tenge does the cost increase for each additional flyer?", ["20"], "Наклон 20 — стоимость одной дополнительной листовки."],
      ]),
      practice("linear-equations-two", "Linear equations in two variables", "Точка лежит на прямой, если её координаты дают верное равенство. Пересечение с осью y — подставь x = 0.", [
        ["c", "Which point lies on the line 2x + y = 9?", ["(3, 3)", "(2, 4)", "(4, 2)", "(1, 6)"], 0, "2 · 3 + 3 = 9. Для остальных: 8, 10, 8."],
        ["c", "What is the y-intercept of the graph of 5x − 2y = 10?", ["(0, −5)", "(0, 5)", "(2, 0)", "(0, 2)"], 0, "При x = 0: −2y = 10, y = −5."],
        ["i", "Child tickets cost 500 tenge and adult tickets cost 1,200 tenge. A family paid 9,800 tenge and bought 4 adult tickets. How many child tickets did they buy?", ["10"], "4 · 1 200 = 4 800; 9 800 − 4 800 = 5 000; 5 000 / 500 = 10."],
        ["c", "What is the slope of the line 3x − 6y = 12?", ["1/2", "−1/2", "2", "3"], 0, "y = 0.5x − 2, наклон 1/2."],
        ["c", "A line passes through (0, 4) and (2, 0). Which is an equation of the line?", ["2x + y = 4", "x + 2y = 4", "2x − y = 4", "x − 2y = 2"], 0, "Наклон −2, y = −2x + 4, то есть 2x + y = 4."],
      ]),
      practice("systems", "Systems of two linear equations", "Если уравнения легко сложить или вычесть так, чтобы одна переменная исчезла, — это быстрее подстановки.", [
        ["i", "y = 2x + 1\ny = −x + 7\n\nWhat is the value of x in the solution to the system?", ["2"], "2x + 1 = −x + 7 → 3x = 6 → x = 2."],
        ["c", "x + 2y = 11\n3x − 2y = 1\n\nWhat is the value of x?", ["2", "3", "4", "5"], 1, "Сложим: 4x = 12, x = 3."],
        ["i", "The sum of two numbers is 30 and their difference is 8. What is the larger number?", ["19"], "a + b = 30, a − b = 8 → 2a = 38, a = 19."],
        ["c", "2x + 3y = 6\nkx + 9y = 18\n\nFor what value of k does the system have infinitely many solutions?", ["2", "3", "6", "9"], 2, "Второе уравнение должно быть первым, умноженным на 3: k = 6."],
        ["c", "A shop sold 40 items: pens for 300 tenge each and notebooks for 700 tenge each, for 20,000 tenge in total. How many notebooks did it sell?", ["15", "20", "25", "30"], 1, "300(40 − n) + 700n = 20 000 → 12 000 + 400n = 20 000 → n = 20."],
      ]),
      practice("inequalities", "Linear inequalities", "При делении на отрицательное число знак неравенства меняется.", [
        ["c", "Which of the following is the solution to 4 − 3x ≤ 16?", ["x ≥ −4", "x ≤ −4", "x ≥ 4", "x ≤ 4"], 0, "−3x ≤ 12 → x ≥ −4 (знак поменялся)."],
        ["i", "A taxi charges 600 tenge plus 150 tenge per kilometer. With at most 3,000 tenge, what is the greatest whole number of kilometers a passenger can travel?", ["16"], "600 + 150k ≤ 3 000 → 150k ≤ 2 400 → k ≤ 16."],
        ["c", "Which value of x satisfies 2x + 5 > 3x − 1?", ["7", "6", "5", "10"], 2, "6 > x, значит x < 6. Подходит только 5."],
        ["c", "y ≥ x + 1\ny ≤ 5\n\nWhich point satisfies both inequalities?", ["(2, 4)", "(4, 4)", "(1, 6)", "(0, 0)"], 0, "(2, 4): 4 ≥ 3 и 4 ≤ 5. Остальные нарушают одно из условий."],
        ["i", "A club must have at least 3 times as many students as teachers. If there are 12 teachers, what is the minimum number of students?", ["36"], "s ≥ 3 · 12 = 36."],
      ]),
    ],
  },
  {
    id: "advanced-practice",
    title: "Advanced Math · практика",
    subtitle: "Выражения, уравнения и функции — новые задачи",
    lessons: [
      practice("equivalent-expressions", "Equivalent expressions", "(a + b)² = a² + 2ab + b², a² − b² = (a − b)(a + b). Не уверен — подставь число.", [
        ["c", "Which expression is equivalent to (x + 4)²?", ["x² + 8x + 16", "x² + 16", "x² + 4x + 16", "x² + 8x + 8"], 0, "(x + 4)² = x² + 2 · 4x + 16."],
        ["c", "Which expression is equivalent to 2x² − 8?", ["2(x − 2)(x + 2)", "2(x − 4)(x + 4)", "2(x − 2)²", "(2x − 2)(x + 4)"], 0, "2x² − 8 = 2(x² − 4) = 2(x − 2)(x + 2)."],
        ["c", "Which expression is equivalent to (3x²y)(2xy³)?", ["6x³y⁴", "5x³y⁴", "6x²y³", "6x³y³"], 0, "3 · 2 = 6, x² · x = x³, y · y³ = y⁴."],
        ["c", "For x ≠ 1, which expression is equivalent to (x² − 1) / (x − 1)?", ["x + 1", "x − 1", "x", "x² + 1"], 0, "x² − 1 = (x − 1)(x + 1), сокращаем на x − 1."],
        ["i", "If x² − 10x + c = (x − 5)² for all x, what is the value of c?", ["25"], "(x − 5)² = x² − 10x + 25."],
      ]),
      practice("nonlinear-equations", "Nonlinear equations and systems", "Не делите обе части на x — потеряете корень x = 0. Переносите всё в одну сторону и раскладывайте.", [
        ["c", "What are the solutions to x² = 3x?", ["0 and 3", "3 only", "−3 and 3", "0 only"], 0, "x² − 3x = 0 → x(x − 3) = 0."],
        ["i", "What is the larger solution to x² − 7x + 10 = 0?", ["5"], "(x − 2)(x − 5) = 0, корни 2 и 5."],
        ["c", "How many real solutions does x² + 6x + 9 = 0 have?", ["Exactly one", "Zero", "Exactly two", "Infinitely many"], 0, "(x + 3)² = 0, D = 0 — один корень."],
        ["c", "y = x²\ny = x + 2\n\nWhich ordered pair is a solution to the system?", ["(2, 4)", "(1, 1)", "(−2, 4)", "(4, 16)"], 0, "x² = x + 2 → x = 2 или −1. Точка (2, 4) подходит."],
        ["i", "If 2√x = 10, what is the value of x?", ["25"], "√x = 5, x = 25."],
      ]),
      practice("nonlinear-functions", "Nonlinear functions", "Удвоение — множитель 2, половина — 1/2, рост на r% — (1 + r/100).", [
        ["i", "The function f is defined by f(x) = 2ˣ. What is the value of f(5)?", ["32"], "2⁵ = 32."],
        ["c", "What is the vertex of the graph of y = (x + 3)² − 4?", ["(−3, −4)", "(3, −4)", "(−3, 4)", "(3, 4)"], 0, "Вершинная форма (x − h)² + k: h = −3, k = −4."],
        ["c", "A substance's mass halves every 10 years. It starts at 800 grams. What is its mass after 30 years?", ["100 grams", "200 grams", "300 grams", "400 grams"], 0, "Три периода полураспада: 800 → 400 → 200 → 100."],
        ["i", "The function f is defined by f(x) = x² − 4x. What is the value of f(−1)?", ["5"], "1 + 4 = 5."],
        ["c", "What are the zeros of f(x) = (x − 1)(x + 6)?", ["1 and −6", "−1 and 6", "1 and 6", "−1 and −6"], 0, "Множители обращаются в ноль при x = 1 и x = −6."],
      ]),
    ],
  },
  {
    id: "data-practice",
    title: "Problem-Solving and Data · практика",
    subtitle: "Пропорции, проценты, статистика — новые задачи",
    lessons: [
      practice("ratios-rates", "Ratios, rates, and units", "Следи за единицами: часы и минуты, километры и метры.", [
        ["i", "The ratio of boys to girls in a class is 3 : 5. There are 40 students. How many are girls?", ["25"], "40 / 8 = 5 на часть, девочек 5 · 5 = 25."],
        ["c", "A car travels at 60 kilometers per hour. How far does it travel in 2.5 hours?", ["120 km", "150 km", "160 km", "250 km"], 1, "60 · 2.5 = 150."],
        ["c", "5 kilograms of apples cost 2,000 tenge. At the same rate, how much do 8 kilograms cost?", ["2,800 tenge", "3,200 tenge", "3,600 tenge", "4,000 tenge"], 1, "400 тенге за кг, 8 · 400 = 3 200."],
        ["i", "A car travels at 72 kilometers per hour. What is its speed in meters per second?", ["20"], "72 000 м / 3 600 с = 20."],
        ["c", "A map has a scale of 1 : 50,000. How many kilometers do 4 centimeters on the map represent?", ["0.2 km", "2 km", "20 km", "200 km"], 1, "4 · 50 000 = 200 000 см = 2 км."],
      ]),
      practice("percentages", "Percentages", "Изменения подряд перемножаются: +10%, потом −10% — это ×0,99.", [
        ["i", "What is 20% of 350?", ["70"], "350 · 0.2 = 70."],
        ["c", "The price of a book rose from 2,500 tenge to 3,000 tenge. By what percent did it increase?", ["16.7%", "20%", "25%", "50%"], 1, "500 / 2 500 = 0.2 = 20%."],
        ["c", "A jacket priced at 12,000 tenge is discounted by 40%. What is the sale price?", ["4,800 tenge", "7,200 tenge", "8,000 tenge", "11,600 tenge"], 1, "12 000 · 0.6 = 7 200."],
        ["i", "After a 25% decrease, a value is 600. What was the original value?", ["800"], "0.75x = 600 → x = 800."],
        ["c", "A price increases by 10% and then decreases by 10%. What is the overall change?", ["A 1% decrease", "No change", "A 1% increase", "A 2% decrease"], 0, "1.1 · 0.9 = 0.99 — снижение на 1%."],
      ]),
      practice("one-variable-data", "One-variable data", "Среднее чувствительно к выбросам, медиана — нет. Разброс — это стандартное отклонение и размах.", [
        ["i", "What is the mean of 10, 12, 14, 20, 24?", ["16"], "80 / 5 = 16."],
        ["c", "What is the median of 7, 3, 9, 1, 5?", ["3", "5", "7", "9"], 1, "Упорядочим: 1, 3, 5, 7, 9. Середина — 5."],
        ["i", "What is the range of the data set 4, 11, 8, 15, 2?", ["13"], "15 − 2 = 13."],
        ["c", "The mean of four numbers is 15. Three of them are 10, 12 and 20. What is the fourth number?", ["15", "18", "20", "22"], 1, "Сумма 60; 60 − 42 = 18."],
        ["c", "Which data set has the largest standard deviation?", ["1, 50, 100", "10, 11, 12", "5, 5, 5", "20, 21, 22"], 0, "Значения сильнее всего удалены от среднего в первом наборе."],
      ]),
      practice("two-variable-data", "Two-variable data", "Наклон модели — изменение y на единицу x; остаток = факт − прогноз.", [
        ["c", "A phone's battery level p, in percent, is modeled by p = −3t + 90, where t is hours of use. What does −3 represent?", ["The battery level decreases by about 3 percentage points per hour", "The battery starts at 3%", "The battery lasts 3 hours", "The battery level increases by 3% per hour"], 0, "Наклон −3: каждый час минус 3 процентных пункта."],
        ["i", "Using p = −3t + 90, what is the predicted battery level after 10 hours?", ["60"], "−30 + 90 = 60."],
        ["c", "Points on a scatterplot lie close to a line that rises from left to right. What does this indicate?", ["A strong positive linear association", "A strong negative linear association", "No association", "An exponential decrease"], 0, "Точки близко к прямой — сильная связь; подъём — положительная."],
        ["c", "Data are modeled by y = 50(0.8)ˣ. What happens to y each time x increases by 1?", ["It decreases by 20%", "It decreases by 0.8", "It increases by 80%", "It decreases by 80%"], 0, "Множитель 0,8: остаётся 80%, то есть минус 20%."],
        ["c", "A model predicts 50, but the actual value is 45. What is the residual?", ["−5", "5", "45", "95"], 0, "45 − 50 = −5."],
      ]),
      practice("probability", "Probability", "«Given» и «of those who» сужают знаменатель до указанной группы.", [
        ["c", "A fair six-sided die is rolled. What is the probability of rolling an even number?", ["1/2", "1/3", "1/6", "2/3"], 0, "2, 4, 6 — три из шести."],
        ["c", "A bag has 4 red and 6 blue marbles. Two are drawn without replacement. What is the probability that both are red?", ["2/15", "4/25", "1/5", "2/5"], 0, "4/10 · 3/9 = 12/90 = 2/15."],
        ["c", "If a person who prefers tea is chosen at random, what is the probability that they prefer the evening?", ["2/3", "2/5", "3/5", "1/3"], 0, "Знаменатель — любители чая (90), из них вечер — 60: 60/90 = 2/3.", TABLE],
        ["i", "If a person is chosen at random from the whole survey, what is the probability that they prefer coffee? Enter a decimal or a fraction.", ["0.4", "2/5"], "60/150 = 0,4.", TABLE],
        ["c", "Two fair coins are tossed. What is the probability of getting at least one head?", ["3/4", "1/2", "1/4", "1"], 0, "Без орлов только TT: 1 − 1/4 = 3/4."],
      ]),
      practice("sample-statistics", "Inference from samples", "Случайная выборка → оценка для всей совокупности; больше выборка → меньше погрешность.", [
        ["i", "A random sample of 200 of a school's 5,000 students found that 40 walk to school. Based on the sample, about how many students at the school walk to school?", ["1000"], "40/200 = 0.2; 0.2 · 5 000 = 1 000."],
        ["c", "A poll estimates 64% support with a margin of error of 5 percentage points. Which value is a plausible true level of support?", ["61%", "55%", "71%", "75%"], 0, "Интервал 59–69%. В него попадает только 61%."],
        ["c", "A researcher surveys only people in a bookstore about how much they read. What is the main problem?", ["The sample is not representative of the whole population", "The sample is too small", "Reading cannot be measured", "Bookstores are closed"], 0, "Посетители книжного читают больше остальных."],
        ["c", "If a random sample is made larger, what typically happens to the margin of error?", ["It decreases", "It increases", "It stays the same", "It becomes zero"], 0, "Погрешность уменьшается с ростом выборки."],
        ["c", "Survey A has a margin of error of 2%, survey B of 6%. Which estimate is more precise?", ["Survey A", "Survey B", "They are equally precise", "Neither can be compared"], 0, "Меньшая погрешность — точнее."],
      ]),
      practice("statistical-claims", "Evaluating statistical claims", "Причину показывает только случайное распределение по группам. Обобщать — на ту совокупность, откуда случайно выбирали.", [
        ["c", "Students who chose to attend tutoring scored higher than those who did not. Can we conclude that tutoring caused the higher scores?", ["No, because students were not randomly assigned", "Yes, because the scores were higher", "Yes, because tutoring always works", "No, because the scores were too high"], 0, "Сами выбрали — значит, группы могли различаться и без занятий."],
        ["c", "Researchers randomly assigned 100 plants to receive fertilizer or no fertilizer; the fertilized plants grew taller. Which conclusion is best supported?", ["The fertilizer likely caused taller growth in similar plants", "Fertilizer makes every plant on Earth taller", "There is no relationship", "Taller plants need less water"], 0, "Случайное распределение позволяет говорить о причине, но обобщать — на похожие растения."],
        ["c", "A random sample of Almaty residents finds that 30% cycle to work. To which population can this result be generalized?", ["Residents of Almaty", "All residents of Kazakhstan", "Only the people surveyed", "All cyclists in the world"], 0, "Выборка случайная из жителей Алматы."],
        ["c", "Which of the following is an observational study?", ["Recording students' sleep hours and grades without changing anything", "Randomly assigning students to sleep 6 or 9 hours", "Giving half the class a new textbook at random", "Testing a drug against a placebo"], 0, "В наблюдении исследователь ничего не меняет."],
        ["c", "Ice cream sales and drownings both rise at the same time of year. What is the most likely explanation?", ["Both increase in hot weather", "Ice cream causes drowning", "Drowning increases ice cream sales", "The data are wrong"], 0, "Общий скрытый фактор — жара."],
      ]),
    ],
  },
  {
    id: "geometry-practice",
    title: "Geometry and Trigonometry · практика",
    subtitle: "Площади, углы, треугольники, окружности — новые задачи",
    lessons: [
      practice("area-volume", "Area and volume", "Масштаб k: площадь ×k², объём ×k³.", [
        ["c", "A circle has a radius of 5. What is its area?", ["10π", "25π", "50π", "100π"], 1, "πr² = 25π."],
        ["i", "A rectangular box measures 3 by 4 by 5. What is its volume?", ["60"], "3 · 4 · 5 = 60."],
        ["i", "A square has an area of 49. What is its perimeter?", ["28"], "Сторона 7, периметр 28."],
        ["c", "A cylinder has a radius of 2 and a height of 7. What is its volume?", ["14π", "28π", "49π", "98π"], 1, "π · 4 · 7 = 28π."],
        ["c", "If the radius of a sphere is doubled, its volume is multiplied by", ["2", "4", "6", "8"], 3, "Объём ∝ r³: 2³ = 8."],
      ]),
      practice("lines-angles-triangles", "Lines, angles, and triangles", "Смежные — 180°, сумма углов n-угольника — 180°(n − 2).", [
        ["i", "Two angles on a straight line measure x° and 3x°. What is the value of x?", ["45"], "4x = 180, x = 45."],
        ["c", "Two interior angles of a triangle measure 50° and 60°. What is the measure of the exterior angle at the third vertex?", ["70°", "110°", "120°", "130°"], 1, "Внешний угол равен сумме двух не смежных с ним внутренних: 110°."],
        ["c", "Two similar triangles have a scale factor of 2 from the smaller to the larger. The smaller has an area of 9. What is the area of the larger?", ["18", "27", "36", "81"], 2, "Площадь ×2² = ×4: 36."],
        ["i", "What is the sum of the interior angles of a pentagon, in degrees?", ["540"], "180 · (5 − 2) = 540."],
        ["c", "The base angles of an isosceles triangle measure 65° each. What is the vertex angle?", ["50°", "65°", "115°", "130°"], 0, "180 − 130 = 50."],
      ]),
      practice("right-triangles", "Right triangles and trigonometry", "Тройки 3-4-5 и 5-12-13; в 30-60-90 катет против 30° — половина гипотенузы.", [
        ["i", "A right triangle has legs of 5 and 12. What is the hypotenuse?", ["13"], "√(25 + 144) = 13."],
        ["c", "In a right triangle, one angle is 30° and the hypotenuse is 20. What is the length of the side opposite the 30° angle?", ["10", "10√3", "20√3", "40"], 0, "Против 30° — половина гипотенузы."],
        ["c", "In right triangle ABC, the side opposite angle A is 3 and the side adjacent to it is 4. What is tan A?", ["3/4", "4/3", "3/5", "4/5"], 0, "tan = противолежащий / прилежащий."],
        ["c", "A square has a side of 6. What is the length of its diagonal?", ["6√2", "12", "6√3", "36"], 0, "Диагональ квадрата — сторона · √2."],
        ["i", "In a right triangle, cos A = 0.6 and the hypotenuse is 10. What is the length of the side adjacent to angle A?", ["6"], "cos = прилежащий / гипотенуза: 0,6 · 10 = 6."],
      ]),
      practice("circles", "Circles", "Дуга и сектор — доля полного круга: угол / 360°.", [
        ["c", "A circle has a diameter of 14. What is its circumference?", ["7π", "14π", "28π", "49π"], 1, "πd = 14π."],
        ["i", "What is the radius of the circle (x − 2)² + (y + 1)² = 16?", ["4"], "r² = 16, r = 4."],
        ["c", "In a circle with radius 9, a central angle measures 60°. What is the length of the arc it intercepts?", ["3π", "6π", "9π", "18π"], 0, "60/360 · 18π = 3π."],
        ["c", "What is the center of the circle x² + y² + 4x − 6y = 3?", ["(−2, 3)", "(2, −3)", "(4, −6)", "(−4, 6)"], 0, "(x + 2)² + (y − 3)² = 16, центр (−2, 3)."],
        ["c", "A circle has a radius of 6. What is the area of a sector with a central angle of 120°?", ["6π", "12π", "18π", "36π"], 1, "120/360 · 36π = 12π."],
      ]),
    ],
  },
];
