import {describe, test} from "node:test";
import {strictEqual}    from "node:assert";

import {dbInsert}    from "../lib/db.mjs";

function getDocMap() {
  return {
    "1": {_id: "1", val: 1},
    "2": {_id: "2", val: 2},
    "3": {_id: "3", val: 3},
  };
}

describe("dbInsert", () => {
  test("dbInsert inserts a doc", () => {
    /** @type {import("../index.mjs").DocMap} */
    const docMap = getDocMap();
    const id     = dbInsert(docMap, {val: 4});
    const doc    = docMap[id];
    strictEqual(doc.val, 4);
  });

  test("dbInsert creates a proper _id", () => {
    /** @type {import("../index.mjs").Doc} */
    const docMap = getDocMap();
    const id     = dbInsert(docMap, {});
    strictEqual(id.length, 16);
  });

  test("dbInsert inserts a doc with _id", () => {
    /** @type {import("../index.mjs").Doc} */
    const docMap = getDocMap();
    const id     = dbInsert(docMap, {_id: "4", val: 4});
    strictEqual(id, "4");
  });

  test("dbInsert cannot insert a doc with existing _id", () => {
    /** @type {import("../index.mjs").Doc} */
    const docMap = getDocMap();
    const id     = dbInsert(docMap, {_id: "1", val: 4});
    strictEqual(id, "");
  });

  test("dbInsert cannot insert a non-object", () => {
    const docMap = getDocMap();
    // @ts-ignore - testing invalid input
    const id     = dbInsert(docMap, "not an object");
    strictEqual(id, "");
  });

  test("dbInsert cannot insert an array", () => {
    /** @type {import("../index.mjs").Doc} */
    const docMap = getDocMap();
    // @ts-ignore - testing invalid input
    const id     = dbInsert(docMap, ["not an object"]);
    strictEqual(id, "");
  });

  test("dbInsert cannot insert null", () => {
    /** @type {import("../index.mjs").Doc} */
    const docMap = getDocMap();
    // @ts-ignore - testing invalid input
    const id     = dbInsert(docMap, null);
    strictEqual(id, "");
  });
});
