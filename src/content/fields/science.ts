import { makeText, TFNG, type FieldMeta } from "./make";

export const SCIENCE: FieldMeta = {
  id: "science",
  title: "Естественные науки",
  short: "Науки",
  intro: "Тексты по физике, химии, экологии и наукам о Земле. Следи за определениями, числами и тем, как автор отделяет установленные факты от гипотез.",
};

export const SCIENCE_TEXTS = [
  makeText(SCIENCE, 1, "The water cycle",
    `The water on Earth is constantly moving between the oceans, the air and the land. Heat from the sun causes water to evaporate from seas, lakes and soil, and plants release water vapour through their leaves, a process called transpiration. As moist air rises and cools, the vapour condenses into tiny droplets that form clouds.

When the droplets combine and become heavy enough, they fall as precipitation: rain, snow or hail. Some of this water flows over the surface into rivers and back to the sea, while some soaks into the ground and is stored for long periods as groundwater. The total amount of water on Earth stays almost the same; it simply changes form and location.`,
    [
      ["What causes water to evaporate, according to the text?", ["Heat from the sun", "Wind from the sea", "Plants absorbing water", "Cold air"], 0, "«Heat from the sun causes water to evaporate from seas, lakes and soil»."],
      ["What is transpiration?", ["Plants releasing water vapour through their leaves", "Rain falling on plants", "Water soaking into the ground", "Clouds forming"], 0, "Определение в первом абзаце."],
      ["What happens as moist air rises and cools?", ["Vapour condenses into droplets", "Water evaporates faster", "Groundwater forms", "Snow melts"], 0, "Конденсация образует облака."],
      ["What is groundwater?", ["Water stored in the ground", "Water in clouds", "Water in rivers", "Water in the oceans"], 0, "«soaks into the ground and is stored… as groundwater»."],
      ["True, False or Not Given: The total amount of water on Earth is decreasing quickly.", TFNG, 1, "«stays almost the same»."],
    ]),

  makeText(SCIENCE, 2, "Photosynthesis",
    `Photosynthesis is the process by which plants, algae and some bacteria use the energy of light to make their own food. Inside green parts of the plant, a pigment called chlorophyll absorbs light, mostly red and blue wavelengths, and reflects much of the green, which is why leaves look green.

Using this energy, the plant combines carbon dioxide from the air with water from the soil to produce glucose, a sugar it uses for energy and growth. Oxygen is released as a by-product. Photosynthesis is therefore the source of most of the oxygen in the atmosphere and of the energy stored in almost every food chain on Earth.`,
    [
      ["What does chlorophyll do?", ["Absorbs light", "Produces water", "Stores oxygen", "Absorbs carbon from the soil"], 0, "«chlorophyll absorbs light»."],
      ["Why do leaves look green?", ["Chlorophyll reflects much of the green light", "They absorb green light", "They contain glucose", "They release oxygen"], 0, "Первый абзац."],
      ["What does the plant combine to make glucose?", ["Carbon dioxide and water", "Oxygen and water", "Glucose and oxygen", "Soil and light"], 0, "Второй абзац."],
      ["The word “by-product” suggests that oxygen is", ["produced in addition to the main product", "the main aim of the process", "harmful to plants", "taken from the air"], 0, "By-product — побочный продукт."],
      ["True, False or Not Given: Only plants can carry out photosynthesis.", TFNG, 1, "Также водоросли и некоторые бактерии."],
    ]),

  makeText(SCIENCE, 3, "Changing states of matter",
    `Most substances can exist as a solid, a liquid or a gas. In a solid, particles are held tightly in fixed positions and can only vibrate. In a liquid, they are still close together but can move past one another, which is why liquids flow. In a gas, the particles are far apart and move freely, filling any container.

Adding heat gives particles more energy. When a solid gains enough energy, it melts; when a liquid gains enough, it boils. During melting and boiling, the temperature stays constant even though heat is still being added, because the energy is being used to break the forces between particles rather than to speed them up. Water is unusual in that its solid form, ice, is less dense than liquid water, so ice floats.`,
    [
      ["Why do liquids flow?", ["Their particles can move past one another", "Their particles are fixed", "Their particles are far apart", "They have no particles"], 0, "Первый абзац."],
      ["What happens to the temperature during boiling?", ["It stays constant", "It rises quickly", "It falls", "It changes randomly"], 0, "Второй абзац."],
      ["Why does temperature stay constant during melting?", ["Energy is used to break the forces between particles", "Heat stops being added", "Particles stop moving", "The substance becomes a gas"], 0, "Объяснение в тексте."],
      ["What is unusual about water?", ["Ice is less dense than liquid water", "It cannot boil", "It has no solid form", "Its particles never move"], 0, "Поэтому лёд плавает."],
      ["True, False or Not Given: In a gas, particles fill any container.", TFNG, 0, "«move freely, filling any container»."],
    ]),

  makeText(SCIENCE, 4, "Why earthquakes happen",
    `The Earth's outer shell is broken into large pieces called tectonic plates, which move slowly, typically a few centimetres a year. Where plates meet, they may pull apart, push together or slide past one another. Friction often locks their edges in place while the plates keep moving, so stress builds up in the rocks.

When the stress becomes greater than the rocks can bear, they suddenly slip, releasing energy as seismic waves that shake the ground: an earthquake. Most earthquakes and volcanoes occur along plate boundaries, such as the “Ring of Fire” around the Pacific Ocean. Scientists can estimate which regions face the greatest long-term risk, but they cannot yet predict the exact time of a particular earthquake.`,
    [
      ["How fast do tectonic plates typically move?", ["A few centimetres a year", "A few metres a day", "A kilometre a year", "They do not move"], 0, "Первый абзац."],
      ["Why does stress build up at plate edges?", ["Friction locks the edges while the plates keep moving", "The plates stop moving", "Volcanoes push them", "Water flows between them"], 0, "Первый абзац."],
      ["What are seismic waves?", ["Waves of energy released when rocks slip", "Ocean waves", "Sound from volcanoes", "Waves of heat from the sun"], 0, "Второй абзац."],
      ["Where do most earthquakes occur?", ["Along plate boundaries", "In the middle of plates", "Only in deserts", "Only under oceans"], 0, "«along plate boundaries»."],
      ["True, False or Not Given: Scientists can predict the exact time of an earthquake.", TFNG, 1, "«cannot yet predict the exact time»."],
    ]),

  makeText(SCIENCE, 5, "The greenhouse effect",
    `Sunlight passes through the atmosphere and warms the Earth's surface. The surface then gives off heat in the form of infrared radiation. Certain gases in the atmosphere, including water vapour, carbon dioxide and methane, absorb much of this infrared radiation and send part of it back towards the surface. This natural greenhouse effect keeps the planet far warmer than it would otherwise be.

Since the industrial revolution, burning coal, oil and gas has greatly increased the concentration of carbon dioxide in the atmosphere. Scientists have concluded that this strengthening of the greenhouse effect is the main cause of the global warming observed over recent decades.`,
    [
      ["In what form does the Earth's surface give off heat?", ["Infrared radiation", "Visible light", "Ultraviolet light", "Sound"], 0, "Первый абзац."],
      ["Which gas is NOT mentioned as a greenhouse gas?", ["Oxygen", "Water vapour", "Carbon dioxide", "Methane"], 0, "Кислород не назван."],
      ["Without the natural greenhouse effect, the planet would be", ["much colder", "much warmer", "the same temperature", "covered in water"], 0, "«keeps the planet far warmer than it would otherwise be»."],
      ["What has increased carbon dioxide since the industrial revolution?", ["Burning coal, oil and gas", "More plants", "Volcanic eruptions only", "Ocean currents"], 0, "Второй абзац."],
      ["True, False or Not Given: The greenhouse effect is entirely caused by humans.", TFNG, 1, "Существует естественный парниковый эффект; люди его усилили."],
    ]),

  makeText(SCIENCE, 6, "Newton's first law",
    `Isaac Newton's first law of motion states that an object stays at rest, or keeps moving at a constant speed in a straight line, unless an unbalanced force acts on it. This tendency to resist changes in motion is called inertia.

The law seems to contradict everyday experience: a ball rolling on the ground eventually stops. But it stops because forces such as friction and air resistance act on it. In space, where these forces are tiny, a spacecraft can travel enormous distances without its engines running. Inertia also explains why passengers lurch forward when a car brakes suddenly: their bodies tend to keep moving even as the car slows down.`,
    [
      ["What is inertia?", ["The tendency of objects to resist changes in motion", "A type of friction", "The speed of an object", "A force in space"], 0, "Определение в первом абзаце."],
      ["Why does a rolling ball eventually stop?", ["Friction and air resistance act on it", "Inertia disappears", "It runs out of energy by itself", "Gravity pushes it backwards"], 0, "Второй абзац."],
      ["Why can spacecraft travel far without engines running?", ["Forces like friction are tiny in space", "Space has stronger gravity", "Engines run automatically", "Inertia is stronger in space"], 0, "Объяснение во втором абзаце."],
      ["Why do passengers lurch forward when a car brakes?", ["Their bodies tend to keep moving", "The seat pushes them", "The car speeds up", "Air pushes them forward"], 0, "Последнее предложение."],
      ["According to the first law, an object at rest stays at rest unless", ["an unbalanced force acts on it", "it is very heavy", "it is in space", "it is pushed by inertia"], 0, "Формулировка закона в тексте."],
    ]),

  makeText(SCIENCE, 7, "Catalysts",
    `For a chemical reaction to happen, particles must collide with enough energy to break existing bonds. This minimum energy is called the activation energy. A catalyst is a substance that speeds up a reaction by providing an alternative pathway with a lower activation energy, so that more collisions succeed.

Crucially, a catalyst is not used up in the reaction and can be used again and again. Catalysts are essential in industry: they make processes faster and allow them to run at lower temperatures, saving energy. Living things depend on biological catalysts called enzymes, which control almost every chemical reaction in cells. Cars also contain catalytic converters, which turn some harmful exhaust gases into less harmful ones.`,
    [
      ["What is activation energy?", ["The minimum energy needed for a reaction", "The energy released by a reaction", "The energy of a catalyst", "The energy stored in bonds"], 0, "Определение в первом абзаце."],
      ["How does a catalyst speed up a reaction?", ["By providing a pathway with lower activation energy", "By raising the temperature", "By being used up", "By adding more particles"], 0, "Первый абзац."],
      ["What is special about catalysts?", ["They are not used up", "They always raise temperature", "They work only in living things", "They slow reactions down"], 0, "«not used up in the reaction»."],
      ["What are enzymes?", ["Biological catalysts", "Harmful gases", "Industrial machines", "Types of fuel"], 0, "Второй абзац."],
      ["True, False or Not Given: Catalytic converters remove all harmful gases from car exhaust.", TFNG, 1, "Они превращают «some harmful exhaust gases», а не все."],
    ]),

  makeText(SCIENCE, 8, "The speed of light",
    `Light travels through empty space at about 300,000 kilometres per second, the fastest speed possible in the universe according to Einstein's theory of relativity. At this speed, light from the Moon reaches us in just over a second, and light from the Sun takes about eight minutes.

Because distances in space are so vast, astronomers often measure them in light-years: the distance light travels in one year, roughly 9.5 trillion kilometres. This means that when we look at distant stars, we see them as they were when their light set out. The light from a star 100 light-years away left it a century ago, so in a sense, looking into space is looking into the past.`,
    [
      ["How fast does light travel through empty space?", ["About 300,000 km per second", "About 300 km per second", "About 3,000 km per hour", "Infinitely fast"], 0, "Первое предложение."],
      ["How long does light from the Sun take to reach us?", ["About eight minutes", "Just over a second", "About a year", "About an hour"], 0, "Первый абзац."],
      ["What is a light-year?", ["The distance light travels in one year", "The time light takes to reach the Moon", "A year on another planet", "The age of a star"], 0, "Определение во втором абзаце."],
      ["Why is looking into space described as looking into the past?", ["We see stars as they were when their light left them", "Stars move backwards", "Telescopes show old photographs", "Light slows down over time"], 0, "Последнее предложение."],
      ["True, False or Not Given: Light from the Moon reaches Earth in about eight minutes.", TFNG, 1, "Свет Луны — чуть больше секунды; восемь минут — свет Солнца."],
    ]),

  makeText(SCIENCE, 9, "Keystone species",
    `In an ecosystem, living things are connected through food webs: networks showing who eats whom. Some species have an effect on their ecosystem far larger than their numbers would suggest. Ecologists call them keystone species, after the central stone that holds an arch together.

Sea otters on the Pacific coast of North America are a classic example. Otters eat sea urchins, which feed on kelp, a large seaweed that forms underwater forests. Where otters disappeared because of hunting, urchin populations grew and destroyed many kelp forests, along with the fish and other animals that lived in them. Where otters returned, kelp forests often recovered. Protecting a single keystone species can therefore protect an entire community.`,
    [
      ["What is a food web?", ["A network showing who eats whom", "A type of seaweed", "A fishing net", "A list of endangered species"], 0, "Определение в первом абзаце."],
      ["Why are keystone species named after a stone in an arch?", ["Their removal can make the whole system collapse", "They are found near stones", "They live in arches", "They are very heavy"], 0, "Замковый камень держит всю арку."],
      ["What do sea urchins feed on?", ["Kelp", "Sea otters", "Fish", "Stones"], 0, "«sea urchins, which feed on kelp»."],
      ["What happened where otters disappeared?", ["Urchins increased and destroyed kelp forests", "Kelp forests grew larger", "Fish populations increased", "Urchins disappeared too"], 0, "Второй абзац."],
      ["True, False or Not Given: Sea otters eat kelp.", TFNG, 1, "Каланы едят морских ежей, а не ламинарию."],
    ]),

  makeText(SCIENCE, 10, "What makes an idea scientific",
    `Science does not simply collect facts; it tests explanations. A scientific hypothesis must make predictions that could, in principle, turn out to be wrong. The philosopher Karl Popper called this property falsifiability. “All swans are white” is falsifiable, because finding a single black swan would disprove it.

According to this view, a theory becomes stronger each time it survives a serious test, but it can never be proved true once and for all. A claim that fits every possible observation, by contrast, tells us nothing testable. This is why scientists value precise predictions, careful measurements and experiments that are repeated by independent researchers.`,
    [
      ["What must a scientific hypothesis do, according to the text?", ["Make predictions that could turn out to be wrong", "Be proved true once and for all", "Fit every possible observation", "Avoid predictions"], 0, "Первый абзац."],
      ["What did Karl Popper call this property?", ["Falsifiability", "Observation", "Certainty", "Measurement"], 0, "«Popper called this property falsifiability»."],
      ["Why is “All swans are white” falsifiable?", ["Finding a black swan would disprove it", "All swans are white", "It cannot be tested", "Swans are rare"], 0, "Объяснение в тексте."],
      ["What happens when a theory survives a serious test?", ["It becomes stronger but is not proved forever", "It is proved true once and for all", "It becomes useless", "It must be abandoned"], 0, "Второй абзац."],
      ["Why do scientists value repeated experiments by independent researchers?", ["They provide stronger tests of a claim", "They make science faster", "They reduce the cost", "They avoid the need for predictions"], 0, "Последнее предложение подводит к этому выводу."],
    ]),
];
