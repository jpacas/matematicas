const test = require("node:test");
const assert = require("node:assert/strict");

const lessons = require("../lessons.js");

const {
  TOPICS,
  PRELOADED,
  getLessonById,
  getDependents,
  getRecommendedNext,
} = lessons;

const {
  getPracticeFeedbackState,
  createLessonSessionState,
  countCompletedBlocks,
} = require("../app.js");

test("curriculum keeps all lessons and exposes metadata", () => {
  const lessons = TOPICS.flatMap(topic => topic.lessons);
  assert.equal(lessons.length, 127);
  assert.ok(lessons.every(lesson => typeof lesson.name === "string" && lesson.name.length > 0));
  assert.ok(lessons.every(lesson => Array.isArray(lesson.prerequisites)));
  assert.ok(lessons.every(lesson => Array.isArray(lesson.recommendedNext)));
});

test("lesson titles are localized to Spanish", () => {
  const names = TOPICS.flatMap(topic => topic.lessons.map(lesson => lesson.name));
  assert.ok(names.some(name => name.includes("Integración")));
  assert.ok(names.every(name => !/\b(Using|With|The|of|and|Functions|Given|About|More|Than)\b/.test(name)));
});

test("graph references only valid lessons and no self-dependencies", () => {
  const lessons = TOPICS.flatMap(topic => topic.lessons);
  const ids = new Set(lessons.map(lesson => lesson.id));

  for (const lesson of lessons) {
    assert.ok(!lesson.prerequisites.includes(lesson.id), lesson.id);
    for (const prereq of lesson.prerequisites) {
      assert.ok(ids.has(prereq), `${lesson.id} -> ${prereq}`);
    }
  }
});

test("recommended path flows across the curriculum", () => {
  assert.deepEqual(getLessonById("1.1.1").prerequisites, []);
  assert.ok(getDependents("1.5.1").includes("1.5.2"));
  assert.ok(getRecommendedNext("1.1.1").includes("1.1.2"));
});

test("preloaded guided lessons expose teaching blocks with practice metadata", () => {
  const guidedEntries = Object.entries(PRELOADED);
  assert.ok(guidedEntries.length > 0);

  for (const [lessonId, lesson] of guidedEntries) {
    assert.ok(getLessonById(lessonId), `missing lesson id ${lessonId}`);
    assert.equal(lesson.id, lessonId);
    assert.equal(typeof lesson.objective, "string");
    assert.ok(lesson.objective.length > 0);
    assert.equal(typeof lesson.intro?.summary, "string");
    assert.ok(lesson.intro.summary.length > 0);
    assert.equal(typeof lesson.intro?.analogy, "string");
    assert.ok(lesson.intro.analogy.length > 0);

    assert.ok(Array.isArray(lesson.blocks));
    assert.ok(lesson.blocks.length > 0);

    const practiceBlock = lesson.blocks.find(block => block.type === "practice");
    assert.ok(practiceBlock, "expected a practice block");
    assert.equal(typeof practiceBlock.source, "string");
    assert.ok(practiceBlock.source.length > 0);
    assert.ok(Array.isArray(practiceBlock.sourceRefs));
    assert.ok(practiceBlock.sourceRefs.length > 0);
    assert.equal(typeof practiceBlock.prompt, "string");
    assert.ok(practiceBlock.prompt.length > 0);
    assert.ok(Array.isArray(practiceBlock.choices));
    assert.ok(practiceBlock.choices.length >= 2);
    assert.ok(practiceBlock.choices.every(choice => typeof choice === "object" && choice !== null));
    assert.ok(practiceBlock.choices.every(choice => typeof choice.id === "string" && choice.id.length > 0));
    assert.ok(practiceBlock.choices.every(choice => typeof choice.text === "string" && choice.text.length > 0));
    assert.equal(typeof practiceBlock.correctChoice, "string");
    assert.ok(practiceBlock.choices.some(choice => choice.id === practiceBlock.correctChoice));
    assert.equal(typeof practiceBlock.correctMessage, "string");
    assert.ok(practiceBlock.correctMessage.length > 0);
    assert.equal(typeof practiceBlock.hint, "string");
    assert.ok(practiceBlock.hint.length > 0);
    assert.equal(typeof practiceBlock.walkthrough, "string");
    assert.ok(practiceBlock.walkthrough.length > 0);

    for (const block of lesson.blocks) {
      assert.match(block.type, /^(concept|practice|application|recognition)$/);
      assert.equal(typeof block.title, "string");
      assert.ok(block.title.length > 0);
      assert.equal(typeof block.source, "string");
      assert.ok(block.source.length > 0);
      assert.ok(Array.isArray(block.sourceRefs));
      assert.ok(block.sourceRefs.length > 0);
      if (block.type === "practice") {
        continue;
      }
      assert.ok(Array.isArray(block.content));
      assert.ok(block.content.length > 0);
      assert.ok(block.content.every(item => typeof item === "string" && item.length > 0));
    }
  }
});

test("guided practice escalates from neutral to hint to walkthrough", () => {
  assert.equal(getPracticeFeedbackState({ attempts: 0, solved: false }), "idle");
  assert.equal(getPracticeFeedbackState({ attempts: 1, solved: false }), "hint");
  assert.equal(getPracticeFeedbackState({ attempts: 2, solved: false }), "walkthrough");
  assert.equal(getPracticeFeedbackState({ attempts: 1, solved: true }), "correct");
});

test("guided lesson session state derives defaults from mixed block types", () => {
  const lesson = {
    blocks: [
      { type: "practice", title: "Primera práctica" },
      { type: "concept", title: "Idea clave" },
      { type: "recognition", title: "Patrón" },
      { type: "practice", title: "Segunda práctica" },
      { type: "application", title: "Aplicación" },
    ],
  };

  const session = createLessonSessionState(lesson);

  assert.deepEqual(session, [
    { attempts: 0, completed: false, selectedChoice: null, solved: false },
    { completed: false },
    { completed: false },
    { attempts: 0, completed: false, selectedChoice: null, solved: false },
    { completed: false },
  ]);

  session[0].attempts = 2;
  session[0].selectedChoice = "a";

  assert.deepEqual(session[3], {
    attempts: 0,
    completed: false,
    selectedChoice: null,
    solved: false,
  });
});

test("completed block count totals solved practice blocks and completed reading blocks", () => {
  const session = [
    { attempts: 1, completed: false, selectedChoice: "a", solved: true },
    { completed: true },
    { completed: false },
    { attempts: 2, completed: false, selectedChoice: "b", solved: false },
    { completed: true },
  ];

  assert.equal(countCompletedBlocks(session), 3);
});
