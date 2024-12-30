import {test}                         from "node:test";
import {deepStrictEqual, strictEqual} from "node:assert";

import {dbUpdate} from "../lib/db.mjs";

test("dbUpdate - update cannot be string", () => {
    const doc        = {_id: "1", val: 1};
    // @ts-expect-error - Testing string input
    // noinspection JSCheckFunctionSignatures
    const numUpdated = dbUpdate(doc, "not an object");
    strictEqual(numUpdated, 0);
});

test("dbUpdate - update cannot be null", () => {
    const doc        = {_id: "1", val: 1};
    // @ts-expect-error - Testing null input
    // noinspection JSCheckFunctionSignatures
    const numUpdated = dbUpdate(doc, null);
    strictEqual(numUpdated, 0);
});

test("dbUpdate - update cannot be an array", () => {
    const doc        = {_id: "1", val: 1};
    // @ts-expect-error - Testing array input
    // noinspection JSCheckFunctionSignatures
    const numUpdated = dbUpdate(doc, [42]);
    strictEqual(numUpdated, 0);
});

test("dbUpdate - update without operator", () => {
    const doc        = {_id: "1", val: 1};
    const numUpdated = dbUpdate(doc, {});
    strictEqual(numUpdated, 0);
});

test("dbUpdate - update with unknown operator", () => {
    const doc        = {_id: "1", val: 1};
    // @ts-expect-error - Testing unknown operator
    // noinspection JSCheckFunctionSignatures - Testing unknown operator
    const numUpdated = dbUpdate(doc, {$enlarge: {val: 2}});
    strictEqual(numUpdated, 0);
});

test("dbUpdate $inc single val", () => {
    const doc        = {_id: "1", val: 1};
    const numUpdated = dbUpdate(doc, {$inc: {val: 5}});
    strictEqual(numUpdated, 1);
    strictEqual(doc.val, 6);
});

test("dbUpdate $inc creates a field", () => {
    const doc        = {_id: "1"};
    const numUpdated = dbUpdate(doc, {$inc: {val: 42}});
    strictEqual(numUpdated, 1);
    strictEqual(doc.val, 42);
});

test("dbUpdate $inc multiple vals", () => {
    const doc        = {_id: "1", val: 1, coll: 2};
    const numUpdated = dbUpdate(doc, {$inc: {val: 5, coll: -1}});
    strictEqual(numUpdated, 1);
    strictEqual(doc.val, 6);
    strictEqual(doc.coll, 1);
});

test("dbUpdate $inc non-numeric delta", () => {
    const doc        = {_id: "1", val: 1};
    // @ts-expect-error - Testing non-numeric delta
    // noinspection JSCheckFunctionSignatures
    const numUpdated = dbUpdate(doc, {$inc: {val: "5"}});
    strictEqual(numUpdated, 0);
    strictEqual(doc.val, 1);
});

test("dbUpdate $inc non-numeric field", () => {
    const doc        = {_id: "1", name: "john"};
    const numUpdated = dbUpdate(doc, {$inc: {name: 1}});
    strictEqual(numUpdated, 0);
    strictEqual(doc.name, "john");
});

test("dbUpdate $push - single field", () => {
    const doc        = {_id: "1", vals: [1]};
    const numUpdated = dbUpdate(doc, {$push: {vals: 5}});
    strictEqual(numUpdated, 1);
    deepStrictEqual(doc.vals, [1, 5]);
});

test("dbUpdate $push - multiple fields", () => {
    const doc = {_id: "1", vals: [1], names: ["john"]};
    const n   = dbUpdate(doc, {$push: {vals: 5, names: "anny"}});
    strictEqual(n, 1);
    deepStrictEqual(doc.vals, [1, 5]);
    deepStrictEqual(doc.names, ["john", "anny"]);
});

test("dbUpdate $push - creates a field", () => {
    const doc        = {_id: "1"};
    const numUpdated = dbUpdate(doc, {$push: {vals: 5}});
    strictEqual(numUpdated, 1);
    deepStrictEqual(doc.vals, [5]);
});

test("dbUpdate $push - non-array field", () => {
    const doc        = {_id: "1", val: 1};
    const numUpdated = dbUpdate(doc, {$push: {val: 5}});
    strictEqual(numUpdated, 0);
    strictEqual(doc.val, 1);
});

test("dbUpdate $rename - single field", () => {
    const doc        = {_id: "1", val: 1};
    const numUpdated = dbUpdate(doc, {$rename: {val: "count"}});
    strictEqual(numUpdated, 1);
    strictEqual(doc.count, 1);
});

test("dbUpdate $rename - multiple fields", () => {
    const doc        = {_id: "1", val: 1, coll: 2};
    const numUpdated = dbUpdate(doc, {
        $rename: {val: "count", coll: "collection"},
    });
    strictEqual(numUpdated, 1);
    strictEqual(doc.count, 1);
    // noinspection JSUnresolvedReference
    strictEqual(doc.collection, 2);
});

test("dbUpdate $rename - cannot rename _id", () => {
    const doc        = {_id: "1", val: 1};
    const numUpdated = dbUpdate(doc, {$rename: {_id: "id"}});
    strictEqual(numUpdated, 0);
    strictEqual(doc._id, "1");
    strictEqual(doc.val, 1);
});

test("dbUpdate $rename - non-string new name", () => {
    const doc        = {_id: "1", val: 1};
    // @ts-expect-error - Testing non-string new name
    // noinspection JSCheckFunctionSignatures
    const numUpdated = dbUpdate(doc, {$rename: {val: 42}});
    strictEqual(numUpdated, 0);
    strictEqual(doc.val, 1);
});

test("dbUpdate $rename - existing field", () => {
    const doc        = {_id: "1", val: 1, count: 2};
    const numUpdated = dbUpdate(doc, {$rename: {val: "count"}});
    strictEqual(numUpdated, 0);
    strictEqual(doc.val, 1);
    strictEqual(doc.count, 2);
});

test("dbUpdate $rename - non-existing field", () => {
    const doc        = {_id: "1"};
    const numUpdated = dbUpdate(doc, {$rename: {count: "val"}});
    strictEqual(numUpdated, 0);
    strictEqual(doc.count, undefined);
});

test("dbUpdate $set - single field", () => {
    const doc        = {_id: "1", val: 1};
    const numUpdated = dbUpdate(doc, {$set: {val: 2}});
    strictEqual(numUpdated, 1);
    strictEqual(doc.val, 2);
});

test("dbUpdate $set - multiple fields", () => {
    const doc        = {_id: "1", val: 1, coll: 2};
    const numUpdated = dbUpdate(doc, {$set: {val: 2, coll: 3}});
    strictEqual(numUpdated, 1);
    strictEqual(doc.val, 2);
    strictEqual(doc.coll, 3);
});

test("dbUpdate $set - creates a field", () => {
    const doc        = {_id: "1"};
    const numUpdated = dbUpdate(doc, {$set: {val: 2}});
    strictEqual(numUpdated, 1);
    strictEqual(doc.val, 2);
});

test("dbUpdate $set - cannot set _id", () => {
    const doc        = {_id: "1", val: 1};
    const numUpdated = dbUpdate(doc, {$set: {_id: "2"}});
    strictEqual(numUpdated, 0);
    strictEqual(doc._id, "1");
    strictEqual(doc.val, 1);
});

test("dbUpdate $unset 1", () => {
    const doc        = {_id: "1", val: 1};
    const numUpdated = dbUpdate(doc, {$unset: {val: 1}});
    strictEqual(numUpdated, 1);
    strictEqual(doc.val, undefined);
});

test("dbUpdate $unset 0", () => {
    const doc        = {_id: "1", val: 1};
    const numUpdated = dbUpdate(doc, {$unset: {val: 0}});
    strictEqual(numUpdated, 0);
    strictEqual(doc.val, 1);
});

test("dbUpdate $unset - multiple fields", () => {
    const doc        = {_id: "1", val: 1, coll: 2};
    const numUpdated = dbUpdate(doc, {$unset: {val: 1, coll: 1}});
    strictEqual(numUpdated, 1);
    strictEqual(doc.val, undefined);
    strictEqual(doc.coll, undefined);
});

test("dbUpdate $unset - non-existing field", () => {
    const doc        = {_id: "1", val: 1};
    const numUpdated = dbUpdate(doc, {$unset: {count: 1}});
    strictEqual(numUpdated, 0);
    strictEqual(doc.val, 1);
});

test("dbUpdate $unset - _id", () => {
    const doc        = {_id: "1", val: 1};
    const numUpdated = dbUpdate(doc, {$unset: {_id: 1}});
    strictEqual(numUpdated, 0);
    strictEqual(doc._id, "1");
    strictEqual(doc.val, 1);
});

// dbUpdate - using multiple operators
test("dbUpdate - using multiple operators", () => {
    const doc        = {_id: "1", val: 1, coll: 2};
    const numUpdated = dbUpdate(doc, {
        $inc   : {val: 5, coll: -1},
        $push  : {vals: 5, names: "anny"},
        $rename: {val: "count", coll: "collection"},
        $set   : {name: "john"},
        $unset : {val: 1},
    });
    strictEqual(numUpdated, 1);
    strictEqual(doc.count, 6);
    // noinspection JSUnresolvedReference
    strictEqual(doc.collection, 1);
    deepStrictEqual(doc.vals, [5]);
    deepStrictEqual(doc.names, ["anny"]);
    strictEqual(doc.name, "john");
    strictEqual(doc.val, undefined);
});
