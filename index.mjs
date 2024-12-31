

/** @typedef {(number|string|boolean|null)} EndValue */

/** @typedef {(EndValue|EndValue[]|Record<string, EndValue|EndValue[]|Record<string, EndValue>>)} Value */

/** @typedef {any} Doc */

/**
 * @typedef {Object} QueryOperator
 *
 * @property {boolean|1|0}       [$exists]
 * @property {number|string}     [$eq]
 * @property {number|string}     [$ne]
 * @property {number|string}     [$gt]
 * @property {number|string}     [$gte]
 * @property {number|string}     [$lt]
 * @property {number|string}     [$lte]
 * @property {string[]|number[]} [$in]
 * @property {string[]|number[]} [$nin]
 * @property {EndValue}          [$includes]
 * @property {string}            [$like]
 * @property {"number"|"string"|"boolean"|"null"|"array"|"object"} [$type]
 */

/** @typedef {any} Query */

/** @typedef {Record<string, number>} Projection */

/** @typedef {Record<string, Doc>} DocMap */

/**
 * @typedef {Object} Update
 * @property {Record<string, number>}      [$inc]
 * @property {Record<string, Value>}       [$push]
 * @property {Record<string, string>}      [$rename]
 * @property {Record<string, Value>}       [$set]
 * @property {Record<string, 0|1|boolean>} [$unset]
 */

/**
 * @typedef {Object} InsertOptions
 * @property {boolean} [skipSave]
 */

/**
 * @typedef {Object} UpdateOptions
 * @property {boolean} [multi]
 * @property {boolean} [skipSave]
 */

/**
 * @typedef {Object} RemoveOptions
 * @property {boolean} [multi]
 * @property {boolean} [skipSave]
 */

/**
 * @typedef {Object} ApiReq
 *
 * @property {string}     dbName
 * @property {string}     actionName
 * @property {Query}      [query]
 * @property {Update}     [update]
 * @property {Projection} [projection]
 * @property {Doc}        [doc]
 * @property {InsertOptions|UpdateOptions|RemoveOptions} [options]
 */

/**
 * @typedef {Object} ApiRes
 *
 * @property {number}      status
 * @property {string|null} err
 * @property {any}         data
 */

/** @typedef {import("./lib/db.mjs").JsonDB} JsonDB */

export * from "./lib/db.mjs";
export * from "./lib/api.mjs";
