import {test}        from "node:test";
import {strictEqual} from "node:assert";

import {dbInsert}    from "../index.mjs";

function getDocMap() {
    return {
        "1": {_id: "1", val: 1},
        "2": {_id: "2", val: 2},
        "3": {_id: "3", val: 3},
    };
}

test("dbInsert inserts a doc", () => {
    const docMap = getDocMap();
    const id     = dbInsert(docMap, {val: 4});
    const doc    = docMap[id];
    strictEqual(doc.val, 4);
});

test("dbInsert creates a proper _id", () => {
    const docMap = getDocMap();
    const id     = dbInsert(docMap, {});
    strictEqual(id.length, 16);
});

test("dbInsert inserts a doc with _id", () => {
    const docMap = getDocMap();
    const id     = dbInsert(docMap, {_id: "4", val: 4});
    strictEqual(id, "4");
});

test("dbInsert cannot insert a doc with existing _id", () => {
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
    const docMap = getDocMap();
    // @ts-ignore - testing invalid input
    const id     = dbInsert(docMap, ["not an object"]);
    strictEqual(id, "");
});

test("dbInsert cannot insert null", () => {
    const docMap = getDocMap();
    // @ts-ignore - testing invalid input
    const id     = dbInsert(docMap, null);
    strictEqual(id, "");
});
