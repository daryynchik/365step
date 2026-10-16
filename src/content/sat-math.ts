import type { Course } from "./types";

/**
 * SAT Math: the four College Board domains and their nineteen skills, one lesson
 * per skill. Roughly a quarter of the questions are student-produced responses,
 * as on the real test, where you type the answer instead of choosing it.
 */

const QUESTION_BANK = "https://satsuite.collegeboard.org/practice/student-question-bank";

const official = (domain: string, skill: string) => ({
  label: `Официальные задания: Math → ${domain} → ${skill}`,
  url: QUESTION_BANK,
});

export const SAT_MATH: Course = {
  id: "sat-math",
  title: "SAT Math",
  short: "Math",
  description:
    "Алгебра, продвинутая математика, анализ данных и геометрия — девятнадцать навыков из официальной спецификации SAT.",
  units: [
    // ------------------------------------------------------------------ 1 --
    {
      id: "algebra",
      title: "Algebra",
      subtitle: "Линейные уравнения, функции, системы и неравенства",
      lessons: [
        {
          id: "linear-equations-one",
          title: "Linear equations in one variable",
          summary: "Решить уравнение и посчитать число решений",
          minutes: 10,
          official: official("Algebra", "Linear equations in one variable"),
          theory: [
            {
              body:
                "Цель — оставить x одного: раскрыть скобки, собрать x в одной части, числа в другой, разделить на коэффициент. На SAT часто спрашивают не x, а выражение с ним — например, 6x − 15. Иногда его можно получить сразу, не находя x.",
            },
            {
              heading: "Сколько решений",
              body:
                "Приведи уравнение к виду ax + b = cx + d.\n• a ≠ c — **ровно одно** решение.\n• a = c и b = d — **бесконечно много** (обе части одинаковы).\n• a = c и b ≠ d — **нет решений**.",
            },
            {
              heading: "Пример",
              body:
                "Если 2x − 5 = 11, чему равно 6x − 15? Заметь: 6x − 15 = 3(2x − 5) = 3 · 11 = 33. Находить x не нужно.",
            },
          ],
          questions: [
            {
              kind: "choice",
              prompt: "If 3x + 7 = 22, what is the value of x?",
              options: ["3", "5", "7", "15"],
              answer: 1,
              explanation: "3x = 22 − 7 = 15, x = 15 / 3 = 5.",
            },
            {
              kind: "input",
              prompt: "If 4(x − 2) = 2x + 6, what is the value of x?",
              answers: ["7"],
              explanation: "4x − 8 = 2x + 6 → 2x = 14 → x = 7.",
            },
            {
              kind: "choice",
              prompt: "If 2x − 5 = 11, what is the value of 6x − 15?",
              options: ["24", "33", "48", "51"],
              answer: 1,
              explanation: "6x − 15 = 3(2x − 5) = 3 · 11 = 33.",
            },
            {
              kind: "choice",
              prompt: "How many solutions does the equation 5(x + 2) = 5x + 10 have?",
              options: ["Zero", "Exactly one", "Exactly two", "Infinitely many"],
              answer: 3,
              explanation:
                "Раскроем скобки: 5x + 10 = 5x + 10. Обе части одинаковы при любом x — решений бесконечно много.",
            },
            {
              kind: "choice",
              prompt:
                "In the equation 3(kx − 4) = 12x + 7, k is a constant. If the equation has no solution, what is the value of k?",
              options: ["3", "4", "7", "12"],
              answer: 1,
              explanation:
                "3kx − 12 = 12x + 7. Решений нет, когда коэффициенты при x равны, а свободные члены разные: 3k = 12, k = 4 (и −12 ≠ 7).",
            },
          ],
        },
        {
          id: "linear-functions",
          title: "Linear functions",
          summary: "Наклон, начальное значение, смысл в задаче",
          minutes: 10,
          official: official("Algebra", "Linear functions"),
          theory: [
            {
              body:
                "Линейная функция: f(x) = mx + b. **m** — наклон, то есть на сколько меняется f, когда x растёт на 1. **b** — значение при x = 0, то есть «начальное» значение.",
            },
            {
              heading: "В текстовых задачах",
              body:
                "• Плата за каждую единицу (за километр, за час) — это наклон.\n• Фиксированная плата, начальная высота, стартовая сумма — это b.\n• По двум точкам наклон находится как m = (y₂ − y₁) / (x₂ − x₁).",
            },
          ],
          questions: [
            {
              kind: "choice",
              prompt:
                "A taxi company charges a fixed fee plus a charge for each kilometer. The total cost, in tenge, of a ride of x kilometers is C(x) = 180x + 500. What does 500 represent?",
              options: [
                "The charge for each kilometer",
                "The fixed fee charged for any ride",
                "The total cost of a 1-kilometer ride",
                "The number of kilometers in an average ride",
              ],
              answer: 1,
              explanation:
                "500 — значение C при x = 0, его платят независимо от расстояния. Это фиксированная плата. 180 — плата за километр.",
            },
            {
              kind: "input",
              prompt: "The function f is linear, f(2) = 7, and f(5) = 16. What is the value of f(10)?",
              answers: ["31"],
              explanation:
                "Наклон: (16 − 7) / (5 − 2) = 3. Тогда f(x) = 3x + b, и 7 = 6 + b, b = 1. f(10) = 30 + 1 = 31.",
            },
            {
              kind: "choice",
              prompt:
                "A candle is 30 centimeters tall and burns at a constant rate of 1.5 centimeters per hour. Which function gives the candle's height h, in centimeters, t hours after it is lit?",
              options: ["h = 30t − 1.5", "h = 1.5t + 30", "h = 30 − 1.5t", "h = 30 − t / 1.5"],
              answer: 2,
              explanation:
                "Начальная высота 30, каждый час она уменьшается на 1,5: h = 30 − 1,5t.",
            },
            {
              kind: "choice",
              prompt: "Line ℓ passes through the points (0, −4) and (6, 8). What is the slope of line ℓ?",
              options: ["1/2", "2", "4/3", "12"],
              answer: 1,
              explanation: "(8 − (−4)) / (6 − 0) = 12 / 6 = 2.",
            },
            {
              kind: "input",
              prompt: "The function g is defined by g(x) = −2x + 9. For what value of x does g(x) = −5?",
              answers: ["7"],
              explanation: "−2x + 9 = −5 → −2x = −14 → x = 7.",
            },
          ],
        },
        {
          id: "linear-equations-two",
          title: "Linear equations in two variables",
          summary: "Уравнение по условию, точки пересечения с осями",
          minutes: 10,
          official: official("Algebra", "Linear equations in two variables"),
          theory: [
            {
              body:
                "Уравнение вида Ax + By = C описывает прямую и часто — бюджет или комбинацию двух величин: «цена × количество + цена × количество = сумма».",
            },
            {
              heading: "Полезное",
              body:
                "• Наклон прямой Ax + By = C равен −A / B.\n• Пересечение с осью x: подставь y = 0. С осью y: подставь x = 0.\n• Точка лежит на прямой, если её координаты обращают уравнение в верное равенство.",
            },
          ],
          questions: [
            {
              kind: "choice",
              prompt:
                "A store sells notebooks for 400 tenge each and pens for 150 tenge each. Ayan spends exactly 3,100 tenge on n notebooks and p pens. Which equation represents this situation?",
              options: ["400n + 150p = 3,100", "150n + 400p = 3,100", "400n − 150p = 3,100", "550(n + p) = 3,100"],
              answer: 0,
              explanation: "Тетради: 400 · n, ручки: 150 · p, вместе — 3 100.",
            },
            {
              kind: "input",
              prompt:
                "Notebooks cost 400 tenge each and pens cost 150 tenge each. Ayan spends exactly 3,100 tenge and buys 4 notebooks. How many pens does he buy?",
              answers: ["10"],
              explanation: "400 · 4 + 150p = 3 100 → 150p = 1 500 → p = 10.",
            },
            {
              kind: "choice",
              prompt: "What is the slope of the line with equation 3x + 4y = 12?",
              options: ["−4/3", "−3/4", "3/4", "3"],
              answer: 1,
              explanation: "4y = −3x + 12 → y = −(3/4)x + 3. Наклон −3/4.",
            },
            {
              kind: "choice",
              prompt: "What is the x-intercept of the graph of 2x − 5y = 20 in the xy-plane?",
              options: ["(−4, 0)", "(0, −4)", "(10, 0)", "(0, 10)"],
              answer: 2,
              explanation: "При y = 0: 2x = 20, x = 10. Точка (10, 0).",
            },
            {
              kind: "input",
              prompt: "The point (a, 3) lies on the line y = 2x − 7. What is the value of a?",
              answers: ["5"],
              explanation: "3 = 2a − 7 → 2a = 10 → a = 5.",
            },
          ],
        },
        {
          id: "systems",
          title: "Systems of two linear equations",
          summary: "Подстановка, сложение и число решений",
          minutes: 12,
          official: official("Algebra", "Systems of two linear equations in two variables"),
          theory: [
            {
              body:
                "Два способа. **Подстановка**: вырази одну переменную и подставь во второе уравнение. **Сложение (вычитание)**: сложи или вычти уравнения, чтобы одна переменная исчезла. Если спрашивают x + y или другую комбинацию — сначала посмотри, не получается ли она сразу.",
            },
            {
              heading: "Число решений",
              body:
                "• Разные наклоны — одно решение.\n• Одинаковые наклоны, разные пересечения с осью y — **нет решений** (параллельные прямые).\n• Одно и то же уравнение, умноженное на число, — **бесконечно много** решений.",
            },
          ],
          questions: [
            {
              kind: "input",
              prompt: "x + y = 10\nx − y = 4\n\nWhat is the value of x in the solution to the system?",
              answers: ["7"],
              explanation: "Сложим уравнения: 2x = 14, x = 7.",
            },
            {
              kind: "choice",
              prompt: "2x + 3y = 12\nx − y = 1\n\nWhat is the value of y in the solution to the system?",
              options: ["1", "2", "3", "4"],
              answer: 1,
              explanation: "x = y + 1. Тогда 2(y + 1) + 3y = 12 → 5y = 10 → y = 2.",
            },
            {
              kind: "choice",
              prompt:
                "A theater sells adult tickets for 2,000 tenge and student tickets for 1,200 tenge. One evening it sold 50 tickets for a total of 84,000 tenge. How many adult tickets did it sell?",
              options: ["20", "25", "30", "35"],
              answer: 2,
              explanation:
                "a + s = 50 и 2000a + 1200s = 84 000. Подставим s = 50 − a: 800a + 60 000 = 84 000 → a = 30.",
            },
            {
              kind: "choice",
              prompt:
                "3x − 2y = 5\n6x − ky = 7\n\nIn the system above, k is a constant. For what value of k does the system have no solution?",
              options: ["2", "3", "4", "6"],
              answer: 2,
              explanation:
                "Умножим первое уравнение на 2: 6x − 4y = 10. При k = 4 левые части совпадают, а правые разные (10 и 7) — прямые параллельны, решений нет.",
            },
            {
              kind: "input",
              prompt: "3x + 2y = 17\nx + 2y = 11\n\nWhat is the value of x + y?",
              answers: ["7"],
              explanation: "Вычтем: 2x = 6, x = 3. Тогда 2y = 8, y = 4. x + y = 7.",
            },
          ],
        },
        {
          id: "inequalities",
          title: "Linear inequalities",
          summary: "Неравенства и ограничения в задачах",
          minutes: 10,
          official: official("Algebra", "Linear inequalities in one or two variables"),
          theory: [
            {
              body:
                "Неравенства решаются как уравнения, с одним правилом: **при умножении или делении на отрицательное число знак меняется на противоположный**.",
            },
            {
              heading: "Перевод слов",
              body:
                "• at least, no less than — ≥\n• at most, no more than — ≤\n• more than — >, fewer than — <\n• В задачах про количество ответ — целое число. Если получилось b ≤ 32,8, максимум — 32.",
            },
            {
              heading: "Системы неравенств",
              body: "Проверяй точку подстановкой в каждое неравенство. Должны выполняться все.",
            },
          ],
          questions: [
            {
              kind: "choice",
              prompt: "Which of the following values of x satisfies the inequality 5 − 2x > 11?",
              options: ["−4", "−3", "0", "4"],
              answer: 0,
              explanation: "−2x > 6 → x < −3 (знак поменялся при делении на −2). Подходит только −4.",
            },
            {
              kind: "choice",
              prompt:
                "A phone plan costs 3,000 tenge per month plus 50 tenge for each gigabyte of data used. Dana wants to spend at most 4,500 tenge this month. Which inequality represents the possible numbers of gigabytes, g, she can use?",
              options: ["3,000 + 50g ≤ 4,500", "3,000 + 50g ≥ 4,500", "50 + 3,000g ≤ 4,500", "3,000g + 50 ≥ 4,500"],
              answer: 0,
              explanation: "Стоимость 3 000 + 50g, «at most» — ≤.",
            },
            {
              kind: "input",
              prompt: "What is the greatest integer value of x that satisfies 3x + 4 ≤ 25?",
              answers: ["7"],
              explanation: "3x ≤ 21 → x ≤ 7. Наибольшее целое — 7.",
            },
            {
              kind: "choice",
              prompt: "y > 2x − 1\ny < −x + 5\n\nWhich point (x, y) is a solution to the system of inequalities?",
              options: ["(3, 4)", "(0, 0)", "(2, 4)", "(−1, 7)"],
              answer: 1,
              explanation:
                "(0, 0): 0 > −1 и 0 < 5 — верно. Для (3, 4): 4 > 5 — неверно. Для (2, 4): 4 < 3 — неверно. Для (−1, 7): 7 < 6 — неверно.",
            },
            {
              kind: "input",
              prompt:
                "A van can carry at most 900 kilograms. The driver weighs 80 kilograms, and each box weighs 25 kilograms. What is the maximum number of boxes the van can carry with the driver?",
              answers: ["32"],
              explanation: "80 + 25b ≤ 900 → 25b ≤ 820 → b ≤ 32,8. Коробок — целое число, максимум 32.",
            },
          ],
        },
      ],
    },

    // ------------------------------------------------------------------ 2 --
    {
      id: "advanced-math",
      title: "Advanced Math",
      subtitle: "Выражения, квадратные уравнения, нелинейные функции",
      lessons: [
        {
          id: "equivalent-expressions",
          title: "Equivalent expressions",
          summary: "Раскрыть скобки, разложить, упростить",
          minutes: 10,
          official: official("Advanced Math", "Equivalent expressions"),
          theory: [
            {
              heading: "Формулы, которые встречаются постоянно",
              body:
                "• (a + b)² = a² + 2ab + b²\n• (a − b)² = a² − 2ab + b²\n• a² − b² = (a − b)(a + b)\n• xᵃ · xᵇ = xᵃ⁺ᵇ, xᵃ / xᵇ = xᵃ⁻ᵇ, (xᵃ)ᵇ = xᵃᵇ",
            },
            {
              heading: "Приём проверки",
              body:
                "Если не видишь преобразование, подставь простое число (например, x = 2) в исходное выражение и в варианты. Совпадёт только правильный.",
            },
          ],
          questions: [
            {
              kind: "choice",
              prompt: "Which expression is equivalent to (2x + 3)(x − 4)?",
              options: ["2x² − 5x − 12", "2x² − 11x − 12", "2x² + 5x − 12", "2x² − 12"],
              answer: 0,
              explanation: "2x · x − 2x · 4 + 3x − 12 = 2x² − 8x + 3x − 12 = 2x² − 5x − 12.",
            },
            {
              kind: "choice",
              prompt: "Which expression is equivalent to x² − 9?",
              options: ["(x − 3)(x + 3)", "(x − 3)²", "(x − 9)(x + 1)", "(x + 3)²"],
              answer: 0,
              explanation: "Разность квадратов: x² − 3² = (x − 3)(x + 3).",
            },
            {
              kind: "choice",
              prompt: "Which expression is equivalent to (x⁵ · x³) / x², for x ≠ 0?",
              options: ["x⁴", "x⁶", "x⁸", "x¹³"],
              answer: 1,
              explanation: "x⁵ · x³ = x⁸, x⁸ / x² = x⁶.",
            },
            {
              kind: "input",
              prompt: "If 3x² + 12x = 3x(x + k) for all values of x, what is the value of k?",
              answers: ["4"],
              explanation: "3x(x + k) = 3x² + 3kx. Значит, 3k = 12, k = 4.",
            },
            {
              kind: "choice",
              prompt: "Which expression is equivalent to 1/x + 1/(x + 1), for x > 0?",
              options: ["(2x + 1) / (x(x + 1))", "2 / (2x + 1)", "1 / (x(x + 1))", "(x + 1) / (2x)"],
              answer: 0,
              explanation: "Общий знаменатель x(x + 1): (x + 1 + x) / (x(x + 1)) = (2x + 1) / (x(x + 1)).",
            },
          ],
        },
        {
          id: "nonlinear-equations",
          title: "Nonlinear equations and systems",
          summary: "Квадратные уравнения, корни, дискриминант",
          minutes: 12,
          official: official("Advanced Math", "Nonlinear equations in one variable and systems of equations in two variables"),
          theory: [
            {
              body:
                "Квадратное уравнение ax² + bx + c = 0 решают разложением на множители или по формуле x = (−b ± √D) / 2a, где **D = b² − 4ac**.",
            },
            {
              heading: "Дискриминант",
              body:
                "• D > 0 — два действительных корня.\n• D = 0 — один корень.\n• D < 0 — действительных корней нет.",
            },
            {
              heading: "Система «прямая + парабола»",
              body:
                "Приравняй правые части, перенеси всё в одну сторону и реши квадратное уравнение. Каждому корню соответствует точка пересечения.",
            },
          ],
          questions: [
            {
              kind: "choice",
              prompt: "What are the solutions to x² − 5x + 6 = 0?",
              options: ["2 and 3", "−2 and −3", "1 and 6", "−1 and 6"],
              answer: 0,
              explanation: "x² − 5x + 6 = (x − 2)(x − 3), корни 2 и 3.",
            },
            {
              kind: "input",
              prompt: "What is the positive solution to x² + 2x − 15 = 0?",
              answers: ["3"],
              explanation: "(x + 5)(x − 3) = 0, корни −5 и 3. Положительный — 3.",
            },
            {
              kind: "choice",
              prompt: "How many distinct real solutions does the equation 2x² − 4x + 5 = 0 have?",
              options: ["Zero", "Exactly one", "Exactly two", "Infinitely many"],
              answer: 0,
              explanation: "D = (−4)² − 4 · 2 · 5 = 16 − 40 = −24 < 0. Действительных решений нет.",
            },
            {
              kind: "choice",
              prompt:
                "y = x² − 4\ny = 2x − 1\n\nIf (x, y) is a solution to the system, which of the following could be the value of x?",
              options: ["−3", "−1", "1", "2"],
              answer: 1,
              explanation: "x² − 4 = 2x − 1 → x² − 2x − 3 = 0 → (x − 3)(x + 1) = 0. x = 3 или x = −1. Среди вариантов — −1.",
            },
            {
              kind: "input",
              prompt: "If √(x + 7) = 4, what is the value of x?",
              answers: ["9"],
              explanation: "Возведём в квадрат: x + 7 = 16, x = 9. Проверка: √16 = 4.",
            },
          ],
        },
        {
          id: "nonlinear-functions",
          title: "Nonlinear functions",
          summary: "Экспоненты, параболы, вершина",
          minutes: 12,
          official: official("Advanced Math", "Nonlinear functions"),
          theory: [
            {
              heading: "Экспоненциальный рост и спад",
              body:
                "f(t) = a · bᵗ. a — начальное значение. Рост на r% в год: b = 1 + r/100. Спад на r%: b = 1 − r/100. Удвоение каждые k часов: a · 2^(t/k).",
            },
            {
              heading: "Параболы",
              body:
                "• Вершинная форма f(x) = a(x − h)² + k: вершина (h, k). При a > 0 минимум равен k.\n• Разложенная форма f(x) = a(x − p)(x − q): нули в точках p и q.\n• Стандартная форма ax² + bx + c: c — пересечение с осью y.",
            },
          ],
          questions: [
            {
              kind: "choice",
              prompt:
                "A population of bacteria starts at 500 and doubles every 3 hours. Which function gives the population P after t hours?",
              options: ["P = 500 · 2^(t/3)", "P = 500 · 2^(3t)", "P = 500 · 3^(t/2)", "P = 500 + 2t/3"],
              answer: 0,
              explanation: "Каждые 3 часа умножаем на 2. За t часов прошло t/3 удвоений: 500 · 2^(t/3).",
            },
            {
              kind: "choice",
              prompt: "The function f is defined by f(x) = (x − 2)² + 5. What is the minimum value of f(x)?",
              options: ["−2", "2", "5", "9"],
              answer: 2,
              explanation: "(x − 2)² ≥ 0, наименьшее значение 0 при x = 2. Тогда минимум f = 5.",
            },
            {
              kind: "input",
              prompt: "The function f is defined by f(x) = 3x² − 2x + 1. What is the value of f(−2)?",
              answers: ["17"],
              explanation: "3 · 4 − 2 · (−2) + 1 = 12 + 4 + 1 = 17.",
            },
            {
              kind: "choice",
              prompt:
                "A car is worth 8,000,000 tenge, and its value decreases by 12% each year. Which expression gives the car's value, in tenge, after t years?",
              options: ["8,000,000(0.88)ᵗ", "8,000,000(0.12)ᵗ", "8,000,000(1.12)ᵗ", "8,000,000 − 0.12t"],
              answer: 0,
              explanation: "Каждый год остаётся 100% − 12% = 88% стоимости, поэтому множитель 0,88.",
            },
            {
              kind: "choice",
              prompt: "At which points does the graph of y = x² − 6x + 8 intersect the x-axis?",
              options: ["(2, 0) and (4, 0)", "(−2, 0) and (−4, 0)", "(3, 0) only", "(0, 8) only"],
              answer: 0,
              explanation: "x² − 6x + 8 = (x − 2)(x − 4) = 0, x = 2 или x = 4.",
            },
          ],
        },
      ],
    },

    // ------------------------------------------------------------------ 3 --
    {
      id: "problem-solving-data",
      title: "Problem-Solving and Data Analysis",
      subtitle: "Пропорции, проценты, статистика и вероятность",
      lessons: [
        {
          id: "ratios-rates",
          title: "Ratios, rates, proportions, and units",
          summary: "Пропорции, скорости, перевод единиц",
          minutes: 10,
          official: official("Problem-Solving and Data Analysis", "Ratios, rates, proportional relationships, and units"),
          theory: [
            {
              body:
                "Почти любая такая задача решается пропорцией: a / b = c / x. Главное — следить, чтобы **единицы стояли на одних и тех же местах** в обеих дробях.",
            },
            {
              heading: "Перевод единиц",
              body:
                "Умножай на дробь, равную 1: 150 см × (1 дюйм / 2,54 см). Ненужные единицы сокращаются. Минуты ↔ секунды, часы ↔ минуты — частые ловушки.",
            },
          ],
          questions: [
            {
              kind: "input",
              prompt:
                "A recipe uses 3 cups of flour for every 2 cups of milk. How many cups of milk are needed for 12 cups of flour?",
              answers: ["8"],
              explanation: "3/2 = 12/x → x = 12 · 2 / 3 = 8.",
            },
            {
              kind: "choice",
              prompt: "A car travels 240 kilometers in 3 hours at a constant speed. At this speed, how far will it travel in 5 hours?",
              options: ["360 km", "400 km", "420 km", "480 km"],
              answer: 1,
              explanation: "Скорость 80 км/ч, за 5 часов — 400 км.",
            },
            {
              kind: "choice",
              prompt: "One inch is equal to 2.54 centimeters. A table is 150 centimeters long. Which is closest to the table's length in inches?",
              options: ["38", "59", "147", "381"],
              answer: 1,
              explanation: "150 / 2,54 ≈ 59,1.",
            },
            {
              kind: "input",
              prompt: "A printer prints 18 pages per minute. How many seconds does it take to print 45 pages?",
              answers: ["150"],
              explanation: "45 / 18 = 2,5 минуты = 150 секунд.",
            },
            {
              kind: "choice",
              prompt: "On a map, 2 centimeters represent 15 kilometers. Two cities are 9 centimeters apart on the map. What is the actual distance between them?",
              options: ["30 km", "60 km", "67.5 km", "135 km"],
              answer: 2,
              explanation: "9 / 2 · 15 = 67,5 км.",
            },
          ],
        },
        {
          id: "percentages",
          title: "Percentages",
          summary: "Скидки, рост, процент от процента",
          minutes: 10,
          official: official("Problem-Solving and Data Analysis", "Percentages"),
          theory: [
            {
              body:
                "• p% от числа N = N · p/100.\n• Увеличение на p%: умножить на (1 + p/100). Уменьшение: на (1 − p/100).\n• Несколько изменений подряд **перемножаются**, а не складываются: −25%, потом +10% = × 0,75 × 1,10.\n• Процент изменения = (новое − старое) / старое × 100%.",
            },
            {
              heading: "Обратная задача",
              body:
                "Если после роста на 20% цена стала 3 600, исходная цена — 3 600 / 1,2 = 3 000, а не 3 600 − 20%.",
            },
          ],
          questions: [
            {
              kind: "input",
              prompt: "What is 35% of 240?",
              answers: ["84"],
              explanation: "240 · 0,35 = 84.",
            },
            {
              kind: "choice",
              prompt:
                "A jacket costs 20,000 tenge. It is discounted by 25%, and then a 10% tax is added to the discounted price. What is the final price?",
              options: ["16,000 tenge", "16,500 tenge", "17,000 tenge", "13,500 tenge"],
              answer: 1,
              explanation: "20 000 · 0,75 = 15 000; 15 000 · 1,10 = 16 500.",
            },
            {
              kind: "choice",
              prompt: "A town's population grew from 40,000 to 46,000. By what percent did the population increase?",
              options: ["6%", "13%", "15%", "87%"],
              answer: 2,
              explanation: "(46 000 − 40 000) / 40 000 = 6 000 / 40 000 = 0,15 = 15%.",
            },
            {
              kind: "input",
              prompt: "After a 20% increase, the price of a book is 3,600 tenge. What was the price, in tenge, before the increase?",
              answers: ["3000"],
              explanation: "Исходная цена × 1,2 = 3 600, значит, исходная цена = 3 000.",
            },
            {
              kind: "choice",
              prompt: "If p is 150% of q, then q is what percent of p?",
              options: ["50%", "66⅔%", "75%", "150%"],
              answer: 1,
              explanation: "p = 1,5q → q = p / 1,5 = (2/3)p ≈ 66,7%.",
            },
          ],
        },
        {
          id: "one-variable-data",
          title: "One-variable data",
          summary: "Среднее, медиана, разброс",
          minutes: 10,
          official: official("Problem-Solving and Data Analysis", "One-variable data: distributions and measures of center and spread"),
          theory: [
            {
              body:
                "• **Среднее** = сумма / количество.\n• **Медиана** — середина упорядоченного списка. При чётном числе значений — среднее двух центральных.\n• **Мода** — самое частое значение.\n• **Стандартное отклонение** и **размах** показывают разброс: чем больше, тем данные сильнее «размазаны».",
            },
            {
              heading: "Выбросы",
              body:
                "Одно очень большое или маленькое значение сильно сдвигает среднее, а медиану — почти нет. Это любимый вопрос SAT.",
            },
          ],
          questions: [
            {
              kind: "input",
              prompt: "What is the mean of the data set 4, 7, 7, 9, 13?",
              answers: ["8"],
              explanation: "(4 + 7 + 7 + 9 + 13) / 5 = 40 / 5 = 8.",
            },
            {
              kind: "choice",
              prompt: "What is the median of the data set 12, 3, 8, 15, 6, 10?",
              options: ["8", "9", "9.5", "10"],
              answer: 1,
              explanation: "Упорядочим: 3, 6, 8, 10, 12, 15. Медиана = (8 + 10) / 2 = 9.",
            },
            {
              kind: "choice",
              prompt: "A data set of 10 values has a mean of 20. If the value 42 is added to the data set, what is the mean of the new data set?",
              options: ["21", "22", "31", "42"],
              answer: 1,
              explanation: "Сумма была 200, стала 242. Значений 11: 242 / 11 = 22.",
            },
            {
              kind: "choice",
              prompt:
                "Two classes took the same test. The scores in Class A have a standard deviation of 4 points, and the scores in Class B have a standard deviation of 11 points. Which statement must be true?",
              options: [
                "Class B's scores are more spread out than Class A's scores.",
                "Class B has a higher mean score than Class A.",
                "Class A has a higher median score than Class B.",
                "Both classes have the same range of scores.",
              ],
              answer: 0,
              explanation: "Стандартное отклонение — мера разброса. О среднем и медиане оно ничего не говорит.",
            },
            {
              kind: "choice",
              prompt:
                "The data set 5, 6, 6, 7, 8, 40 contains one unusually large value. If 40 is removed, which measure will change the most?",
              options: ["The mean", "The median", "The mode", "None of them will change"],
              answer: 0,
              explanation: "Среднее: 12 → 6,4. Медиана: 6,5 → 6. Мода остаётся 6. Сильнее всего меняется среднее.",
            },
          ],
        },
        {
          id: "two-variable-data",
          title: "Two-variable data",
          summary: "Диаграммы рассеяния и линии тренда",
          minutes: 10,
          official: official("Problem-Solving and Data Analysis", "Two-variable data: models and scatterplots"),
          theory: [
            {
              body:
                "Линия тренда y = mx + b описывает данные приближённо. **Наклон m** — на сколько в среднем меняется y при росте x на 1. **b** — прогноз при x = 0.",
            },
            {
              heading: "Ещё",
              body:
                "• Положительная связь: x растёт, y растёт. Отрицательная: x растёт, y падает.\n• **Остаток** (residual) = фактическое значение − предсказанное.\n• Экспоненциальная модель y = a · bˣ: при каждом росте x на 1 значение умножается на b.",
            },
          ],
          questions: [
            {
              kind: "choice",
              prompt:
                "A line of best fit for data on hours studied, h, and test score, s, is s = 4.5h + 52. What does 4.5 represent in this model?",
              options: [
                "The estimated increase in test score for each additional hour studied",
                "The estimated test score for a student who did not study",
                "The number of hours needed to score 52",
                "The maximum possible test score",
              ],
              answer: 0,
              explanation: "4,5 — наклон: каждый дополнительный час даёт в среднем +4,5 балла. 52 — прогноз при h = 0.",
            },
            {
              kind: "input",
              prompt: "Using the model s = 4.5h + 52, what is the predicted test score for a student who studies 6 hours?",
              answers: ["79"],
              explanation: "4,5 · 6 + 52 = 27 + 52 = 79.",
            },
            {
              kind: "choice",
              prompt:
                "A scatterplot shows that as the outside temperature increases, the number of hot drinks a café sells decreases. Which best describes the association?",
              options: ["Negative", "Positive", "No association", "Exponential growth"],
              answer: 0,
              explanation: "Одна величина растёт — другая падает: отрицательная связь.",
            },
            {
              kind: "choice",
              prompt: "The data are modeled by y = 200(1.05)ˣ. Which statement best describes the model?",
              options: [
                "y increases by 5% each time x increases by 1.",
                "y increases by 5 each time x increases by 1.",
                "y decreases by 5% each time x increases by 1.",
                "y increases by 105 each time x increases by 1.",
              ],
              answer: 0,
              explanation: "Множитель 1,05 = рост на 5% за каждую единицу x.",
            },
            {
              kind: "choice",
              prompt:
                "A line of best fit predicts a value of 120 when x = 10. The actual data point at x = 10 has a value of 112. What is the residual for this data point?",
              options: ["−8", "8", "112", "232"],
              answer: 0,
              explanation: "Остаток = факт − прогноз = 112 − 120 = −8. Точка лежит ниже линии.",
            },
          ],
        },
        {
          id: "probability",
          title: "Probability and conditional probability",
          summary: "Вероятность и таблицы сопряжённости",
          minutes: 10,
          official: official("Problem-Solving and Data Analysis", "Probability and conditional probability"),
          theory: [
            {
              body:
                "Вероятность = подходящие исходы / все исходы. Для независимых событий вероятности перемножаются.",
            },
            {
              heading: "Условная вероятность",
              body:
                "В таблицах главное — **«given», «of those who…», «if a student who … is chosen»**. Эти слова сужают знаменатель: делишь не на всех, а только на указанную группу.",
            },
          ],
          questions: [
            {
              kind: "choice",
              prompt: "A bag contains 5 red, 3 blue, and 2 green marbles. If one marble is chosen at random, what is the probability that it is blue?",
              options: ["1/3", "3/10", "3/7", "1/5"],
              answer: 1,
              explanation: "Всего 10 шариков, синих 3: 3/10.",
            },
            {
              kind: "choice",
              table: {
                caption: "Survey of 200 students",
                head: ["", "Plays a sport", "Does not play", "Total"],
                rows: [
                  ["Grade 10", "45", "55", "100"],
                  ["Grade 11", "60", "40", "100"],
                  ["Total", "105", "95", "200"],
                ],
              },
              prompt: "If a student who plays a sport is chosen at random, what is the probability that the student is in grade 11?",
              options: ["3/10", "3/5", "4/7", "2/5"],
              answer: 2,
              explanation: "Знаменатель — только те, кто занимается спортом: 105. Из них 11-классников 60. 60/105 = 4/7.",
            },
            {
              kind: "choice",
              prompt: "A fair coin is tossed twice. What is the probability that it lands on heads both times?",
              options: ["1/2", "1/3", "1/4", "1/8"],
              answer: 2,
              explanation: "1/2 · 1/2 = 1/4.",
            },
            {
              kind: "input",
              table: {
                caption: "Survey of 200 students",
                head: ["", "Plays a sport", "Does not play", "Total"],
                rows: [
                  ["Grade 10", "45", "55", "100"],
                  ["Grade 11", "60", "40", "100"],
                  ["Total", "105", "95", "200"],
                ],
              },
              prompt:
                "If a grade 10 student is chosen at random, what is the probability that the student does not play a sport? Enter your answer as a decimal or a fraction.",
              answers: ["0.55", "11/20"],
              explanation: "Среди 100 десятиклассников спортом не занимаются 55: 55/100 = 0,55.",
            },
            {
              kind: "choice",
              prompt: "A spinner has 8 equal sections numbered 1 through 8. What is the probability of spinning a number greater than 5?",
              options: ["3/8", "5/8", "1/2", "3/5"],
              answer: 0,
              explanation: "Подходят 6, 7, 8 — три из восьми: 3/8.",
            },
          ],
        },
        {
          id: "sample-statistics",
          title: "Inference from sample statistics",
          summary: "Выборка, оценка и погрешность",
          minutes: 10,
          official: official("Problem-Solving and Data Analysis", "Inference from sample statistics and margin of error"),
          theory: [
            {
              body:
                "По **случайной** выборке можно оценить всю совокупность. Погрешность (margin of error) задаёт интервал: 58% ± 4% значит, что настоящее значение, скорее всего, между 54% и 62%.",
            },
            {
              heading: "Что важно",
              body:
                "• Больше случайная выборка — меньше погрешность.\n• Неслучайная выборка (только посетители спортзала, только добровольцы) не позволяет обобщать на всех.\n• Оценка для всей совокупности = доля в выборке × размер совокупности.",
            },
          ],
          questions: [
            {
              kind: "choice",
              prompt:
                "In a random sample of 400 voters in a city, 58% support a new park proposal. The margin of error is 4 percentage points. Which conclusion is most appropriate?",
              options: [
                "The percentage of all voters in the city who support the proposal is likely between 54% and 62%.",
                "Exactly 58% of all voters in the city support the proposal.",
                "At least 62% of all voters in the city support the proposal.",
                "The sample is too small to draw any conclusion.",
              ],
              answer: 0,
              explanation: "58 ± 4 → интервал от 54% до 62%. «Exactly» — слишком сильно.",
            },
            {
              kind: "choice",
              prompt: "A researcher wants to reduce the margin of error of a survey. Which change would most likely do this?",
              options: [
                "Increasing the size of the random sample",
                "Surveying people from only one neighborhood",
                "Decreasing the size of the sample",
                "Asking only people who volunteer to respond",
              ],
              answer: 0,
              explanation: "Погрешность уменьшается с ростом случайной выборки. Остальные варианты делают выборку менее представительной.",
            },
            {
              kind: "input",
              prompt:
                "A school with 1,200 students randomly selects 80 students, and 30 of them say they bike to school. Based on this sample, how many students at the school are expected to bike to school?",
              answers: ["450"],
              explanation: "30/80 = 0,375; 0,375 · 1 200 = 450.",
            },
            {
              kind: "choice",
              prompt:
                "Researchers surveyed people leaving a gym about how often they exercise. Why can't the results be generalized to all residents of the city?",
              options: [
                "The sample was not selected at random from all residents.",
                "The sample was too large.",
                "Exercise habits cannot be measured.",
                "The researchers asked too many questions.",
              ],
              answer: 0,
              explanation: "Посетители спортзала занимаются чаще остальных. Выборка не представляет всех жителей.",
            },
            {
              kind: "choice",
              prompt:
                "Two random samples estimate the same percentage. Sample A has 100 people and a margin of error of 9%. Sample B has 900 people and a margin of error of 3%. Which statement is true?",
              options: [
                "Sample B's estimate is likely to be more precise.",
                "Sample A's estimate is likely to be more precise.",
                "Both estimates are equally precise.",
                "Neither sample can be used to estimate the percentage.",
              ],
              answer: 0,
              explanation: "Меньшая погрешность = более точная оценка. У выборки B она 3% против 9%.",
            },
          ],
        },
        {
          id: "statistical-claims",
          title: "Evaluating statistical claims",
          summary: "Эксперимент или наблюдение: что можно утверждать",
          minutes: 10,
          official: official("Problem-Solving and Data Analysis", "Evaluating statistical claims: observational studies and experiments"),
          theory: [
            {
              body: "Два вопроса, которые нужно задать к любому исследованию.",
            },
            {
              heading: "1. Можно ли говорить о причине?",
              body:
                "Только если участников **случайно распределили** по группам (эксперимент). В наблюдательном исследовании можно говорить лишь о **связи**.",
            },
            {
              heading: "2. На кого можно обобщать?",
              body:
                "Только на ту совокупность, из которой участников **случайно выбрали**. Добровольцы — это не случайная выборка из всех людей.",
            },
          ],
          questions: [
            {
              kind: "choice",
              prompt:
                "Researchers randomly assigned 300 adult volunteers to drink either green tea or water every day for three months. The tea group had lower average blood pressure at the end. Which conclusion is best supported?",
              options: [
                "Drinking green tea likely caused lower blood pressure among people similar to the volunteers.",
                "Drinking green tea lowers blood pressure for everyone in the world.",
                "Blood pressure is not affected by what people drink.",
                "Green tea is associated with lower blood pressure, but no cause can be inferred.",
              ],
              answer: 0,
              explanation:
                "Случайное распределение по группам позволяет говорить о причине. Но участники — добровольцы, поэтому обобщать можно только на похожих людей, а не на всех (B).",
            },
            {
              kind: "choice",
              prompt:
                "An observational study found that people who own dogs are less likely to report high stress levels than people who do not. Which conclusion is appropriate?",
              options: [
                "Dog ownership is associated with lower reported stress, but the study does not show that owning a dog reduces stress.",
                "Owning a dog reduces stress.",
                "Stress causes people to avoid owning dogs.",
                "Dog ownership has no relationship to stress.",
              ],
              answer: 0,
              explanation: "Наблюдение показывает только связь. Причинный вывод (B и C) сделать нельзя.",
            },
            {
              kind: "choice",
              prompt: "Which study design allows researchers to draw a conclusion about cause and effect?",
              options: [
                "Randomly assigning participants to a treatment group or a control group",
                "Surveying a large random sample about their habits",
                "Observing participants without changing anything",
                "Asking volunteers to report on themselves",
              ],
              answer: 0,
              explanation: "Причину показывает только случайное распределение в группы — эксперимент.",
            },
            {
              kind: "choice",
              prompt:
                "A company randomly selected 500 of its customers and found that 70% were satisfied with its service. To which group can this result be generalized?",
              options: [
                "All of the company's customers",
                "All people in the country",
                "Only the 500 customers surveyed",
                "No one, because the sample is too small",
              ],
              answer: 0,
              explanation: "Выборку случайно взяли из клиентов компании — на них и можно обобщать.",
            },
            {
              kind: "choice",
              prompt:
                "A study found that students who eat breakfast every day tend to earn higher grades. Which of the following is a possible confounding variable?",
              options: [
                "Family income, which could affect both breakfast habits and grades",
                "The number of students in the study",
                "The day of the week the study ended",
                "The color of the students' notebooks",
              ],
              answer: 0,
              explanation: "Смешивающий фактор влияет и на «причину», и на «следствие». Доход семьи может влиять и на завтраки, и на оценки.",
            },
          ],
        },
      ],
    },

    // ------------------------------------------------------------------ 4 --
    {
      id: "geometry-trigonometry",
      title: "Geometry and Trigonometry",
      subtitle: "Площади, углы, треугольники, окружности",
      lessons: [
        {
          id: "area-volume",
          title: "Area and volume",
          summary: "Площади, объёмы и масштаб",
          minutes: 10,
          official: official("Geometry and Trigonometry", "Area and volume"),
          theory: [
            {
              body:
                "Справочник формул на SAT даётся, но тратить время на поиск не стоит. Главное — помнить, как **масштаб** влияет на площадь и объём.",
            },
            {
              heading: "Масштаб",
              body:
                "Если все длины умножить на k, площадь умножится на k², а объём — на k³. Сторону квадрата утроили — площадь выросла в 9 раз.",
            },
            {
              heading: "Формулы",
              body:
                "• Прямоугольник: S = a · b, периметр P = 2(a + b).\n• Треугольник: S = ½ · основание · высота.\n• Цилиндр: V = πr²h. Куб: V = a³, поверхность 6a².",
            },
          ],
          questions: [
            {
              kind: "input",
              prompt: "A rectangle has a perimeter of 34 and a length of 12. What is the area of the rectangle?",
              answers: ["60"],
              explanation: "2(12 + w) = 34 → w = 5. Площадь 12 · 5 = 60.",
            },
            {
              kind: "choice",
              prompt: "A right circular cylinder has a radius of 3 and a height of 10. What is its volume?",
              options: ["30π", "60π", "90π", "900π"],
              answer: 2,
              explanation: "V = π · 3² · 10 = 90π.",
            },
            {
              kind: "choice",
              prompt: "A cube has a volume of 64 cubic centimeters. What is its total surface area, in square centimeters?",
              options: ["16", "64", "96", "384"],
              answer: 2,
              explanation: "Ребро 4 (4³ = 64). Поверхность 6 · 4² = 96.",
            },
            {
              kind: "input",
              prompt: "A triangle has a base of 10 and a height of 7. What is its area?",
              answers: ["35"],
              explanation: "½ · 10 · 7 = 35.",
            },
            {
              kind: "choice",
              prompt: "If the length of each side of a square is tripled, the area of the square is multiplied by what factor?",
              options: ["3", "6", "9", "27"],
              answer: 2,
              explanation: "Площадь масштабируется как k²: 3² = 9.",
            },
          ],
        },
        {
          id: "lines-angles-triangles",
          title: "Lines, angles, and triangles",
          summary: "Углы, параллельные прямые, подобие",
          minutes: 10,
          official: official("Geometry and Trigonometry", "Lines, angles, and triangles"),
          theory: [
            {
              body:
                "• Сумма углов треугольника — 180°.\n• Смежные углы в сумме дают 180°, вертикальные равны.\n• При пересечении параллельных прямых секущей углы либо **равны**, либо **в сумме 180°**.\n• В равнобедренном треугольнике углы при основании равны.\n• У подобных треугольников стороны пропорциональны: AB / DE = BC / EF.",
            },
          ],
          questions: [
            {
              kind: "input",
              prompt: "Two angles of a triangle measure 48° and 67°. What is the measure, in degrees, of the third angle?",
              answers: ["65"],
              explanation: "180 − 48 − 67 = 65.",
            },
            {
              kind: "choice",
              prompt:
                "Two parallel lines are intersected by a transversal. One of the angles formed measures 115°. Which of the following could be the measure of another angle formed?",
              options: ["25°", "55°", "65°", "75°"],
              answer: 2,
              explanation: "Все углы здесь либо 115°, либо 180° − 115° = 65°.",
            },
            {
              kind: "choice",
              prompt: "Triangle ABC is similar to triangle DEF, with A corresponding to D and B corresponding to E. If AB = 6, DE = 9, and BC = 8, what is EF?",
              options: ["10", "11", "12", "13.5"],
              answer: 2,
              explanation: "Коэффициент подобия 9/6 = 1,5. EF = 8 · 1,5 = 12.",
            },
            {
              kind: "choice",
              prompt: "The vertex angle of an isosceles triangle measures 40°. What is the measure of each base angle?",
              options: ["40°", "70°", "80°", "140°"],
              answer: 1,
              explanation: "(180 − 40) / 2 = 70.",
            },
            {
              kind: "input",
              prompt: "Two vertical angles measure (3x + 10)° and (5x − 20)°. What is the value of x?",
              answers: ["15"],
              explanation: "Вертикальные углы равны: 3x + 10 = 5x − 20 → 2x = 30 → x = 15.",
            },
          ],
        },
        {
          id: "right-triangles",
          title: "Right triangles and trigonometry",
          summary: "Пифагор, особые треугольники, синус и косинус",
          minutes: 12,
          official: official("Geometry and Trigonometry", "Right triangles and trigonometry"),
          theory: [
            {
              body:
                "• Теорема Пифагора: a² + b² = c².\n• Тройки, которые стоит узнавать сразу: 3-4-5, 5-12-13, 8-15-17 и их кратные (6-8-10).\n• 45-45-90: катеты x, гипотенуза x√2.\n• 30-60-90: стороны x, x√3, 2x.",
            },
            {
              heading: "Тригонометрия",
              body:
                "sin = противолежащий / гипотенуза, cos = прилежащий / гипотенуза, tan = противолежащий / прилежащий. В прямоугольном треугольнике **sin A = cos B**, если A и B — два острых угла.",
            },
          ],
          questions: [
            {
              kind: "input",
              prompt: "A right triangle has legs of length 6 and 8. What is the length of the hypotenuse?",
              answers: ["10"],
              explanation: "√(36 + 64) = √100 = 10.",
            },
            {
              kind: "choice",
              prompt: "In right triangle ABC, angle C is the right angle and sin A = 3/5. What is cos B?",
              options: ["3/5", "4/5", "3/4", "5/3"],
              answer: 0,
              explanation: "A и B — острые углы прямоугольного треугольника, поэтому cos B = sin A = 3/5.",
            },
            {
              kind: "choice",
              prompt: "Each leg of a 45°-45°-90° triangle has length 7. What is the length of the hypotenuse?",
              options: ["7", "7√2", "7√3", "14"],
              answer: 1,
              explanation: "Гипотенуза = катет · √2.",
            },
            {
              kind: "choice",
              prompt: "The shortest side of a 30°-60°-90° triangle has length 5. What is the length of the hypotenuse?",
              options: ["5√3", "10", "10√3", "15"],
              answer: 1,
              explanation: "Гипотенуза вдвое длиннее меньшего катета: 10.",
            },
            {
              kind: "input",
              prompt:
                "A 13-meter ladder leans against a vertical wall. The base of the ladder is 5 meters from the wall. How many meters up the wall does the ladder reach?",
              answers: ["12"],
              explanation: "√(13² − 5²) = √(169 − 25) = √144 = 12. Тройка 5-12-13.",
            },
          ],
        },
        {
          id: "circles",
          title: "Circles",
          summary: "Длина дуги, площадь сектора, уравнение окружности",
          minutes: 12,
          official: official("Geometry and Trigonometry", "Circles"),
          theory: [
            {
              body:
                "• Длина окружности 2πr, площадь πr².\n• Дуга и сектор — доля круга: угол / 360°.\n• Уравнение окружности: (x − h)² + (y − k)² = r², центр (h, k).",
            },
            {
              heading: "Выделение полного квадрата",
              body:
                "x² + y² − 6x + 4y − 12 = 0 → (x² − 6x + 9) + (y² + 4y + 4) = 12 + 9 + 4 → (x − 3)² + (y + 2)² = 25. Центр (3, −2), радиус 5.",
            },
          ],
          questions: [
            {
              kind: "choice",
              prompt: "A circle has a radius of 6. What is its circumference?",
              options: ["6π", "12π", "36π", "72π"],
              answer: 1,
              explanation: "2π · 6 = 12π.",
            },
            {
              kind: "choice",
              prompt: "What is the radius of the circle with equation x² + y² − 6x + 4y − 12 = 0?",
              options: ["5", "12", "25", "√12"],
              answer: 0,
              explanation: "(x − 3)² + (y + 2)² = 25, r = 5.",
            },
            {
              kind: "choice",
              prompt: "In a circle with radius 8, a central angle measures 90°. What is the length of the arc it intercepts?",
              options: ["2π", "4π", "8π", "16π"],
              answer: 1,
              explanation: "90/360 · 2π · 8 = 1/4 · 16π = 4π.",
            },
            {
              kind: "choice",
              prompt: "What are the center and radius of the circle (x + 1)² + (y − 4)² = 49?",
              options: ["Center (−1, 4), radius 7", "Center (1, −4), radius 7", "Center (−1, 4), radius 49", "Center (1, 4), radius 7"],
              answer: 0,
              explanation: "(x − (−1))² + (y − 4)² = 7². Центр (−1, 4), радиус 7.",
            },
            {
              kind: "choice",
              prompt: "A circle has a radius of 10. What is the area of a sector with a central angle of 72°?",
              options: ["10π", "20π", "40π", "72π"],
              answer: 1,
              explanation: "72/360 = 1/5. 1/5 · π · 100 = 20π.",
            },
          ],
        },
      ],
    },
  ],
};
