/* lessons.js — Calculus II lesson catalog */

const RAW_TOPICS = [
  {
    id: "1", icon: "∫", label: "Técnicas de Integración",
    lessons: [
      { id:"1.1.1",  name:"Integrating Algebraic Functions Using Substitution" },
      { id:"1.1.2",  name:"Integrating Linear Rational Functions Using Substitution" },
      { id:"1.1.3",  name:"Integration Using Substitution" },
      { id:"1.1.4",  name:"Calculating Definite Integrals Using Substitution" },
      { id:"1.1.5",  name:"Further Integration of Algebraic Functions Using Substitution" },
      { id:"1.1.6",  name:"Integrating Exponential Functions Using Linear Substitution" },
      { id:"1.1.7",  name:"Integrating Exponential Functions Using Substitution" },
      { id:"1.1.8",  name:"Integrating Trigonometric Functions Using Substitution" },
      { id:"1.1.9",  name:"Integrating Logarithmic Functions Using Substitution" },
      { id:"1.1.10", name:"Integration by Substitution With Inverse Trigonometric Functions" },
      { id:"1.1.11", name:"Integrating Hyperbolic Functions Using Substitution" },
      { id:"1.1.12", name:"Integration by Substitution With Inverse Hyperbolic Functions" },
      { id:"1.2.1",  name:"Integrating Functions Using Polynomial Division" },
      { id:"1.2.2",  name:"Integrating Functions by Completing the Square" },
      { id:"1.3.1",  name:"Integration Using Basic Trigonometric Identities" },
      { id:"1.3.2",  name:"Integration Using the Pythagorean Identities" },
      { id:"1.3.3",  name:"Integration Using the Double-Angle Formulas" },
      { id:"1.3.4",  name:"Integrating Products of Trigonometric Functions" },
      { id:"1.4.1",  name:"Integration Using Basic Hyperbolic Identities" },
      { id:"1.4.2",  name:"Integration Using the Hyperbolic Pythagorean Identities" },
      { id:"1.5.1",  name:"Introduction to Integration by Parts" },
      { id:"1.5.2",  name:"Integration by Parts With Logarithms" },
      { id:"1.5.3",  name:"Applying Integration by Parts Twice" },
      { id:"1.5.4",  name:"The Tabular Method of Integration by Parts" },
      { id:"1.5.5",  name:"Integration by Parts in Cyclic Cases" },
      { id:"1.6.1",  name:"Expressing Rational Functions as Sums of Partial Fractions" },
      { id:"1.6.2",  name:"Partial Fractions With Repeated Factors" },
      { id:"1.6.3",  name:"Partial Fractions With Irreducible Quadratic Factors" },
      { id:"1.6.4",  name:"Integrating Rational Functions Using Partial Fractions" },
      { id:"1.6.5",  name:"Integrating Rational Functions With Repeated Factors" },
      { id:"1.6.6",  name:"Integrating Rational Functions With Irreducible Quadratic Factors" },
      { id:"1.7.1",  name:"Improper Integrals" },
      { id:"1.7.2",  name:"Improper Integrals Involving Exponential Functions" },
      { id:"1.7.3",  name:"Improper Integrals Involving Arctangent" },
      { id:"1.7.4",  name:"Improper Integrals Over the Real Line" },
      { id:"1.7.5",  name:"Improper Integrals of the Second Kind" },
      { id:"1.7.6",  name:"Improper Integrals: Discontinuities at Interior Points" },
    ]
  },
  {
    id: "2", icon: "⊃", label: "Aplicaciones de la Integración",
    lessons: [
      { id:"2.8.1",  name:"Integrating Rates of Change" },
      { id:"2.8.2",  name:"Integrating Density Functions" },
      { id:"2.8.3",  name:"The Average Value of a Function" },
      { id:"2.8.4",  name:"The Area Between Curves as Functions of X" },
      { id:"2.8.5",  name:"The Area Between Curves as Functions of Y" },
      { id:"2.8.6",  name:"Areas Between Curves Intersecting at More Than Two Points" },
      { id:"2.8.7",  name:"The Arc Length of a Planar Curve" },
      { id:"2.9.1",  name:"Volumes of Solids with Square Cross Sections" },
      { id:"2.9.2",  name:"Volumes of Solids with Rectangular Cross Sections" },
      { id:"2.9.3",  name:"Volumes of Solids with Triangular Cross Sections" },
      { id:"2.9.4",  name:"Volumes of Solids with Circular Cross Sections" },
      { id:"2.10.1", name:"Volumes of Revolution: Disc Method — Coordinate Axes" },
      { id:"2.10.2", name:"Volumes of Revolution: Disc Method — Other Axes" },
      { id:"2.10.3", name:"Volumes of Revolution: Washer Method — Coordinate Axes" },
      { id:"2.10.4", name:"Volumes of Revolution: Washer Method — Other Axes" },
      { id:"2.10.5", name:"The Shell Method: Rotating About the X-Axis" },
      { id:"2.10.6", name:"The Shell Method: Region Between Two Curves" },
      { id:"2.10.7", name:"The Shell Method: Rotation About the Y-Axis" },
      { id:"2.11.1", name:"Surface Areas of Revolution: About the X-Axis" },
      { id:"2.11.2", name:"Surface Areas of Revolution: About the Y-Axis" },
      { id:"2.12.1", name:"Calculating Velocity Using Integration" },
      { id:"2.12.2", name:"Determining Characteristics of Moving Objects Using Integration" },
      { id:"2.12.5", name:"Calculating the Total Distance Traveled by a Particle" },
    ]
  },
  {
    id: "3", icon: "θ", label: "Paramétrico y Polar",
    lessons: [
      { id:"3.13.1",  name:"Differentiating Parametric Curves" },
      { id:"3.13.2",  name:"Tangent and Normal Lines with Parametric Equations" },
      { id:"3.13.3",  name:"Second Derivatives of Parametric Equations" },
      { id:"3.13.4",  name:"The Arc Length of a Parametric Curve" },
      { id:"3.14.1",  name:"Defining Vector-Valued Functions" },
      { id:"3.14.2",  name:"Differentiating Vector-Valued Functions" },
      { id:"3.14.3",  name:"Integrating Vector-Valued Functions" },
      { id:"3.16.1",  name:"Differentiating Curves Given in Polar Form" },
      { id:"3.16.3",  name:"Horizontal and Vertical Tangents to Polar Curves" },
      { id:"3.16.6",  name:"Finding the Area of a Polar Region" },
      { id:"3.16.8",  name:"The Total Area Bounded by a Single Polar Curve" },
      { id:"3.16.9",  name:"The Area Bounded by Two Polar Curves" },
      { id:"3.16.10", name:"The Arc Length of a Polar Curve" },
    ]
  },
  {
    id: "4", icon: "Σ", label: "Sucesiones y Series",
    lessons: [
      { id:"4.17.1",  name:"Limits of Sequences" },
      { id:"4.17.2",  name:"Convergence of Geometric Sequences" },
      { id:"4.17.4",  name:"Limits of Sequences With Factorials" },
      { id:"4.17.5",  name:"Limits of Sequences Using Relative Magnitudes" },
      { id:"4.18.1",  name:"Monotonic Sequences" },
      { id:"4.18.2",  name:"Identifying Monotonic Sequences Using Differentiation" },
      { id:"4.19.1",  name:"Infinite Series and Partial Sums" },
      { id:"4.19.2",  name:"Convergent and Divergent Infinite Series" },
      { id:"4.19.3",  name:"Properties of Infinite Series" },
      { id:"4.19.5",  name:"Telescoping Series" },
      { id:"4.20.1",  name:"Finding the Sum of an Infinite Geometric Series" },
      { id:"4.20.4",  name:"Convergence of Geometric Series" },
      { id:"4.20.5",  name:"Repeating Decimals as Infinite Geometric Series" },
      { id:"4.21.1",  name:"The Nth Term Test for Divergence" },
      { id:"4.21.2",  name:"The Integral Test" },
      { id:"4.21.3",  name:"The Remainder Estimate for the Integral Test" },
      { id:"4.21.4",  name:"Harmonic Series and p-Series" },
      { id:"4.21.5",  name:"The Comparison Test" },
      { id:"4.21.6",  name:"The Limit Comparison Test" },
      { id:"4.21.7",  name:"The Alternating Series Test" },
      { id:"4.21.8",  name:"The Ratio Test" },
      { id:"4.21.9",  name:"The Root Test" },
      { id:"4.21.10", name:"Absolute and Conditional Convergence" },
      { id:"4.21.11", name:"The Alternating Series Error Bound" },
      { id:"4.21.13", name:"Selecting Procedures for Analyzing Infinite Series" },
      { id:"4.22.1",  name:"Second-Degree Taylor Polynomials" },
      { id:"4.22.3",  name:"Third-Degree Taylor Polynomials" },
      { id:"4.22.4",  name:"Higher-Degree Taylor Polynomials" },
      { id:"4.22.5",  name:"The Lagrange Error Bound" },
      { id:"4.23.1",  name:"Radius of Convergence of Power Series" },
      { id:"4.23.3",  name:"Maclaurin Series" },
      { id:"4.23.4",  name:"Taylor Series" },
      { id:"4.23.5",  name:"Representing Functions as Power Series" },
      { id:"4.23.7",  name:"Standard Maclaurin Series for Trigonometric Functions" },
      { id:"4.23.8",  name:"Differentiating Taylor Series" },
      { id:"4.23.9",  name:"Approximating Integrals Using Taylor Series" },
    ]
  },
  {
    id: "5", icon: "dy", label: "Ecuaciones Diferenciales",
    lessons: [
      { id:"5.24.1", name:"Introduction to Differential Equations" },
      { id:"5.24.2", name:"Verifying Solutions of Differential Equations" },
      { id:"5.24.3", name:"Solving First-Order ODEs Using Direct Integration" },
      { id:"5.24.4", name:"Solving First-Order ODEs Using Separation of Variables" },
      { id:"5.24.5", name:"Solving First-Order IVPs Using Separation of Variables" },
      { id:"5.24.6", name:"Modeling With First-Order ODEs" },
      { id:"5.25.1", name:"Qualitative Analysis of First-Order ODEs" },
      { id:"5.25.2", name:"Equilibrium Solutions of First-Order ODEs" },
      { id:"5.26.1", name:"Exponential Growth and Decay Models" },
      { id:"5.26.2", name:"Exponential Growth and Decay: Calculating Unknown Times" },
      { id:"5.26.3", name:"Exponential Growth and Decay: Half-Life Problems" },
      { id:"5.27.1", name:"Logistic Growth Models" },
      { id:"5.27.2", name:"Qualitative Analysis of the Logistic Growth Equation" },
      { id:"5.27.3", name:"Solving the Logistic Growth Equation" },
      { id:"5.28.1", name:"Slope Fields for Directly Integrable ODEs" },
      { id:"5.28.2", name:"Slope Fields for Autonomous ODEs" },
      { id:"5.28.3", name:"Slope Fields for Nonautonomous ODEs" },
      { id:"5.29.1", name:"Euler's Method: Calculating One Step" },
    ]
  }
];

const SECTION_GRAPH = {
  "1.1": { prereqSections: [] },
  "1.2": { prereqSections: ["1.1"] },
  "1.3": { prereqSections: ["1.1"] },
  "1.4": { prereqSections: ["1.1"] },
  "1.5": { prereqSections: ["1.1", "1.3"] },
  "1.6": { prereqSections: ["1.2"] },
  "1.7": { prereqSections: ["1.5", "1.6"] },
  "2.8": { prereqSections: ["1.1", "1.7"] },
  "2.9": { prereqSections: ["2.8"] },
  "2.10": { prereqSections: ["2.8", "2.9"] },
  "2.11": { prereqSections: ["2.10"] },
  "2.12": { prereqSections: ["2.8"] },
  "3.13": { prereqSections: ["2.8"] },
  "3.14": { prereqSections: ["3.13"] },
  "3.16": { prereqSections: ["3.13"] },
  "4.17": { prereqSections: [] },
  "4.18": { prereqSections: ["4.17"] },
  "4.19": { prereqSections: ["4.17", "4.18"] },
  "4.20": { prereqSections: ["4.19"] },
  "4.21": { prereqSections: ["4.19", "4.20"] },
  "4.22": { prereqSections: ["4.17"] },
  "4.23": { prereqSections: ["4.20", "4.21", "4.22"] },
  "5.24": { prereqSections: ["1.1"] },
  "5.25": { prereqSections: ["5.24"] },
  "5.26": { prereqSections: ["5.24"] },
  "5.27": { prereqSections: ["5.24", "5.26"] },
  "5.28": { prereqSections: ["5.24", "5.25"] },
  "5.29": { prereqSections: ["5.24", "5.28"] },
};

const EXACT_TITLE_TRANSLATIONS = {
  "Integrating Functions by Completing the Square": "Integración de funciones completando el cuadrado",
  "The Area Between Curves as Functions of X": "Área entre curvas como funciones de x",
  "The Area Between Curves as Functions of Y": "Área entre curvas como funciones de y",
  "Areas Between Curves Intersecting at More Than Two Points": "Áreas entre curvas que se intersectan en más de dos puntos",
  "The Shell Method: Rotating About the X-Axis": "Método de capas cilíndricas: rotación alrededor del eje x",
  "The Shell Method: Region Between Two Curves": "Método de capas cilíndricas: región entre dos curvas",
  "The Shell Method: Rotation About the Y-Axis": "Método de capas cilíndricas: rotación alrededor del eje y",
  "Surface Areas of Revolution: About the X-Axis": "Áreas de superficie de revolución: alrededor del eje x",
  "Surface Areas of Revolution: About the Y-Axis": "Áreas de superficie de revolución: alrededor del eje y",
  "Limits of Sequences With Factorials": "Límites de sucesiones con factoriales",
  "Limits of Sequences Using Relative Magnitudes": "Límites de sucesiones mediante magnitudes relativas",
  "Identifying Monotonic Sequences Using Differentiation": "Identificación de sucesiones monótonas mediante derivación",
  "Infinite Series and Partial Sums": "Series infinitas y sumas parciales",
  "Convergent and Divergent Infinite Series": "Series infinitas convergentes y divergentes",
  "Telescoping Series": "Series telescópicas",
  "Maclaurin Series": "Series de Maclaurin",
  "Taylor Series": "Series de Taylor",
  "Standard Maclaurin Series for Trigonometric Functions": "Series de Maclaurin estándar para funciones trigonométricas",
  "Differentiating Taylor Series": "Derivación de series de Taylor",
  "Approximating Integrals Using Taylor Series": "Aproximación de integrales mediante series de Taylor",
};

const TITLE_REPLACEMENTS = [
  ["Surface Areas of Revolution", "Áreas de superficie de revolución"],
  ["Volumes of Revolution", "Volúmenes de revolución"],
  ["Volumes of Solids", "Volúmenes de sólidos"],
  ["The Average Value of a Function", "Valor promedio de una función"],
  ["The Area Between Curves", "Área entre curvas"],
  ["Areas Between Curves", "Áreas entre curvas"],
  ["The Arc Length of a Parametric Curve", "Longitud de arco de una curva paramétrica"],
  ["The Arc Length of a Polar Curve", "Longitud de arco de una curva polar"],
  ["The Arc Length of a Planar Curve", "Longitud de arco de una curva plana"],
  ["The Total Area Bounded by a Single Polar Curve", "Área total delimitada por una sola curva polar"],
  ["The Area Bounded by Two Polar Curves", "Área delimitada por dos curvas polares"],
  ["The Shell Method", "Método de capas cilíndricas"],
  ["Disc Method", "método de discos"],
  ["Washer Method", "método de anillos"],
  ["Coordinate Axes", "ejes coordenados"],
  ["Other Axes", "otros ejes"],
  ["Cross Sections", "secciones transversales"],
  ["Calculating the Total Distance Traveled by a Particle", "Cálculo de la distancia total recorrida por una partícula"],
  ["Determining Characteristics of Moving Objects Using Integration", "Determinación de características de objetos en movimiento mediante integración"],
  ["Calculating Velocity Using Integration", "Cálculo de la velocidad mediante integración"],
  ["Integrating Rates of Change", "Integración de tasas de cambio"],
  ["Integrating Density Functions", "Integración de funciones de densidad"],
  ["Differentiating Parametric Curves", "Derivación de curvas paramétricas"],
  ["Tangent and Normal Lines with Parametric Equations", "Rectas tangentes y normales con ecuaciones paramétricas"],
  ["Second Derivatives of Parametric Equations", "Segundas derivadas de ecuaciones paramétricas"],
  ["Defining Vector-Valued Functions", "Definición de funciones vectoriales"],
  ["Differentiating Vector-Valued Functions", "Derivación de funciones vectoriales"],
  ["Integrating Vector-Valued Functions", "Integración de funciones vectoriales"],
  ["Differentiating Curves Given in Polar Form", "Derivación de curvas dadas en forma polar"],
  ["Horizontal and Vertical Tangents to Polar Curves", "Tangentes horizontales y verticales a curvas polares"],
  ["Finding the Area of a Polar Region", "Cálculo del área de una región polar"],
  ["Limits of Sequences", "Límites de sucesiones"],
  ["Convergence of Geometric Sequences", "Convergencia de sucesiones geométricas"],
  ["Limits of Sequences With Factorials", "Límites de sucesiones con factoriales"],
  ["Limits of Sequences Using Relative Magnitudes", "Límites de sucesiones mediante magnitudes relativas"],
  ["Monotonic Sequences", "Sucesiones monótonas"],
  ["Identifying Monotonic Sequences Using Differentiation", "Identificación de sucesiones monótonas mediante derivación"],
  ["Infinite Series and Partial Sums", "Series infinitas y sumas parciales"],
  ["Convergent and Divergent Infinite Series", "Series infinitas convergentes y divergentes"],
  ["Properties of Infinite Series", "Propiedades de las series infinitas"],
  ["Telescoping Series", "Series telescópicas"],
  ["Finding the Sum of an Infinite Geometric Series", "Cálculo de la suma de una serie geométrica infinita"],
  ["Convergence of Geometric Series", "Convergencia de series geométricas"],
  ["Repeating Decimals as Infinite Geometric Series", "Decimales periódicos como series geométricas infinitas"],
  ["The Nth Term Test for Divergence", "Criterio del término n-ésimo para divergencia"],
  ["The Integral Test", "Criterio integral"],
  ["The Remainder Estimate for the Integral Test", "Estimación del residuo para el criterio integral"],
  ["Harmonic Series and p-Series", "Serie armónica y p-series"],
  ["The Comparison Test", "Criterio de comparación"],
  ["The Limit Comparison Test", "Criterio de comparación por límite"],
  ["The Alternating Series Test", "Criterio de series alternantes"],
  ["The Ratio Test", "Criterio de razón"],
  ["The Root Test", "Criterio de la raíz"],
  ["Absolute and Conditional Convergence", "Convergencia absoluta y condicional"],
  ["The Alternating Series Error Bound", "Cota del error en series alternantes"],
  ["Selecting Procedures for Analyzing Infinite Series", "Selección de procedimientos para analizar series infinitas"],
  ["Second-Degree Taylor Polynomials", "Polinomios de Taylor de segundo grado"],
  ["Third-Degree Taylor Polynomials", "Polinomios de Taylor de tercer grado"],
  ["Higher-Degree Taylor Polynomials", "Polinomios de Taylor de mayor grado"],
  ["The Lagrange Error Bound", "Cota del error de Lagrange"],
  ["Radius of Convergence of Power Series", "Radio de convergencia de series de potencias"],
  ["Maclaurin Series", "Series de Maclaurin"],
  ["Taylor Series", "Series de Taylor"],
  ["Representing Functions as Power Series", "Representación de funciones como series de potencias"],
  ["Standard Maclaurin Series for Trigonometric Functions", "Series de Maclaurin estándar para funciones trigonométricas"],
  ["Differentiating Taylor Series", "Derivación de series de Taylor"],
  ["Approximating Integrals Using Taylor Series", "Aproximación de integrales mediante series de Taylor"],
  ["Introduction to Differential Equations", "Introducción a las ecuaciones diferenciales"],
  ["Verifying Solutions of Differential Equations", "Verificación de soluciones de ecuaciones diferenciales"],
  ["Solving First-Order ODEs Using Direct Integration", "Resolución de EDO de primer orden mediante integración directa"],
  ["Solving First-Order ODEs Using Separation of Variables", "Resolución de EDO de primer orden mediante separación de variables"],
  ["Solving First-Order IVPs Using Separation of Variables", "Resolución de PVI de primer orden mediante separación de variables"],
  ["Modeling With First-Order ODEs", "Modelado con EDO de primer orden"],
  ["Qualitative Analysis of First-Order ODEs", "Análisis cualitativo de EDO de primer orden"],
  ["Equilibrium Solutions of First-Order ODEs", "Soluciones de equilibrio de EDO de primer orden"],
  ["Exponential Growth and Decay Models", "Modelos de crecimiento y decaimiento exponencial"],
  ["Exponential Growth and Decay: Calculating Unknown Times", "Crecimiento y decaimiento exponencial: cálculo de tiempos desconocidos"],
  ["Exponential Growth and Decay: Half-Life Problems", "Crecimiento y decaimiento exponencial: problemas de vida media"],
  ["Logistic Growth Models", "Modelos de crecimiento logístico"],
  ["Qualitative Analysis of the Logistic Growth Equation", "Análisis cualitativo de la ecuación de crecimiento logístico"],
  ["Solving the Logistic Growth Equation", "Resolución de la ecuación de crecimiento logístico"],
  ["Slope Fields for Directly Integrable ODEs", "Campos de pendientes para EDO directamente integrables"],
  ["Slope Fields for Autonomous ODEs", "Campos de pendientes para EDO autónomas"],
  ["Slope Fields for Nonautonomous ODEs", "Campos de pendientes para EDO no autónomas"],
  ["Euler's Method: Calculating One Step", "Método de Euler: cálculo de un paso"],
  ["Improper Integrals: Discontinuities at Interior Points", "Integrales impropias: discontinuidades en puntos interiores"],
  ["Improper Integrals Over the Real Line", "Integrales impropias sobre toda la recta real"],
  ["Improper Integrals of the Second Kind", "Integrales impropias de segunda especie"],
  ["Improper Integrals Involving Exponential Functions", "Integrales impropias con funciones exponenciales"],
  ["Improper Integrals Involving Arctangent", "Integrales impropias con arctangente"],
  ["Improper Integrals", "Integrales impropias"],
  ["Expressing Rational Functions as Sums of Partial Fractions", "Descomposición de funciones racionales en sumas de fracciones parciales"],
  ["Partial Fractions With Repeated Factors", "Fracciones parciales con factores repetidos"],
  ["Partial Fractions With Irreducible Quadratic Factors", "Fracciones parciales con factores cuadráticos irreducibles"],
  ["Integrating Rational Functions Using Partial Fractions", "Integración de funciones racionales mediante fracciones parciales"],
  ["Integrating Rational Functions With Repeated Factors", "Integración de funciones racionales con factores repetidos"],
  ["Integrating Rational Functions With Irreducible Quadratic Factors", "Integración de funciones racionales con factores cuadráticos irreducibles"],
  ["Introduction to Integration by Parts", "Introducción a la integración por partes"],
  ["Integration by Parts With Logarithms", "Integración por partes con logaritmos"],
  ["Applying Integration by Parts Twice", "Aplicación doble de integración por partes"],
  ["The Tabular Method of Integration by Parts", "Método tabular de integración por partes"],
  ["Integration by Parts in Cyclic Cases", "Integración por partes en casos cíclicos"],
  ["Integrating Algebraic Functions Using Substitution", "Integración de funciones algebraicas mediante sustitución"],
  ["Integrating Linear Rational Functions Using Substitution", "Integración de funciones racionales lineales mediante sustitución"],
  ["Integration Using Substitution", "Integración mediante sustitución"],
  ["Calculating Definite Integrals Using Substitution", "Cálculo de integrales definidas mediante sustitución"],
  ["Further Integration of Algebraic Functions Using Substitution", "Integración adicional de funciones algebraicas mediante sustitución"],
  ["Integrating Exponential Functions Using Linear Substitution", "Integración de funciones exponenciales mediante sustitución lineal"],
  ["Integrating Exponential Functions Using Substitution", "Integración de funciones exponenciales mediante sustitución"],
  ["Integrating Trigonometric Functions Using Substitution", "Integración de funciones trigonométricas mediante sustitución"],
  ["Integrating Logarithmic Functions Using Substitution", "Integración de funciones logarítmicas mediante sustitución"],
  ["Integration by Substitution With Inverse Trigonometric Functions", "Integración por sustitución con funciones trigonométricas inversas"],
  ["Integrating Hyperbolic Functions Using Substitution", "Integración de funciones hiperbólicas mediante sustitución"],
  ["Integration by Substitution With Inverse Hyperbolic Functions", "Integración por sustitución con funciones hiperbólicas inversas"],
  ["Integrating Functions Using Polynomial Division", "Integración de funciones mediante división polinómica"],
  ["Integrating Functions by Completing the Square", "Integración de funciones completando el cuadrado"],
  ["Integration Using Basic Trigonometric Identities", "Integración mediante identidades trigonométricas básicas"],
  ["Integration Using the Pythagorean Identities", "Integración mediante identidades pitagóricas"],
  ["Integration Using the Double-Angle Formulas", "Integración mediante fórmulas de ángulo doble"],
  ["Integrating Products of Trigonometric Functions", "Integración de productos de funciones trigonométricas"],
  ["Integration Using Basic Hyperbolic Identities", "Integración mediante identidades hiperbólicas básicas"],
  ["Integration Using the Hyperbolic Pythagorean Identities", "Integración mediante identidades pitagóricas hiperbólicas"],
];

function getSectionId(lessonId) {
  return lessonId.split(".").slice(0, 2).join(".");
}

function translateLessonName(name) {
  if (EXACT_TITLE_TRANSLATIONS[name]) return EXACT_TITLE_TRANSLATIONS[name];
  let translated = name;
  for (const [from, to] of TITLE_REPLACEMENTS) {
    translated = translated.replace(from, to);
  }
  return translated.replace(/\s{2,}/g, " ").trim();
}

function buildCurriculum(rawTopics) {
  const sectionLessons = {};

  rawTopics.forEach(topic => {
    topic.lessons.forEach(lesson => {
      const sectionId = getSectionId(lesson.id);
      if (!sectionLessons[sectionId]) sectionLessons[sectionId] = [];
      sectionLessons[sectionId].push(lesson.id);
    });
  });

  const sectionTerminalIds = Object.fromEntries(
    Object.entries(sectionLessons).map(([sectionId, ids]) => [sectionId, ids.slice(-1)])
  );

  const topics = rawTopics.map(topic => ({
    ...topic,
    lessons: topic.lessons.map((lesson, index) => {
      const sectionId = getSectionId(lesson.id);
      const prevInSection = index > 0 && getSectionId(topic.lessons[index - 1].id) === sectionId
        ? [topic.lessons[index - 1].id]
        : null;
      const prereqSections = SECTION_GRAPH[sectionId]?.prereqSections || [];
      const prerequisites = prevInSection || prereqSections.flatMap(prereqSection => sectionTerminalIds[prereqSection] || []);
      return {
        ...lesson,
        name: translateLessonName(lesson.name),
        prerequisites: [...new Set(prerequisites)],
        recommendedNext: [],
      };
    }),
  }));

  const lessonById = Object.fromEntries(topics.flatMap(topic => topic.lessons.map(lesson => [lesson.id, lesson])));
  const dependents = {};
  Object.values(lessonById).forEach(lesson => {
    lesson.prerequisites.forEach(prereqId => {
      if (!dependents[prereqId]) dependents[prereqId] = [];
      dependents[prereqId].push(lesson.id);
    });
  });

  topics.forEach(topic => {
    topic.lessons.forEach((lesson, index) => {
      const nextInTopic = topic.lessons[index + 1]?.id;
      const directDependents = dependents[lesson.id] || [];
      lesson.recommendedNext = [...new Set(nextInTopic ? [nextInTopic, ...directDependents] : directDependents)];
    });
  });

  return topics;
}

const TOPICS = buildCurriculum(RAW_TOPICS);
const LESSONS = TOPICS.flatMap(topic => topic.lessons);
const LESSON_BY_ID = Object.fromEntries(LESSONS.map(lesson => [lesson.id, lesson]));
const DEPENDENTS_BY_ID = LESSONS.reduce((acc, lesson) => {
  lesson.prerequisites.forEach(prereqId => {
    if (!acc[prereqId]) acc[prereqId] = [];
    acc[prereqId].push(lesson.id);
  });
  return acc;
}, {});

function getLessonById(id) {
  return LESSON_BY_ID[id] || null;
}

function getPrerequisites(id) {
  return getLessonById(id)?.prerequisites || [];
}

function getDependents(id) {
  return DEPENDENTS_BY_ID[id] || [];
}

function getRecommendedNext(id) {
  return getLessonById(id)?.recommendedNext || [];
}

function getMissingPrerequisites(id, progressData = {}) {
  return getPrerequisites(id).filter(prereqId => !progressData[prereqId]?.mastered);
}

/* Pre-generated demo lesson (Integration by Parts) */
const PRELOADED = {
  "1.5.1": {
    objective: "Aprender a calcular integrales de <strong>productos de funciones</strong> usando la fórmula $\\int u\\,dv = uv - \\int v\\,du$, y desarrollar intuición para elegir $u$ y $dv$ correctamente.",
    intro: {
      summary: "La integración por partes convierte productos difíciles en una secuencia de pasos manejables.",
      analogy: "Imagina una mudanza: separas el objeto grande de las cajas pequeñas para mover todo con más control.",
    },
    concept: [
      "Imagina que tienes que empacar una mudanza con muebles grandes y cajas pequeñas. Si tratas de moverlo todo de golpe, es imposible. La estrategia inteligente: mueves el mueble primero, y ese movimiento te abre espacio para las cajas. Integración por partes hace lo mismo — transfiere la complejidad de integrar de una función a la otra hasta que el problema se vuelve manejable.",
      "Cuando una integral tiene la forma de un <em>producto de dos funciones</em> — como $xe^x$, $x\\ln x$ o $x\\sin x$ — la sustitución no funciona. Necesitamos una técnica que separe las responsabilidades. La idea surge directamente de la <strong>regla del producto para derivadas</strong>: si $(uv)' = u'v + uv'$, integrando obtenemos $uv = \\int u'v\\,dx + \\int uv'\\,dx$, que reorganizado nos da la fórmula de integración por partes."
    ],
    analogy: "La regla LIATE te dice qué función llamar $u$: Logarítmicas → Inversas trig → Algebraicas → Trigonométricas → Exponenciales. La que esté más a la izquierda en esta lista va a ser $u$.",
    formulas: [
      { label: "Fórmula Principal", math: "$$\\int u\\,dv = uv - \\int v\\,du$$", name: "Integración por Partes" },
      { label: "Origen — Regla del producto", math: "$$\\frac{d}{dx}[uv] = u\\frac{dv}{dx} + v\\frac{du}{dx} \\implies \\int u\\,dv + \\int v\\,du = uv$$", name: "" },
    ],
    definitions: [
      { term: "Integración por partes", def: "Técnica para integrar productos de funciones, derivada de la regla del producto: $\\int u\\,dv = uv - \\int v\\,du$." },
      { term: "LIATE", def: "Regla mnemotécnica para elegir $u$: Logarítmicas, Inversas trigonométricas, Algebraicas, Trigonométricas, Exponenciales." },
      { term: "Caso cíclico", def: "Situación en que la integral original reaparece en el resultado (ej. $\\int e^x\\cos x\\,dx$), permitiendo despejarla algebraicamente." },
    ],
    examples: [
      {
        label: "Ejemplo 1", diff: 1, diffLabel: "Básico",
        problem: "Calcular $\\displaystyle\\int x\\,e^x\\,dx$",
        steps: [
          "Elegir por LIATE: $u = x$ (algebraica), $dv = e^x\\,dx$ (exponencial).",
          "Calcular: $du = dx$ y $v = \\int e^x\\,dx = e^x$.",
          "Aplicar la fórmula: $\\int x\\,e^x\\,dx = x\\cdot e^x - \\int e^x\\,dx = xe^x - e^x + C$.",
          "Resultado: $\\displaystyle\\int x\\,e^x\\,dx = (x-1)e^x + C$",
        ],
        isResult: [false, false, false, true]
      },
      {
        label: "Ejemplo 2", diff: 2, diffLabel: "Intermedio",
        problem: "Calcular $\\displaystyle\\int x\\ln(x)\\,dx$",
        steps: [
          "Por LIATE: $u = \\ln x$ (logarítmica tiene prioridad), $dv = x\\,dx$.",
          "Calcular: $du = \\frac{1}{x}\\,dx$ y $v = \\frac{x^2}{2}$.",
          "Aplicar: $\\int x\\ln x\\,dx = \\frac{x^2}{2}\\ln x - \\int \\frac{x^2}{2}\\cdot\\frac{1}{x}\\,dx = \\frac{x^2}{2}\\ln x - \\frac{1}{2}\\int x\\,dx$.",
          "Resultado: $\\displaystyle\\int x\\ln x\\,dx = \\frac{x^2}{2}\\ln x - \\frac{x^2}{4} + C$",
        ],
        isResult: [false, false, false, true]
      },
      {
        label: "Ejemplo 3", diff: 3, diffLabel: "Avanzado",
        problem: "Calcular $\\displaystyle\\int x^2 e^x\\,dx$",
        steps: [
          "Primera aplicación: $u = x^2$, $dv = e^x\\,dx$ → $du = 2x\\,dx$, $v = e^x$.",
          "Obtenemos: $x^2 e^x - 2\\int x\\,e^x\\,dx$.",
          "El segundo término es el Ejemplo 1: $\\int xe^x\\,dx = (x-1)e^x + C$.",
          "Resultado: $\\displaystyle\\int x^2 e^x\\,dx = (x^2 - 2x + 2)e^x + C$",
        ],
        isResult: [false, false, false, true]
      },
      {
        label: "Ejemplo 4", diff: 4, diffLabel: "Cíclico",
        problem: "Calcular $\\displaystyle\\int e^x\\cos x\\,dx$",
        steps: [
          "Aplicar dos veces: $u = \\cos x$, $dv = e^x\\,dx$ → $\\int e^x\\cos x = e^x\\cos x + \\int e^x\\sin x\\,dx$.",
          "Segunda aplicación sobre $\\int e^x\\sin x\\,dx$: resulta en $e^x\\sin x - \\int e^x\\cos x\\,dx$.",
          "La integral original aparece en ambos lados: $I = e^x\\cos x + e^x\\sin x - I$.",
          "Resultado: $\\displaystyle\\int e^x\\cos x\\,dx = \\frac{e^x(\\cos x + \\sin x)}{2} + C$",
        ],
        isResult: [false, false, false, true]
      },
    ],
    exercises: [
      { q: "$\\displaystyle\\int x\\sin(x)\\,dx$",        a: "$-x\\cos x + \\sin x + C$" },
      { q: "$\\displaystyle\\int \\ln(x)\\,dx$",          a: "$x\\ln x - x + C$" },
      { q: "$\\displaystyle\\int x^2\\sin(x)\\,dx$",      a: "$-x^2\\cos x + 2x\\sin x + 2\\cos x + C$" },
      { q: "$\\displaystyle\\int \\arctan(x)\\,dx$",      a: "$x\\arctan x - \\frac{1}{2}\\ln(1+x^2) + C$" },
      { q: "$\\displaystyle\\int x^3 e^x\\,dx$",          a: "$(x^3-3x^2+6x-6)e^x + C$" },
      { q: "$\\displaystyle\\int e^x\\sin(x)\\,dx$",      a: "$\\frac{e^x(\\sin x - \\cos x)}{2} + C$" },
    ],
    summary: [
      "La fórmula $\\int u\\,dv = uv - \\int v\\,du$ transforma un producto difícil en una integral más simple.",
      "Usa la regla **LIATE** para elegir $u$: logarítmicas primero, exponenciales al final.",
      "Si el grado del polinomio es mayor que 1, aplica la fórmula más de una vez en cadena.",
      "En el caso cíclico ($e^x\\sin x$, $e^x\\cos x$), la integral original aparece en ambos lados — se despeja algebraicamente.",
    ],
    blocks: [
      {
        type: "concept",
        title: "Idea central",
        content: [
          "La integración por partes reorganiza un producto para que una parte quede más simple al integrarse.",
          "Su fórmula nace directamente de la regla del producto de derivadas.",
        ],
      },
      {
        type: "practice",
        title: "Elegir $u$ y $dv$",
        prompt: "Para la integral $\\int x e^x\\,dx$, decide qué conviene elegir como $u$ y qué conviene elegir como $dv$.",
        choices: [
          "$u = x$, $dv = e^x\\,dx$",
          "$u = e^x$, $dv = x\\,dx$",
          "$u = x e^x$, $dv = dx$",
        ],
        correctMessage: "Correcto: conviene tomar $u = x$ porque su derivada simplifica la integral.",
        hint: "Aplica LIATE: una función algebraica suele ir antes que una exponencial.",
        walkthrough: "Elige $u = x$ y $dv = e^x\\,dx$, luego calcula $du = dx$ y $v = e^x$ para aplicar $\\int u\\,dv = uv - \\int v\\,du$.",
        content: [
          "Usa LIATE para decidir qué función conviene derivar y cuál conviene integrar.",
          "Practica con productos como $x e^x$, $x \\ln x$ y $x \\sin x$.",
        ],
      },
      {
        type: "application",
        title: "Ejemplos resueltos",
        content: [
          "Resuelve integrales que requieren una sola aplicación, varias aplicaciones y casos cíclicos.",
          "Observa cómo se reutiliza la técnica cuando la integral reaparece.",
        ],
      },
      {
        type: "recognition",
        title: "Cuándo usarla",
        content: [
          "El método es útil cuando ves un producto de funciones y la sustitución no encaja.",
          "Suele funcionar bien con polinomios por un lado y exponenciales, logaritmos o trigonométricas por el otro.",
        ],
      },
    ],
    mcq: [
      {
        q: "Según la regla LIATE, ¿cuál es la elección correcta de $u$ para calcular $\\int x e^x\\,dx$?",
        options: ["$u = e^x$", "$u = x$", "$u = xe^x$", "$u = e^x + x$"],
        correct: 1
      },
      {
        q: "Al aplicar integración por partes a $\\int \\ln(x)\\,dx$, ¿cuál es la elección más adecuada?",
        options: [
          "$u = 1,\\; dv = \\ln(x)\\,dx$",
          "$u = \\ln(x),\\; dv = dx$",
          "$u = x,\\; dv = \\ln(x)\\,dx$",
          "No se puede aplicar integración por partes aquí"
        ],
        correct: 1
      },
      {
        q: "¿Qué ocurre cuando aplicamos integración por partes dos veces a $\\int e^x \\cos(x)\\,dx$?",
        options: [
          "La integral se hace cero",
          "Obtenemos $\\int e^x \\sin(x)\\,dx$ que se resuelve directo",
          "La integral original reaparece en el resultado, permitiendo despejarla",
          "El resultado es siempre $e^x \\cos(x) + C$"
        ],
        correct: 2
      },
      {
        q: "¿Cuál es el resultado de $\\int x^2 e^x\\,dx$?",
        options: [
          "$(x^2 + 2x + 2)e^x + C$",
          "$(x^2 - 2x + 2)e^x + C$",
          "$x^2 e^x - 2xe^x + C$",
          "$(x^2 - 2)e^x + C$"
        ],
        correct: 1
      }
    ]
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    TOPICS,
    PRELOADED,
    getLessonById,
    getPrerequisites,
    getDependents,
    getRecommendedNext,
    getMissingPrerequisites,
  };
}
