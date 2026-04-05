const test = require("node:test");
const assert = require("node:assert/strict");

const {
  TOPICS,
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
