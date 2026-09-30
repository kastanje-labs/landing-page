import test from "node:test";
import assert from "node:assert/strict";
import {
  dayPartForHour,
  sceneInDenmark,
  sceneModeFromSearch,
  scenePreviewOptions,
} from "../src/landing-scenes";

test("published pages ignore scene overrides, including on preview deployment domains", () => {
  for (const host of [
    "kastanje.dk",
    "kastanje-demo.gustavonline.workers.dev",
    "localhost.evil.test",
  ])
    assert.deepEqual(scenePreviewOptions(host, "?tid=aften&sted=landsbyen"), {
      enabled: false,
      mode: "auto",
      place: null,
    });
  assert.deepEqual(
    scenePreviewOptions("localhost", "?tid=aften&sted=landsbyen"),
    {
      enabled: true,
      mode: "aften",
      place: "landsbyen",
    },
  );
  assert.deepEqual(
    scenePreviewOptions(
      "localhost",
      "?preview=production&tid=aften&sted=landsbyen",
    ),
    {
      enabled: false,
      mode: "auto",
      place: null,
    },
  );
});

test("Danish scenes change at each intended boundary", () => {
  for (const [hour, expected] of [
    [0, "aften"],
    [4, "aften"],
    [5, "morgen"],
    [10, "morgen"],
    [11, "middag"],
    [14, "middag"],
    [15, "eftermiddag"],
    [18, "eftermiddag"],
    [19, "aften"],
    [23, "aften"],
  ] as const)
    assert.equal(dayPartForHour(hour), expected);
});
test("Copenhagen time handles winter and summer independently of browser timezone", () => {
  assert.equal(sceneInDenmark(new Date("2026-07-01T09:00:00Z")), "middag");
  assert.equal(sceneInDenmark(new Date("2026-01-01T09:00:00Z")), "morgen");
  assert.equal(sceneInDenmark(new Date("2026-03-29T03:00:00Z")), "morgen");
  assert.equal(sceneInDenmark(new Date("2026-10-25T03:00:00Z")), "aften");
});
test("explicit scenes are allowlisted and unknown values use real time", () => {
  assert.equal(sceneModeFromSearch("?tid=eftermiddag"), "eftermiddag");
  assert.equal(sceneModeFromSearch("?forside=danmark&tid=aften"), "aften");
  for (const search of ["", "?tid=auto", "?tid=../image", "?tid=night"])
    assert.equal(sceneModeFromSearch(search), "auto");
});
test("every time of day has all three places without leaking into another time pool", async () => {
  const { places, dayParts, landscapeScene } = await import(
    "../src/landing-scenes"
  );
  const ids = new Set<string>();
  for (const part of dayParts)
    for (const place of places) {
      const scene = landscapeScene(part, place);
      assert.equal(scene.part, part);
      assert.equal(scene.place, place);
      ids.add(scene.id);
    }
  assert.equal(ids.size, 12);
});
test("a repeat visit chooses a different place within the same time pool", async () => {
  const { places, pickPlace, placeFromSearch } = await import(
    "../src/landing-scenes"
  );
  for (const last of places)
    for (const random of [0, 0.49, 0.99]) {
      const next = pickPlace(last, random);
      assert.notEqual(next, last);
      assert.ok(places.includes(next));
    }
  assert.equal(placeFromSearch("?sted=kolonihaven"), "kolonihaven");
  assert.equal(placeFromSearch("?sted=../../private"), null);
});
