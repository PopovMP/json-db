import {describe, test} from "node:test";
import {strictEqual}    from "node:assert";

import {dbQuery, dbQueryOne} from "../lib/db.mjs";

function getDocMap() {
  return {
    "1": {_id: "1", name: "foo", val: 1, vals: [1]},
    "2": {_id: "2", name: "bar", val: 2, vals: [1, 2]},
    "3": {_id: "3", name: "baz", val: 3, vals: [1, 2, 3]},
  };
}

describe("dbQuery", () => {
  test("dbQuery gets all _id if the query is empty", () => {
    const docMap = getDocMap();
    const ids    = dbQuery(docMap, {});
    strictEqual(ids.length, 3);
    strictEqual(ids[0], "1");
  });

  test("dbQuery gets a single doc by _id", () => {
    const docMap = getDocMap();
    const ids    = dbQuery(docMap, {_id: "3"});
    strictEqual(ids.length, 1);
    strictEqual(ids[0], "3");
  });

  test("dbQueryOne gets first _id if the query is empty", () => {
    const docMap = getDocMap();
    const id     = dbQueryOne(docMap, {});
    strictEqual(id, "1");
  });

  test("dbQueryOne gets a single doc by _id", () => {
    const docMap = getDocMap();
    const id     = dbQueryOne(docMap, {_id: "3"});
    strictEqual(id, "3");
  });

  test("$exists when $exists: 1", () => {
    const docMap = getDocMap();
    const ids    = dbQuery(docMap, {val: {$exists: 1}});
    strictEqual(ids.length, 3);
  });

  test("$exists when $exists: 0 and props", () => {
    const docMap = getDocMap();
    const ids    = dbQuery(docMap, {val: {$exists: 0}});
    strictEqual(ids.length, 0);
  });

  test("$exists when $exists: 0 and no props", () => {
    const docMap = getDocMap();
    const ids    = dbQuery(docMap, {foo: {$exists: 0}});
    strictEqual(ids.length, 3);
  });

  test("$lt by string", () => {
    const docMap = getDocMap();
    const ids    = dbQuery(docMap, {_id: {$lt: "3"}});
    strictEqual(ids.length, 2);
  });

  test("$lt by number", () => {
    const docMap = getDocMap();
    const ids    = dbQuery(docMap, {val: {$lt: 3}});
    strictEqual(ids.length, 2);
  });

  test("$lte by string", () => {
    const docMap = getDocMap();
    const ids    = dbQuery(docMap, {_id: {$lte: "3"}});
    strictEqual(ids.length, 3);
  });

  test("$lte by number", () => {
    const docMap = getDocMap();
    const ids    = dbQuery(docMap, {val: {$lte: 3}});
    strictEqual(ids.length, 3);
  });

  test("$gt by string", () => {
    const docMap = getDocMap();
    const ids    = dbQuery(docMap, {_id: {$gt: "1"}});
    strictEqual(ids.length, 2);
  });

  test("$gt by number", () => {
    const docMap = getDocMap();
    const ids    = dbQuery(docMap, {val: {$gt: 1}});
    strictEqual(ids.length, 2);
  });

  test("$gte by string", () => {
    const docMap = getDocMap();
    const ids    = dbQuery(docMap, {_id: {$gte: "1"}});
    strictEqual(ids.length, 3);
  });

  test("$gte by number", () => {
    const docMap = getDocMap();
    const ids    = dbQuery(docMap, {val: {$gte: 1}});
    strictEqual(ids.length, 3);
  });

  test("$in", () => {
    const docMap = getDocMap();
    const ids    = dbQuery(docMap, {val: {"$in": [1, 2, 4]}});
    strictEqual(ids.length, 2);
    strictEqual(ids[0], "1");
    strictEqual(ids[1], "2");
  });

  test("$nin", () => {
    const docMap = getDocMap();
    const ids    = dbQuery(docMap, {val: {"$nin": [1, 2, 4]}});
    strictEqual(ids.length, 1);
    strictEqual(ids[0], "3");
  });

  test("$includes string", () => {
    const docMap = getDocMap();
    const ids    = dbQuery(docMap, {name: {"$includes": "ba"}});
    strictEqual(ids.length, 2);
    strictEqual(ids[0], "2");
    strictEqual(ids[1], "3");
  });

  test("$includes array", () => {
    const docMap = getDocMap();
    const ids    = dbQuery(docMap, {vals: {"$includes": 2}});
    strictEqual(ids.length, 2);
    strictEqual(ids[0], "2");
    strictEqual(ids[1], "3");
  });

  test("$eq", () => {
    const docMap = getDocMap();
    const ids    = dbQuery(docMap, {val: {"$eq": 2}});
    strictEqual(ids.length, 1);
    strictEqual(ids[0], "2");
  });

  test("$ne", () => {
    const docMap = getDocMap();
    const ids    = dbQuery(docMap, {val: {"$ne": 2}});
    strictEqual(ids.length, 2);
    strictEqual(ids[0], "1");
    strictEqual(ids[1], "3");
  });

  test("$like", () => {
    const docMap = getDocMap();
    const ids    = dbQuery(docMap, {name: {"$like": "Ba"}});
    strictEqual(ids.length, 2);
    strictEqual(ids[0], "2");
    strictEqual(ids[1], "3");
  });

  test("$type string", () => {
    const docMap = getDocMap();
    const ids    = dbQuery(docMap, {name: {"$type": "string"}});
    strictEqual(ids.length, 3);
  });

  test("$type array", () => {
    const docMap = getDocMap();
    const ids    = dbQuery(docMap, {vals: {"$type": "array"}});
    strictEqual(ids.length, 3);
  });
});
