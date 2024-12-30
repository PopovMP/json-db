import {join, dirname}                from "node:path";
import {fileURLToPath}                from "node:url";
import {afterEach, describe, test}    from "node:test";
import {deepStrictEqual, strictEqual} from "node:assert";

import {initDb, getDb} from "../lib/db.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

initDb(join(__dirname, "db"));

afterEach(() => {
    const db = getDb("foo");
    db.remove({}, {multi: true, skipSave: true});
});

describe("getDb", () => {

    test("getDb sets the dbName", () => {
        const db = getDb("foo");

        strictEqual(db.dbName, "foo");
    });

    test("getDb gets ref to the DB", () => {
        const db1 = getDb("foo");
        const db2 = getDb("foo");

        deepStrictEqual(db1, db2);
    });

    test("getDb count all docs", () => {
        const db = getDb("foo");
        db.insert({name: "foo"}, {skipSave: true});
        db.insert({name: "bar"}, {skipSave: true});
        db.insert({name: "baz"}, {skipSave: true});

        strictEqual(db.count({}), 3);
    });

    test("getDb count some docs", () => {
        const db = getDb("foo");
        db.insert({name: "foo"}, {skipSave: true});
        db.insert({name: "bar"}, {skipSave: true});
        db.insert({name: "baz"}, {skipSave: true});

        strictEqual(db.count({name: {$like: "BA"}}), 2);
    });

    test("getDb find all docs", () => {
        const db = getDb("foo");
        db.insert({name: "foo"}, {skipSave: true});
        db.insert({name: "bar"}, {skipSave: true});
        db.insert({name: "baz"}, {skipSave: true});

        const docs = db.find({});
        strictEqual(docs.length, 3);
    });

    test("getDb find some docs", () => {
        const db = getDb("foo");
        db.insert({name: "foo"}, {skipSave: true});
        db.insert({name: "bar"}, {skipSave: true});
        db.insert({name: "baz"}, {skipSave: true});

        const docs = db.find({name: {$like: "BA"}});
        strictEqual(docs.length, 2);
    });

    test("getDb findOne gets a doc", () => {
        const db = getDb("foo");
        db.insert({name: "foo"}, {skipSave: true});
        db.insert({name: "bar"}, {skipSave: true});
        db.insert({name: "baz"}, {skipSave: true});

        const doc = db.findOne({name: {$like: "BA"}}, {name: 1});
        strictEqual(doc.name, "bar");
    });

    test("getDb inserts docs", () => {
        const db = getDb("foo");
        db.insert({name: "foo"}, {skipSave: true});
        db.insert({name: "bar"}, {skipSave: true});
        db.insert({name: "baz"}, {skipSave: true});

        const docs = db.find({}, {});
        strictEqual(docs.length, 3);
    });

    test("getDb remove one doc", () => {
        const db = getDb("foo");
        db.insert({name: "foo"}, {skipSave: true});
        db.insert({name: "bar"}, {skipSave: true});
        db.insert({name: "baz"}, {skipSave: true});

        const numRemoved = db.remove({name: "foo"}, {skipSave: true});
        strictEqual(numRemoved, 1);
    });

    test("getDb removes multi", () => {
        const db = getDb("foo");
        db.insert({name: "foo"}, {skipSave: true});
        db.insert({name: "bar"}, {skipSave: true});
        db.insert({name: "baz"}, {skipSave: true});

        const numRemoved = db.remove({name: {$exists: 1}}, {multi: true, skipSave: true});
        strictEqual(numRemoved, 3);
    });

    test("getDb does not remove multi", () => {
        const db = getDb("foo");
        db.insert({name: "foo"}, {skipSave: true});
        db.insert({name: "bar"}, {skipSave: true});
        db.insert({name: "baz"}, {skipSave: true});

        const numRemoved = db.remove({name: {$exists: 1}});
        strictEqual(numRemoved, 0);
    });

    test("getDb update one doc", () => {
        const db = getDb("foo");
        db.insert({name: "foo"}, {skipSave: true});
        db.insert({name: "bar"}, {skipSave: true});
        db.insert({name: "baz"}, {skipSave: true});

        const numUpdated = db.update(
            {name: "foo"},
            {$set: {name: "qux"}},
            {skipSave: true});
        strictEqual(numUpdated, 1);
        strictEqual(db.count({name: "qux"}), 1);
    });

    test("getDb updates multi", () => {
        const db = getDb("foo");
        db.insert({name: "foo"}, {skipSave: true});
        db.insert({name: "bar"}, {skipSave: true});
        db.insert({name: "baz"}, {skipSave: true});

        const numUpdated = db.update(
            {name: {$exists: 1}},
            {$set: {name: "qux"}},
            {multi: true, skipSave: true},
        );
        strictEqual(numUpdated, 3);
    });

    test("getDb does not update multi", () => {
        const db = getDb("foo");
        db.insert({name: "foo"}, {skipSave: true});
        db.insert({name: "bar"}, {skipSave: true});
        db.insert({name: "baz"}, {skipSave: true});

        const numUpdated = db.update(
            {name: {$exists: 1}},
            {$set: {name: "qux"}},
            {skipSave: true},
        );
        strictEqual(numUpdated, 0);
    });
});
