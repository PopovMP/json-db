// noinspection JSUnusedGlobalSymbols,DuplicatedCode

import {logWarning, logError} from "@popovmp/logger";

import {getDb} from "./db.mjs";

/** @typedef {import("../index.mjs").EndValue     } EndValue      */
/** @typedef {import("../index.mjs").Value        } Value         */
/** @typedef {import("../index.mjs").QueryOperator} QueryOperator */
/** @typedef {import("../index.mjs").Query        } Query         */
/** @typedef {import("../index.mjs").Projection   } Projection    */
/** @typedef {import("../index.mjs").DocMap       } DocMap        */
/** @typedef {import("../index.mjs").Update       } Update        */
/** @typedef {import("../index.mjs").InsertOptions} InsertOptions */
/** @typedef {import("../index.mjs").UpdateOptions} UpdateOptions */
/** @typedef {import("../index.mjs").RemoveOptions} RemoveOptions */
/** @typedef {import("../index.mjs").ApiReq       } ApiReq        */
/** @typedef {import("../index.mjs").ApiRes       } ApiRes        */

/** @type {Record<string, (req: ApiReq) => ApiRes>} */
const routActionMap = {
    "count"  : countAction,
    "find"   : findAction,
    "findOne": findOneAction,
    "insert" : insertAction,
    "remove" : removeAction,
    "update" : updateAction,
    "save"   : saveAction,
};

/**
 * Serve the DB
 *
 * @param {ApiReq} req
 * @returns {ApiRes}
 */
export function callDbAction(req) {
    if (!routActionMap[req.actionName]) {
        logWarning(`Invalid actionName: ${req.actionName}`, "json-db :: callDbAction");
        return {status: 400, err: `Invalid actionName: ${req.actionName}`, data: null};
    }

    return routActionMap[req.actionName](req);
}

/**
 * Counts documents
 *
 * @param {ApiReq} req
 * @returns {ApiRes}
 */
function countAction(req) {
    const whoAmI = "json-db :: countAction";
    const {dbName, query} = req;

    if (typeof dbName !== "string") {
        const message = "Invalid dbName provided";
        logWarning(message, whoAmI);
        return {status: 400, err: message, data: 0};
    }

    if (typeof query !== "object" || query === null) {
        const message = "Invalid query provided";
        logWarning(message, whoAmI);
        return {status: 400, err: message, data: 0};
    }

    try {
        /** @type {JsonDB} */
        const db = getDb(dbName);

        /** @type {number} */
        const cnt = db.count(query);

        // Respond
        return {status: 200, err: null, data: cnt};
    } catch (/** @type {any} */ err) {
        logError(err.message, whoAmI);
        return {status: 500, err: err.message, data: 0};
    }
}

/**
 * Find documents in a database
 *
 * @param {ApiReq} req
 * @returns {ApiRes}
 */
function findAction(req) {
    const whoAmI = "json-db :: findAction";
    const {dbName, query, projection} = req;

    if (typeof dbName !== "string") {
        const message = "Invalid dbName provided";
        logWarning(message, whoAmI);
        return {status: 400, err: message, data: []};
    }

    if (typeof query !== "object" || query === null) {
        const message = "Invalid query provided";
        logWarning(message, whoAmI);
        return {status: 400, err: message, data: []};
    }

    if (typeof projection !== "object" || projection === null) {
        const message = "Invalid projection provided";
        logWarning(message, whoAmI);
        return {status: 400, err: message, data: []};
    }

    try {
        /** @type {JsonDB} */
        const db = getDb(dbName);

        /** @type {Doc[]} */
        const docs = db.find(query, projection);

        // Respond
        return {status: 200, err: null, data: docs};
    } catch (/** @type {any} */ err) {
        logError(err.message, whoAmI);
        return {status: 500, err: err.message, data: []};
    }
}

/**
 * Find a document in a database
 *
 * @param {ApiReq} req
 * @returns {ApiRes}
 */
function findOneAction(req) {
    const whoAmI = "json-db :: findOneAction";
    const {dbName, query, projection} = req;

    if (typeof dbName !== "string") {
        const message = "Invalid dbName provided";
        logWarning(message, whoAmI);
        return {status: 400, err: message, data: null};
    }

    if (typeof query !== "object" || query === null) {
        const message = "Invalid query provided";
        logWarning(message, whoAmI);
        return {status: 400, err: message, data: null};
    }

    if (typeof projection !== "object" || projection === null) {
        const message = "Invalid projection provided";
        logWarning(message, whoAmI);
        return {status: 400, err: message, data: null};
    }

    try {
        /** @type {JsonDB} */
        const db = getDb(dbName);

        /** @type {Doc|undefined} */
        const doc = db.findOne(query, projection);

        // Respond
        return {status: 200, err: null, data: doc};
    } catch (/** @type {any} */ err) {
        logError(err.message, whoAmI);
        return {status: 500, err: err.message, data: null};
    }
}

/**
 * Inserts a document in the DB.
 *
 * @param {ApiReq} req
 * @returns {ApiRes}
 */
function insertAction(req) {
    const whoAmI = "json-db :: insertAction";
    const {dbName, doc, options} = req;

    if (typeof dbName !== "string") {
        const message = "Invalid dbName provided";
        logWarning(message, whoAmI);
        return {status: 400, err: message, data: null};
    }

    if (typeof doc !== "object" || doc === null) {
        const message = "Invalid doc provided";
        logWarning(message, whoAmI);
        return {status: 400, err: message, data: null};
    }

    if (typeof options !== "object" && options === null) {
        const message = "Invalid options provided";
        logWarning(message, whoAmI);
        return {status: 400, err: message, data: null};
    }

    try {
        /** @type {JsonDB} */
        const db = getDb(dbName);

        /** @type {string} */
        const id = db.insert(doc, options);

        // Respond
        return {status: 200, err: null, data: id};
    } catch (/** @type {any} */ err) {
        logError(err.message, whoAmI);
        return {status: 500, err: err.message, data: null};
    }
}

/**
 * Removes documents from the DB that match the query.
 *
 * @param {ApiReq} req
 * @returns {ApiRes}
 */
function removeAction(req) {
    const whoAmI = "json-db :: removeAction";
    /** @type { {sbName: string, query: Query, options:RemoveOptions} } */
    const {dbName, query, options} = req;

    if (typeof dbName !== "string") {
        const message = "Invalid dbName provided";
        logWarning(message, whoAmI);
        return {status: 400, err: message, data: 0};
    }

    if (typeof query !== "object" || query === null) {
        const message = "Invalid query provided";
        logWarning(message, whoAmI);
        return {status: 400, err: message, data: 0};
    }

    if (typeof options !== "object" || options === null) {
        const message = "Invalid options provided";
        logWarning(message, whoAmI);
        return {status: 400, err: message, data: 0};
    }

    try {
        /** @type {JsonDB} */
        const db = getDb(dbName);

        /** @type {number} */
        const numRemoved = db.remove(query, options);

        // Respond
        return {status: 200, err: null, data: numRemoved};
    } catch (/** @type {any} */ err) {
        logError(err.message, whoAmI);
        return {status: 500, err: err.message, data: 0};
    }
}

/**
 * Updates documents in the DB that match the query.
 *
 * @param {ApiReq} req
 * @returns {ApiRes}
 */
function updateAction(req) {
    const whoAmI = "json-db :: updateAction";
    const {dbName, query, update, options} = req;

    if (typeof dbName !== "string") {
        const message = "Invalid dbName provided";
        logWarning(message, whoAmI);
        return {status: 400, err: message, data: 0};
    }

    if (typeof query !== "object" || query === null) {
        const message = "Invalid query provided";
        logWarning(message, whoAmI);
        return {status: 400, err: message, data: 0};
    }

    if (typeof update !== "object" || update === null) {
        const message = "Invalid options provided";
        logWarning(message, whoAmI);
        return {status: 400, err: message, data: 0};
    }

    if (typeof options !== "object" || options === null) {
        const message = "Invalid options provided";
        logWarning(message, whoAmI);
        return {status: 400, err: message, data: 0};
    }

    try {
        /** @type {JsonDB} */
        const db = getDb(dbName);

        /** @type {number} */
        const numUpdated = db.update(query, update, options);

        // Respond
        return {status: 200, err: null, data: numUpdated};
    } catch (/** @type {any} */ err) {
        logError(err.message, whoAmI);
        return {status: 500, err: err.message, data: 0};
    }
}

/**
 * Saves the DB to the file system.
 *
 * @param {ApiReq} req
 * @returns {ApiRes}
 */
function saveAction(req) {
    const whoAmI = "json-db :: saveAction";
    const {dbName} = req;

    if (typeof dbName !== "string") {
        const message = "Invalid dbName provided";
        logWarning(message, whoAmI);
        return {status: 400, err: message, data: 0};
    }

    try {
        /** @type {JsonDB} */
        const db = getDb(dbName);

        db.save();

        // Respond
        return {status: 200, err: null, data: 1};
    } catch (/** @type {any} */ err) {
        logError(err.message, whoAmI);
        return {status: 500, err: err.message, data: 0};
    }
}
