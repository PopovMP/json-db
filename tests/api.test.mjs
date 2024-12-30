import {join, dirname}                from "node:path";
import {fileURLToPath}                from "node:url";
import {afterEach, describe, test}    from "node:test";
import {deepStrictEqual, strictEqual} from "node:assert";

import {initDb, getDb}    from "../lib/db.mjs";
import {callJsonDBAction} from "../lib/api.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

initDb(join(__dirname, "db"));

afterEach(() => {
    const db = getDb("foo");
    db.remove({}, {multi: true, skipSave: true});
});

describe("DB API", () => {
    test("insert document", () => {
        const foo = getDb("foo");

        const dbReq = {
            dbName    : "foo",
            actionName: "insert",
            doc       : {name: "bar"},
            options   : {skipSave: true},
        };

        const res = callJsonDBAction(dbReq);

        strictEqual(res.status, 200);
        const actual = foo.findOne({_id: res.data}, {});
        deepStrictEqual(actual.name, "bar");
    });

    test("find one document", () => {
        const foo = getDb("foo");
        const doc = {name: "bar", val: 42};
        foo.insert(doc, {skipSave: true});

        const dbReq = {
            dbName    : "foo",
            actionName: "findOne",
            query     : {name: "bar"},
            projection: {val: 1},
        };

        const res = callJsonDBAction(dbReq);

        strictEqual(res.status, 200);

        strictEqual(res.data.val, 42);
        strictEqual(res.data._id, undefined);
        strictEqual(res.data.name, undefined);
    });

    test("find documents", () => {
        const foo = getDb("foo");
        foo.insert({name: "foo", val: 42}, {skipSave: true});
        foo.insert({name: "bar", val: 42}, {skipSave: true});
        foo.insert({name: "baz", val: 42}, {skipSave: true});

        const dbReq = {
            dbName    : "foo",
            actionName: "find",
            query     : {val: 42},
            projection: {name: 1},
        };

        const res = callJsonDBAction(dbReq);

        strictEqual(res.data.length, 3);
        strictEqual(res.data[0].name, "foo");
        strictEqual(res.data[1].name, "bar");
        strictEqual(res.data[2].name, "baz");
    });

    test("count documents", () => {
        const foo = getDb("foo");
        foo.insert({name: "foo", val: 42}, {skipSave: true});
        foo.insert({name: "bar", val: 13}, {skipSave: true});
        foo.insert({name: "baz", val: 13}, {skipSave: true});

        const dbReq = {
            dbName    : "foo",
            actionName: "count",
            query     : {val: 13},
        };

        const res = callJsonDBAction(dbReq);

        strictEqual(res.data, 2);
    });

    test("update document", () => {
        const foo = getDb("foo");
        foo.insert({name: "foo", val: 42}, {skipSave: true});

        const dbReq = {
            dbName    : "foo",
            actionName: "update",
            query     : {name: "foo"},
            update    : {$set: {val: 13}},
            options   : {skipSave: true},
        };

        const res = callJsonDBAction(dbReq);

        strictEqual(res.status, 200);
        strictEqual(res.data,     1);
        const actual = foo.findOne({name: "foo"}, {val: 1});
        deepStrictEqual(actual.val, 13);
    });

    test("remove document", () => {
        const foo = getDb("foo");
        foo.insert({name: "foo", val: 42}, {skipSave: true});

        const dbReq = {
            dbName    : "foo",
            actionName: "remove",
            query     : {name: "foo"},
            options   : {skipSave: true, multi: false},
        };

        const res = callJsonDBAction(dbReq);

        strictEqual(res.status, 200);
        strictEqual(res.data,     1);
        const actual = foo.findOne({name: "foo"}, {val: 1});
        deepStrictEqual(actual, undefined);
    });
});
