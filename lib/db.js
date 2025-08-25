// noinspection JSUnusedGlobalSymbols

import {join}                     from "node:path";
import {existsSync, readFileSync} from "node:fs";

import {writeAndForget, setErrorHandler} from "@popovmp/file-writer";
import {logError, logInfo} from "@popovmp/logger";

/** @typedef { import("../index.js").EndValue      } EndValue      */
/** @typedef { import("../index.js").Value         } Value         */
/** @typedef { import("../index.js").QueryOperator } QueryOperator */
/** @typedef { import("../index.js").Query         } Query         */
/** @typedef { import("../index.js").Projection    } Projection    */
/** @typedef { import("../index.js").DocMap        } DocMap        */
/** @typedef { import("../index.js").Update        } Update        */
/** @typedef { import("../index.js").InsertOptions } InsertOptions */
/** @typedef { import("../index.js").UpdateOptions } UpdateOptions */
/** @typedef { import("../index.js").RemoveOptions } RemoveOptions */
/** @typedef { import("../index.js").Doc           } Doc           */

/** @type { string } */
let dbDir = "";

/** @type { Record<string, DocMap> } */
const dbHolder = {};

/**
 * Initializes the database.
 * @param { string } dirPath
 * @returns { void }
 */
export function initDb(dirPath) {
  dbDir = dirPath;
}

export class JsonDB {
  /** @type { string } */
  dbName;

  /** @type { DocMap } */
  docMap;

  /**
   * @param { string } dbName
   * @param { DocMap } docMap
   */
  constructor(dbName, docMap) {
    this.dbName = dbName;
    this.docMap = docMap;
  }

  /**
   * @method count - Counts the number of documents in the DB that match the query.
   * @param { Query } query
   * @returns { number }
   */
  count(query) {
    return dbQuery(this.docMap, query).length;
  }

  /**
   * @method find - Finds documents in the DB that match the query.
   *                Returns an array of matched documents or an empty array.
   * @param { Query      } query
   * @param { Projection } [projection={}]
   * @returns { Doc[] }
   */
  find(query, projection = {}) {
    return dbQuery(this.docMap, query).map((id) => dbProjection(this.docMap[id], projection));
  }

  /**
   * @method findOne - Finds the first document in the DB that matches the query.
   *                   Returns the matched document or `undefined`.
   * @param { Query     } query
   * @param { Projection} [projection={}]
   * @returns { Doc|undefined }
   */
  findOne(query, projection = {}) {
    /** @type { string } */
    const id = dbQueryOne(this.docMap, query);
    if (!id) return;

    /** @type { Doc } */
    const doc = this.docMap[id];

    return dbProjection(doc, projection);
  }

  /**
   * @method insert - Inserts a document in the DB.
   *                  Returns the id of the newly inserted document or an empty string.
   * @param { Doc           } doc
   * @param { InsertOptions } [options]
   * @returns { string }
   */
  insert(doc, options) {
    /** @type { string } */
    const id = dbInsert(this.docMap, doc);

    if (id !== "" && !options?.skipSave) {
      this.save();
    }

    return id;
  }

  /**
   * @method remove - Removes documents from the DB that match the query.
   *                  Returns the number of removed documents.
   * @param { Query         } query
   * @param { RemoveOptions } [options]
   * @returns { number }
   */
  remove(query, options) {
    /** @type { string[] } */
    const ids = dbQuery(this.docMap, query);

    if (ids.length === 0) {
      return 0;
    }

    if (ids.length > 1 && !options?.multi) {
      logError("Cannot remove multiple docs without: {multi: true}", "remove");
      return 0;
    }

    for (const id of ids) {
      delete this.docMap[id];
    }

    if (!options?.skipSave) {
      this.save();
    }

    return ids.length;
  }

  /**
   * @method update - Updates documents in the DB that match the query.
   *                  Returns the number of updated documents.
   * @param { Query         } query
   * @param { Update        } update
   * @param { UpdateOptions } [options]
   * @returns { number }
   */
  update(query, update, options) {
    /** @type {string[]} */
    const ids = dbQuery(this.docMap, query);
    if (ids.length === 0) {
      return 0;
    }

    if (ids.length > 1 && !options?.multi) {
      logError("Cannot update multiple docs without: {multi: true}", "json-db :: update");
      return 0;
    }

    let numUpdated = 0;
    for (const id of ids) {
      numUpdated += dbUpdate(this.docMap[id], update);
    }

    if (numUpdated > 0 && !options?.skipSave) {
      this.save();
    }

    return numUpdated;
  }

  /**
   * @method save - Saves the DB to the file system.
   * @returns {void}
   */
  save() {
    const content  = JSON.stringify(this.docMap);
    const filepath = join(dbDir, this.dbName + ".json");
    writeAndForget(filepath, content);
  }
}

/**
 * Matches query against DB and returns an array of the matched ids.
 * @param { DocMap } db
 * @param { Query  } query
 * @returns { string[] } - an array of matched ids or an empty array
 */
export function dbQuery(db, query) {
  if (!validateQuery(query)) {
    return [];
  }

  /** @typeof {string[]} */
  const queryKeys = Object.keys(query);

  // Gets all _id if the query is empty
  if (queryKeys.length === 0) {
    return Object.keys(db);
  }

  // Query a single doc by _id
  if (queryKeys.length === 1 && typeof query._id === "string") {
    return db[query._id] ? [query._id] : [];
  }

  /** @typeof {string[]} */
  const ids = [];

  for (const id of Object.keys(db)) {
    if (evalQuery(db[id], query)) {
      ids.push(id);
    }
  }

  return ids;
}

/**
 * Matches query against DB and returns the first match ID or an empty string.
 * @param { DocMap } db
 * @param { Query  } query
 * @returns { string } - the _id of the selected doc or an empty string
 */
export function dbQueryOne(db, query) {
  if (!validateQuery(query)) {
    return "";
  }

  const queryKeys = Object.keys(query);

  // Query a single doc by _id
  if (queryKeys.length === 1 && typeof query._id === "string") {
    return db[query._id] ? query._id : "";
  }

  for (const id of Object.keys(db)) {
    if (evalQuery(db[id], query)) {
      return id;
    }
  }

  return "";
}

/**
 * Validates query syntax
 * Logs errors if any
 * @param { Query } query
 * @returns { boolean }
 */
function validateQuery(query) {
  if (typeof query !== "object" || Array.isArray(query) || query === null) {
    const qType = Array.isArray(query) ? "array" : query === null ? "null" : typeof query;
    logError(`The query is not an object. Given: ${qType}`, "query");
    return false;
  }

  for (const qName of Object.keys(query)) {
    // @ts-ignore
    const qVal = query[qName];

    switch (qName) {
      case "$and":
      case "$or":
        if (!Array.isArray(qVal)) {
          logError(`${qName} value is not an array. Given: ${typeof qVal}`, "query");
          return false;
        }
        if (!qVal.every(qry => validateQuery(qry))) {
          return false;
        }
        break;

      case "$not":
        if (!validateQuery(qVal)) {
          return false;
        }
        break;

      case "$where":
        if (typeof qVal !== "function") {
          logError(`$where value is not a function. Given: ${typeof qVal}`, "query");
          return false;
        }
        break;

      default:
        if (typeof qVal === "object" &&
            // @ts-ignore
            !Object.keys(qVal).every(opKey => validateOperator(opKey, qVal[opKey]))) {
          return false;
        }
    }
  }

  return true;
}

/**
 * Validates a query operator syntax
 * @param { keyof QueryOperator   } opKey - query opKey
 * @param { EndValue | EndValue[] } opVal - query operand
 * @returns { boolean }
 */
function validateOperator(opKey, opVal) {
  switch (opKey) {
    case "$exists":
      if (opVal !== true && opVal !== false && opVal !== 1 && opVal !== 0) {
        logError(`${opKey} operand is not true, false, 1, or 0. Given: ${typeof opVal}`, "query");
        return false;
      }
      break;

    case "$lt" :
    case "$lte":
    case "$gt" :
    case "$gte":
      if (typeof opVal !== "number" && typeof opVal !== "string") {
        logError(`${opKey} operand is not a string or a number. Given: ${typeof opVal}`, "query");
        return false;
      }
      break;

    case "$in" :
    case "$nin":
      if (!Array.isArray(opVal)) {
        logError(`${opKey} operand is not an array. Given: ${typeof opVal}`, "query");
        return false;
      }
      break;

    case "$includes":
    case "$eq":
    case "$ne":
      break;

    case "$like":
      if (typeof opVal !== "string") {
        return false;
      }
      break;

    case "$type":
      if (typeof opVal !== "string") {
        logError(`${opKey} operand is not a string. Given: ${typeof opVal}`, "query");
        return false;
      }
      break;

    default:
      logError(`Unknown query operator. Given: ${opKey}`, "query");
      return false;
  }

  return true;
}

/**
 * Evaluates a query against a doc
 * @param { Doc   } doc
 * @param { Query } query
 * @returns { boolean }
 */
function evalQuery(doc, query) {
  for (const qName of Object.keys(query)) {
    // @ts-ignore
    const qVal = query[qName];

    switch (qName) {
      case "$and": {
        for (const qRule of qVal) {
          if (!evalQuery(doc, qRule)) {
            return false;
          }
        }
        break;
      }
      case "$or": {
        let isMatch = false;
        for (const qRule of qVal) {
          if (evalQuery(doc, qRule)) {
            isMatch = true;
            break;
          }
        }
        if (!isMatch) {
          return false;
        }
        break;
      }
      case "$not": {
        if (evalQuery(doc, qVal)) {
          return false;
        }
        break;
      }
      case "$where": {
        if (!qVal(doc)) {
          return false;
        }
        break;
      }
      default: {
        if (typeof qVal === "object") {
          // @ts-ignore
          if (!evalOperatorSet(doc[qName], qVal)) {
            return false;
          }
          // @ts-ignore
        } else if (doc[qName] !== qVal) {
          return false;
        }
        break;
      }
    }
  }

  return true;
}

/**
 * Evaluates an operator set against a doc's value
 *
 * @param { Value                 } docVal - the value of the doc's filed of interest
 * @param { Record<string, Value> } opSet - {opKey: opVal, ...}
 *
 * @return { boolean }
 */
function evalOperatorSet(docVal, opSet) {
  for (const key of Object.keys(opSet)) {
    if (!evalOperator(docVal, key, opSet[key])) {
      return false;
    }
  }

  return true;
}

/**
 * Evaluates a query operator against a doc's value
 *
 * @param { Value  } docVal - target value of the doc's field of interest
 * @param { string } opKey - query opKey
 * @param { Value  } opVal - query operand
 *
 * @return { boolean }
 */
function evalOperator(docVal, opKey, opVal) {
  switch (opKey) {
    case "$exists":
      return opVal ? docVal !== undefined : docVal === undefined;
    case "$lt":
      if ((typeof docVal === "string" && typeof opVal === "string") ||
          (typeof docVal === "number" && typeof opVal === "number")) {
        return docVal < opVal;
      }
      return false;
    case "$lte":
      if ((typeof docVal === "string" && typeof opVal === "string") ||
          (typeof docVal === "number" && typeof opVal === "number")) {
        return docVal <= opVal;
      }
      return false;
    case "$gt":
      if ((typeof docVal === "string" && typeof opVal === "string") ||
          (typeof docVal === "number" && typeof opVal === "number")) {
        return docVal > opVal;
      }
      return false;
    case "$gte":
      if ((typeof docVal === "string" && typeof opVal === "string") ||
          (typeof docVal === "number" && typeof opVal === "number")) {
        return docVal >= opVal;
      }
      return false;
    case "$in":
      return (/** @type { Value[] } */ (opVal)).includes(docVal);
    case "$includes":
      if (typeof docVal === "string") {
        return typeof opVal === "string" && docVal.includes(opVal);
      }
      if (Array.isArray(docVal)) {
        return docVal.includes(/** @type { EndValue } */ (opVal));
      }
      return false;
    case "$nin":
      return !(/** @type { Value[] } */ (opVal)).includes(docVal);
    case "$eq":
      return docVal === opVal;
    case "$ne":
      return docVal !== opVal;
    case "$like":
      if (typeof opVal === "string" && typeof docVal === "string") {
        return new RegExp(opVal, "i").test(docVal);
      }
      return false;
    case "$type": {
      if (opVal === "array") {
        return Array.isArray(docVal);
      }
      if (opVal === "null") {
        return docVal === null;
      }
      return (typeof docVal) === opVal;
    }
    default:
      return false;
  }
}

/**
 * Gets a copy of a doc, which includes only the wanted (or excludes the unwanted) properties.
 * The projection is ether inclusive or exclusive.
 * @param {Doc}     doc
 * @param {Projection} projection
 * @returns {Doc|undefined}
 */
export function dbProjection(doc, projection) {
  if (typeof projection !== "object" || Array.isArray(projection) || projection === null) {
    logError(`The projection is not an object. Given: ${projection}`, "dbProjection");
    return;
  }

  const projKeys = Object.keys(projection);

  if (projKeys.length === 0) {
    return /** @type {Doc} */ structuredClone(doc);
  }

  const inclusiveKeysCount = Object.values(projection).reduce((sum, val) => sum + (val ? 1 : 0), 0);
  if (inclusiveKeysCount > 0 && inclusiveKeysCount !== projKeys.length) {
    logError(`The projection values are mixed. Given: ${JSON.stringify(projection)}`, "dbProjection");
    return;
  }

  const output = /** @type {import("../index.js").Doc} */ ({});

  if (inclusiveKeysCount > 0) {
    for (const key of projKeys) {
      output[key] = structuredClone(doc[key]);
    }
  } else {
    for (const key of Object.keys(doc)) {
      if (projection[key] === undefined) {
        output[key] = structuredClone(doc[key]);
      }
    }
  }

  return output;
}

/**
 * Inserts a doc in DB
 * Returns the id of the newly inserted document an empty string
 *
 * @param { DocMap } db
 * @param { Doc    } doc
 *
 * @returns {string}
 */
export function dbInsert(db, doc) {
  if (typeof doc !== "object" || Array.isArray(doc) || doc === null) {
    logError("The document being inserted is not an object", "dbInsert");
    return "";
  }

  return typeof doc._id === "string" && doc._id.length > 0
      ? insertDocWithId(db, doc)
      : insertDoc(db, doc);
}

/**
 * Inserts a doc with an _id
 *
 * @param { DocMap } db
 * @param { {_id: string} } doc
 *
 * @returns {string}
 */
function insertDocWithId(db, doc) {
  const id = doc._id;

  if (db[id]) {
    logError("The _id is not unique.", "insertDocWithId");
    return "";
  }

  db[id] = structuredClone(doc);

  return id;
}

/**
 * Inserts a doc
 *
 * @param { DocMap } db
 * @param { Doc    } doc
 *
 * @returns { string }
 */
function insertDoc(db, doc) {
  /** @type {string} */
  const id = makeId(db);

  db[id] = structuredClone(doc);
  db[id]._id = id;

  return id;
}

/**
 * Updates a document
 *
 * @param { Doc    } doc
 * @param { Update } update
 *
 * @return { number } numUpdated: 0 - doc is not updated, 1 - doc is updated,
 */
export function dbUpdate(doc, update) {
  if (typeof update !== "object" || Array.isArray(update) || update === null) {
    logError("The update is not an object", "dbUpdate");
    return 0;
  }

  let numUpdated = 0;

  /** @type {string[]} */
  const operators = Object.keys(update);

  if (operators.length === 0) {
    logError("The update has no operators", "dbUpdate");
    return 0;
  }

  for (const operator of operators) {
    // @ts-ignore
    const operand = update[operator];

    switch (operator) {
      case "$inc":
        for (const [field, delta] of Object.entries(operand)) {
          if (typeof delta !== "number") {
            logError("Cannot $inc with a non-numeric delta", "dbUpdate");
            continue;
          }

          switch (typeof doc[field]) {
            case "number":
              doc[field] += delta;
              numUpdated = 1;
              break;
            case "undefined":
              doc[field] = delta;
              numUpdated = 1;
              break;
            default:
              logError(`Cannot $inc field of type: ${typeof doc[field]}`, "dbUpdate");
          }
        }
        break;

      case "$push":
        for (const [field, value] of Object.entries(operand)) {
          if (doc[field] === undefined) {
            doc[field] = [structuredClone(value)];
            numUpdated = 1;
            continue;
          }

          if (!Array.isArray(doc[field])) {
            logError(`Cannot $push to field of type: ${typeof doc[field]}`, "dbUpdate");
            continue;
          }

          doc[field].push(structuredClone(value));
          numUpdated = 1;
        }
        break;

      case "$rename":
        for (const [field, newName] of Object.entries(operand)) {
          if (field === "_id") {
            logError("Cannot $rename _id", "dbUpdate");
            continue;
          }

          if (typeof newName !== "string") {
            logError("Cannot $rename to a non-string name", "dbUpdate");
            continue;
          }

          if (doc[newName] !== undefined) {
            logError("Cannot $rename to an existing name", "dbUpdate");
            continue;
          }

          if (doc[field] !== undefined) {
            doc[newName] = structuredClone(doc[field]);
            delete doc[field];
            numUpdated = 1;
            continue;
          }

          logError("Cannot $rename a non-existing field", "dbUpdate");
        }
        break;

      case "$set":
        for (const [field, value] of Object.entries(operand)) {
          if (field === "_id") {
            logError("Cannot $set _id", "dbUpdate");
            continue;
          }

          doc[field] = structuredClone(value);
          numUpdated = 1;
        }
        break;

      case "$unset":
        for (const [field, flag] of Object.entries(operand)) {
          if (field === "_id") {
            logError("Cannot $unset _id", "dbUpdate");
            continue;
          }

          if (doc[field] !== undefined && flag) {
            delete doc[field];
            numUpdated = 1;
          }
        }
        break;

      default:
        logError(`Wrong update operator. Given: ${operator}`, "dbUpdate");
    }
  }

  return numUpdated;
}

/**
 * Makes a unique doc id.
 * @param { DocMap } db
 * @returns { string }
 */
function makeId(db) {
  /** @type {string} */
  const id = uid(16);
  return db[id] === undefined ? id : makeId(db);
}

/**
 * Generates a random URL safe uid
 * @param { number } len
 * @returns { string }
 */
function uid(len) {
  // noinspection SpellCheckingInspection - it's a valid alphabet
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_";
  const chars    = [];
  for (let i = 0; i < len; i++) {
    chars[i] = alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return chars.join("");
}

/**
 * Get the value of a key from the database.
 * @param { string }  dbName
 * @returns { JsonDB }
 */
export function getDb(dbName) {
  if (dbDir === "") {
    throw new Error("Database directory is not set");
  }

  if (dbName.endsWith(".json")) {
    dbName = dbName.slice(0, -5);
  }

  if (!dbHolder[dbName]) {
    const fileName = join(dbDir, dbName + ".json");

    // Check if the DB file exists
    if (!existsSync(fileName)) {
      logError(`Database not found: "${dbName}"`, "json-db :: getDb");
      throw new Error("Database not found");
    }

    // Load the DB from the file
    try {
      /** @type { string } */
      const content = readFileSync(fileName, {encoding: "utf8"});
      /** @type { DocMap } */
      const db = dbHolder[dbName] = JSON.parse(content);
      logInfo(`Database loaded: ${dbName}, Records: ${Object.keys(db).length}`, "json-db :: getDb");
    } catch (/** @type { any } */ err) {
      logError((/** @type { Error } */ (err)).message, "json-db :: getDb");
      throw new Error("Database read failed");
    }
  }

  return new JsonDB(dbName, dbHolder[dbName]);
}

/**
 * Removes the local reference to the database.
 * @param { string } name
 * @returns { void }
 */
export function closeDb(name) {
  if (dbHolder[name]) {
    delete dbHolder[name];
  } else {
    logError(`DB does not exist: ${name}`, "closeDb");
  }
}

setErrorHandler((err, filepath, stage) => {
  logError(`[file-writer] ${stage} ${err.message} for ${filepath}`, "json-db");
});
