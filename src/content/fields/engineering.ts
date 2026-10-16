import { makeText, TFNG, type FieldMeta } from "./make";

export const ENGINEERING: FieldMeta = {
  id: "engineering",
  title: "Инженерия",
  short: "Инженерия",
  intro: "Тексты о том, как инженеры решают задачи: мосты и здания, энергия, материалы, управление. Обрати внимание на язык причин и следствий — он главный в технических текстах.",
};

export const ENGINEERING_TEXTS = [
  makeText(ENGINEERING, 1, "Arches and suspension bridges",
    `Every bridge must carry its own weight and the weight of the traffic on it. Engineers describe the forces involved as compression, which pushes material together, and tension, which pulls it apart. Stone and concrete resist compression very well but crack easily under tension.

This is why the arch has been used for thousands of years: its curved shape turns the load into compression, which travels down to the supports at each end. Suspension bridges work the other way around. Their deck hangs from steel cables that are under tension, and the cables pass over tall towers to anchors on land. Because steel is strong in tension, suspension bridges can span much longer distances than arches.`,
    [
      ["What is the difference between compression and tension?", ["Compression pushes material together; tension pulls it apart", "Compression affects only steel; tension affects only stone", "They are two names for the same force", "Tension pushes; compression pulls"], 0, "Определения даны в первом абзаце."],
      ["Why has the arch been used for so long?", ["Its shape turns the load into compression", "It needs no supports", "It is made of steel cables", "It works best under tension"], 0, "Арка превращает нагрузку в сжатие, которое камень хорошо выдерживает."],
      ["In a suspension bridge, the cables are mainly under", ["tension", "compression", "no force at all", "heat"], 0, "«steel cables that are under tension»."],
      ["Why can suspension bridges span longer distances than arches?", ["Steel is strong in tension", "Stone is lighter than steel", "They have no towers", "Traffic is lighter on them"], 0, "Последнее предложение прямо даёт причину."],
      ["True, False or Not Given: Concrete resists tension better than compression.", TFNG, 1, "Наоборот: камень и бетон хорошо держат сжатие и трескаются при растяжении."],
    ]),

  makeText(ENGINEERING, 2, "Reinforced concrete",
    `Concrete is the most widely used construction material in the world. It is cheap, can be poured into almost any shape, and becomes very strong in compression as it hardens. Its weakness is tension: a concrete beam that bends will crack on the side that is being stretched.

Engineers solve this by placing steel bars, known as rebar, inside the concrete before it sets. The steel carries the tension while the concrete carries the compression, and the two materials expand and contract by similar amounts when the temperature changes, so they stay bonded together. Reinforced concrete made modern high-rise buildings, dams and motorway bridges possible.`,
    [
      ["What is the main weakness of plain concrete?", ["It is weak in tension", "It is expensive", "It cannot be shaped", "It is weak in compression"], 0, "«Its weakness is tension»."],
      ["What job does the steel rebar do?", ["It carries the tension", "It makes concrete set faster", "It reduces the cost", "It replaces the concrete"], 0, "«The steel carries the tension while the concrete carries the compression»."],
      ["Why do steel and concrete stay bonded when temperature changes?", ["They expand and contract by similar amounts", "Steel does not expand at all", "Concrete melts slightly", "They are glued together"], 0, "Похожее тепловое расширение — ключевая причина."],
      ["Where does a bending concrete beam crack, according to the text?", ["On the side being stretched", "On the side being pushed together", "In the middle only", "At the supports only"], 0, "«will crack on the side that is being stretched»."],
      ["True, False or Not Given: Reinforced concrete was invented in the twentieth century.", TFNG, 2, "Дата изобретения в тексте не указана."],
    ]),

  makeText(ENGINEERING, 3, "How a wind turbine produces electricity",
    `A wind turbine turns the kinetic energy of moving air into electricity. Wind flowing over the blades creates a force that makes the rotor spin. The rotor turns a shaft connected, often through a gearbox, to a generator, which converts the rotation into electrical energy.

The power available in the wind rises very quickly with wind speed: doubling the wind speed increases the available power about eight times. This is why turbines are placed on hills, at sea or on tall towers, where winds are stronger and steadier. In very strong winds, however, turbines turn their blades or stop completely to avoid damage, so they do not produce power in every weather.`,
    [
      ["What does a wind turbine convert into electricity?", ["The kinetic energy of moving air", "Heat from the sun", "Chemical energy", "Water pressure"], 0, "Первое предложение текста."],
      ["What does the generator do?", ["Converts rotation into electrical energy", "Makes the blades spin", "Stores electricity", "Measures wind speed"], 0, "«a generator, which converts the rotation into electrical energy»."],
      ["If wind speed doubles, the available power increases about", ["eight times", "two times", "four times", "sixteen times"], 0, "Мощность пропорциональна кубу скорости: 2³ = 8."],
      ["Why are turbines often placed at sea or on tall towers?", ["Winds there are stronger and steadier", "Land is too expensive", "Turbines need water to cool", "Birds avoid those places"], 0, "«where winds are stronger and steadier»."],
      ["True, False or Not Given: Wind turbines produce the most power in extremely strong storms.", TFNG, 1, "В очень сильный ветер турбины останавливаются, чтобы не повредиться."],
    ]),

  makeText(ENGINEERING, 4, "Inside a lithium-ion battery",
    `Lithium-ion batteries power phones, laptops and most electric cars. Each cell has two electrodes, an anode and a cathode, separated by a thin material that lets lithium ions pass through but blocks electrons. When the battery is in use, lithium ions move from the anode to the cathode through the battery, while electrons travel through the external circuit, powering the device.

Charging pushes the ions back to the anode, storing energy for later use. Over hundreds of cycles, small chemical changes slowly reduce how much charge the battery can hold. Heat speeds up this ageing, which is why manufacturers warn against leaving devices in hot cars and why electric vehicles include systems to keep their batteries cool.`,
    [
      ["What is the role of the separator between the electrodes?", ["It lets ions pass but blocks electrons", "It produces lithium", "It cools the battery", "It stores the electrons"], 0, "«lets lithium ions pass through but blocks electrons»."],
      ["When a device is being used, electrons travel", ["through the external circuit", "through the separator", "from the cathode to the anode inside the cell", "nowhere"], 0, "Электроны идут по внешней цепи и питают устройство."],
      ["What happens during charging?", ["Ions are pushed back to the anode", "Electrons are destroyed", "The cathode is replaced", "The battery cools down"], 0, "«Charging pushes the ions back to the anode»."],
      ["Why do electric vehicles include cooling systems?", ["Heat speeds up battery ageing", "Cold batteries charge too fast", "Cooling increases the car's speed", "The law requires it"], 0, "«Heat speeds up this ageing»."],
      ["True, False or Not Given: A lithium-ion battery keeps its full capacity forever.", TFNG, 1, "Ёмкость медленно снижается за сотни циклов."],
    ]),

  makeText(ENGINEERING, 5, "Buildings that survive earthquakes",
    `Earthquakes are dangerous to buildings mainly because the ground moves sideways, shaking structures that were designed mostly to carry vertical loads. Engineers use several strategies to reduce the damage. One is to make buildings ductile, so that their frames can bend without breaking suddenly, giving people time to escape.

Another strategy, base isolation, places flexible bearings between a building and its foundation. During an earthquake, the bearings absorb much of the ground's movement, so the building above moves more slowly and gently. Tall towers may also contain dampers: heavy weights or fluid-filled devices that move against the swaying of the building and reduce its motion.`,
    [
      ["Why are earthquakes especially dangerous for buildings?", ["The ground moves sideways while buildings are designed mostly for vertical loads", "Buildings are too heavy", "Earthquakes cause fires only", "Foundations are too deep"], 0, "Первое предложение объясняет причину."],
      ["What does “ductile” mean in this context?", ["Able to bend without breaking suddenly", "Very heavy", "Completely rigid", "Made of glass"], 0, "Значение раскрыто дальше в предложении."],
      ["How does base isolation work?", ["Flexible bearings absorb much of the ground's movement", "The building is built underground", "The foundation is made stronger", "Weights are added to the roof"], 0, "Гибкие опоры между зданием и фундаментом."],
      ["What do dampers do?", ["Move against the building's swaying to reduce motion", "Measure earthquakes", "Hold up the roof", "Cool the building"], 0, "«move against the swaying of the building and reduce its motion»."],
      ["True, False or Not Given: Base isolation is used in every new building in the world.", TFNG, 2, "Масштаб применения в тексте не обсуждается."],
    ]),

  makeText(ENGINEERING, 6, "3D printing",
    `Traditional manufacturing often starts with a block of material and removes what is not needed, by cutting or drilling. 3D printing, also called additive manufacturing, works the opposite way: it builds an object layer by layer from a digital design, adding material only where it is required.

Because no special moulds or tools are needed, 3D printing is ideal for prototypes and for small numbers of customised parts, such as medical implants shaped for a particular patient. It can also produce complex internal shapes that are impossible to make by cutting. For mass production, however, traditional methods are usually still faster and cheaper per item.`,
    [
      ["How does 3D printing differ from traditional manufacturing?", ["It adds material layer by layer instead of removing it", "It always uses metal", "It requires special moulds", "It is always cheaper"], 0, "Аддитивное производство — добавление, а не удаление материала."],
      ["Why is 3D printing good for prototypes?", ["No special moulds or tools are needed", "It is faster for large quantities", "It uses no electricity", "Prototypes must be made of plastic"], 0, "«Because no special moulds or tools are needed»."],
      ["Which example of customisation is given?", ["Medical implants shaped for a patient", "Cars painted in different colours", "Clothes of different sizes", "Phones with custom software"], 0, "Импланты под конкретного пациента."],
      ["For mass production, traditional methods are usually", ["faster and cheaper per item", "impossible", "less accurate", "more expensive"], 0, "Последнее предложение."],
      ["True, False or Not Given: 3D printing can produce shapes that cutting cannot.", TFNG, 0, "«complex internal shapes that are impossible to make by cutting»."],
    ]),

  makeText(ENGINEERING, 7, "Making water safe to drink",
    `River and lake water usually contains soil particles, microorganisms and other impurities. Water treatment plants clean it in several stages. First, chemicals called coagulants are added, causing tiny particles to stick together into larger clumps. These clumps are heavy enough to settle at the bottom of large tanks.

The water then passes through filters, often layers of sand and gravel, that remove most remaining particles. Finally, it is disinfected, commonly with chlorine or ultraviolet light, to kill harmful microorganisms. A small amount of chlorine is often left in the water so that it stays protected as it travels through pipes to homes.`,
    [
      ["What do coagulants do?", ["Make small particles stick together", "Kill bacteria", "Add minerals", "Cool the water"], 0, "«causing tiny particles to stick together into larger clumps»."],
      ["What happens to the clumps?", ["They settle at the bottom of tanks", "They are filtered by chlorine", "They float to the top", "They are sold"], 0, "Они достаточно тяжёлые, чтобы осесть."],
      ["Which step kills harmful microorganisms?", ["Disinfection", "Coagulation", "Settling", "Filtration through gravel"], 0, "Дезинфекция хлором или ультрафиолетом."],
      ["Why is some chlorine left in the water?", ["To protect it while it travels through pipes", "To improve its taste", "To make it settle faster", "To remove sand"], 0, "Последнее предложение."],
      ["True, False or Not Given: Every treatment plant uses ultraviolet light.", TFNG, 1, "Текст говорит «commonly with chlorine or ultraviolet light» — не каждая станция использует УФ."],
    ]),

  makeText(ENGINEERING, 8, "Feedback control",
    `A home thermostat is a simple example of a feedback control system. A sensor measures the room temperature and sends it to a controller, which compares it with the desired temperature. If the room is too cold, the controller switches the heater on; when the target is reached, it switches the heater off.

This is called negative feedback because the system acts to reduce the difference between the actual and desired values. The same principle keeps aircraft on course, cars at a set speed in cruise control, and chemical reactors at safe temperatures. Engineers must tune such systems carefully: a controller that reacts too strongly can overshoot the target and cause the system to swing back and forth.`,
    [
      ["What does the sensor do in a thermostat?", ["Measures the room temperature", "Switches the heater on", "Sets the desired temperature", "Heats the room"], 0, "Датчик измеряет температуру и передаёт контроллеру."],
      ["Why is it called negative feedback?", ["It reduces the difference between actual and desired values", "It always turns the heater off", "It gives bad results", "It works only in cold weather"], 0, "Определение во втором абзаце."],
      ["Which is NOT given as an example of feedback control?", ["A printed book", "Cruise control in cars", "Aircraft staying on course", "Chemical reactor temperature"], 0, "Книга не упоминается."],
      ["What can happen if a controller reacts too strongly?", ["It can overshoot and make the system swing back and forth", "It stops working completely", "It becomes cheaper", "It reduces the temperature permanently"], 0, "Последнее предложение."],
      ["True, False or Not Given: Thermostats were invented by aircraft engineers.", TFNG, 2, "Об изобретении термостатов текст ничего не говорит."],
    ]),

  makeText(ENGINEERING, 9, "How wings create lift",
    `An aircraft flies because its wings produce lift, an upward force greater than the plane's weight. A wing is shaped and angled so that it turns the oncoming air downwards. By pushing air down, the wing experiences an equal and opposite push upwards, in line with Newton's third law.

At the same time, air moves faster over the curved upper surface, and its pressure there is lower than below the wing. Both descriptions explain the same effect. Lift increases with speed and with the angle at which the wing meets the air, but only up to a point: if the angle becomes too steep, the airflow separates from the wing and lift drops suddenly, a dangerous situation known as a stall.`,
    [
      ["What is lift?", ["An upward force produced by the wings", "The weight of the plane", "The force of the engines", "Air resistance"], 0, "Определение в первом предложении."],
      ["Which law of Newton is mentioned?", ["The third law", "The first law", "The second law", "The law of gravity"], 0, "«in line with Newton's third law»."],
      ["Where is air pressure lower, according to the text?", ["Above the wing", "Below the wing", "In the engine", "Behind the tail"], 0, "Над крылом воздух движется быстрее и давление ниже."],
      ["What is a stall?", ["A sudden drop in lift when the angle is too steep", "A plane landing safely", "An engine failure", "Flying too fast"], 0, "Определение в конце текста."],
      ["What does the text say about the two descriptions of lift?", ["They explain the same effect", "Only the pressure explanation is correct", "Only Newton's explanation is correct", "Neither is accurate"], 0, "«Both descriptions explain the same effect»."],
    ]),

  makeText(ENGINEERING, 10, "The engineering design process",
    `Engineers rarely get a design right the first time. Instead, they follow an iterative process. It begins with defining the problem clearly, including the constraints: the budget, the materials available, safety rules and the needs of the people who will use the product.

Next, engineers generate several possible solutions and choose the most promising one to develop. They build a prototype and test it under realistic conditions. Testing almost always reveals weaknesses, so the design is improved and tested again. This cycle of building, testing and improving continues until the design meets its requirements. Failure during testing is therefore not a disaster but a normal and useful part of the process.`,
    [
      ["What does “iterative” mean in this text?", ["Repeating cycles of improvement", "Done only once", "Very expensive", "Done by computers"], 0, "Итеративный — повторяющийся циклами."],
      ["What is included in the constraints?", ["Budget, materials, safety rules and users' needs", "Only the colour of the product", "The engineer's personal preferences", "Advertising plans"], 0, "Список ограничений дан в первом абзаце."],
      ["Why are prototypes tested under realistic conditions?", ["To reveal weaknesses before the final design", "To sell them to customers", "Because the law forbids lab tests", "To make them cheaper"], 0, "«Testing almost always reveals weaknesses»."],
      ["How does the writer view failure during testing?", ["As a normal and useful part of the process", "As a disaster", "As a reason to stop the project", "As rare"], 0, "Последнее предложение."],
      ["True, False or Not Given: Engineers usually develop every possible solution fully.", TFNG, 1, "Они выбирают «the most promising one to develop», а не все."],
    ]),
];
