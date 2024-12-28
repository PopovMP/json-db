import {join, dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {test}          from "node:test";
import {ok}            from "node:assert";
import console         from "node:console";

import {getDb, initDb} from "../index.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

initDb(join(__dirname, "db"));
const db = getDb("foo");

const countObjects = 1000;

preheatDb();

test("insert", () => {
    const timeStart = Date.now();

    let count = 0;
    for (let i = 0; i < countObjects; i++) {
        count += db.insert({index: i, b: 42}, {skipSave: true}) ? 1 : 0;
    }

    validate("insert", timeStart, count);
});

test("find", () => {
    const timeStart = Date.now();

    let count = 0;
    for (let i = 0; i < countObjects; i++) {
        count += db.find({index: i, b: {$gte: 42}}, {index: 1}).length;
    }

    validate("find", timeStart, count);
});

test("findOne", () => {
    const timeStart = Date.now();

    let count = 0;
    for (let i = 0; i < countObjects; i++) {
        count += db.findOne({index: i, b: {$gte: 42}}, {index: 1}) ? 1 : 0;
    }

    validate("findOne", timeStart, count);
});

test("findOne by _id", () => {
    const timeStart = Date.now();

    let count = 0;
    const ids = db.find({}, {_id: 1}).map((doc) => doc._id);
    for (const id of ids) {
        count += db.findOne({_id: id}, {index: 1}) ? 1 : 0;
    }

    validate("findOne by _id", timeStart, count);
});

test("update", () => {
    const timeStart = Date.now();

    let count = 0;
    for (let i = 0; i < countObjects; i++) {
        count += db.update({index: i, b: {$gte: 42}}, {$set: {b: 13}}, {skipSave: true});
    }

    validate("update", timeStart, count);
});

test("remove", () => {
    const timeStart = Date.now();

    let count = 0;
    for (let i = 0; i < countObjects; i++) {
        count += db.remove({index: i, b: {$lt: 42}}, {skipSave: true});
    }

    validate("remove", timeStart, count);
});

function preheatDb() {
    // Insert
    for (let i = 0; i < 100; i++) {
        db.insert({index: i, b: 42}, {skipSave: true});
    }
    // Find
    for (let i = 0; i < 100; i++) {
        db.find({index: i, b: {$gte: 42}}, {index: 1});
    }
    // FindOne
    for (let i = 0; i < 100; i++) {
        db.findOne({index: i, b: {$gte: 42}}, {index: 1});
    }
    // Update
    for (let i = 0; i < 100; i++) {
        db.update({index: i, b: {$gte: 42}}, {$set: {b: 13}}, {skipSave: true});
    }
    // Remove
    for (let i = 0; i < 100; i++) {
        db.remove({index: i, b: {$lt: 42}}, {skipSave: true});
    }
}

function validate(operation, timeStart, count) {
    const time = Date.now() - timeStart;

    const opsPerSec = Math.round((1000 / (time || 1)) * countObjects);
    console.log(operation, count, "docs for", time, "ms.", opsPerSec, "ops/sec");
    ok(opsPerSec > 1000);
}
