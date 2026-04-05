const test = require("node:test");
const assert = require("node:assert/strict");

const {
  TOPICS,
  PRELOADED,
  getLessonById,
  getDependents,
  getRecommendedNext,
} = require("../lessons.js");

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
  const guided = Object.values(PRELOADED);
  assert.ok(guided.length > 0);

  for (const lesson of guided) {
    assert.ok(Array.isArray(lesson.blocks));
    assert.ok(lesson.blocks.length > 0);

    const practiceBlock = lesson.blocks.find(block => block.type === "practice");
    assert.ok(practiceBlock, "expected a practice block");
    assert.equal(typeof practiceBlock.prompt, "string");
    assert.ok(Array.isArray(practiceBlock.choices));
    assert.ok(practiceBlock.choices.length >= 2);
    assert.equal(typeof practiceBlock.correctMessage, "string");
    assert.equal(typeof practiceBlock.hint, "string");
    assert.equal(typeof practiceBlock.walkthrough, "string");

    for (const block of lesson.blocks) {
      assert.match(block.type, /^(concept|practice|application|recognition)$/);
      assert.equal(typeof block.title, "string");
    }
  }
});
