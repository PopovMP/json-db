import {test}        from "node:test";
import {strictEqual} from "node:assert";

import {dbProjection} from "../lib/db.mjs";

test("dbProjection gets complete doc given {}", () => {
    const doc = {_id: "1", val: 13, name: "Alice"};

    const res = dbProjection(doc, {});

    strictEqual(res._id, doc._id);
    strictEqual(res.val, doc.val);
    strictEqual(res.name, doc.name);
});

test("dbProjection gets complete doc", () => {
    const doc = {_id: "1", val: 13, name: "Alice"};

    const res = dbProjection(doc, {_id: 1, val: 1, name: 1});

    strictEqual(res._id, doc._id);
    strictEqual(res.val, doc.val);
    strictEqual(res.name, doc.name);
});

test("dbProjection gets partial doc", () => {
    const doc = {_id: "1", val: 13, name: "Alice"};

    const res = dbProjection(doc, {_id: 1, val: 1});

    strictEqual(res._id, doc._id);
    strictEqual(res.val, doc.val);
    strictEqual(res.name, undefined);
});

test("dbProjection does not get _id by default", () => {
    const doc = {_id: "1", val: 13, name: "Alice"};

    const res = dbProjection(doc, {val: 1});

    strictEqual(res._id, undefined);
    strictEqual(res.val, doc.val);
});

test("dbProjection accepts excluding values", () => {
    const doc = {_id: "1", val: 13, name: "Alice"};

    const res = dbProjection(doc, {name: 0});

    strictEqual(res._id, doc._id);
    strictEqual(res.val, doc.val);
    strictEqual(res.name, undefined);
});

test("dbProjection does not accept mixed values", () => {
    const doc = {_id: "1", val: 13, name: "Alice"};

    const res = dbProjection(doc, {val: 1, name: 0});

    strictEqual(res, undefined);
});
