// types/index.d.ts
// noinspection JSUnusedGlobalSymbols

declare module "@popovmp/json-db" {
    /**
     * The atomic value.
     *
     * It can be a number, a string, a boolean, or null.
     */
    export type EndValue = number | string | boolean | null;

    /**
     * The value of a field in a document.
     *
     * It can be an atomic value, an array of atomic values, or a record.
     */
    export type Value =
        | EndValue
        | EndValue[]
        | Record<string, EndValue | EndValue[] | Record<string, EndValue>>;

    /**
     * Doc interface describe a document in the database.
     *
     * - `_id`: The unique identifier of the document.
     *
     * The document contains fields with values.
     *
     * The filed name cannot start with `$`
     *
     * The values can be atomic values, arrays of atomic values, or records.
     */
    export interface Doc {
        _id?: string;
        [property: string]: Value | undefined;
    }

    /**
     * Operator interface describes the query operators.
     *
     * - `$exists` - used to select docs by availability of a field.
     *   It accepts: true, false, 1, or 0.
     *   { name: { $exists: 1 } } - selects docs with the field `name`.
     *   { name: { $exists: 0 } } - selects docs without the field `name`.
     *
     * - `$eq` - used to select docs with a field equal to a value.
     *   $eq accepts a number or a string.
     *   { age: { $eq: 25 } } - selects docs with the field `age` equal to 25.
     *
     * - `$ne` - used to select docs with a field not equal to a value.
     *   $ne accepts a number or a string.
     *   { age: { $ne: 25 } } - selects docs with the field `age` not equal to 25.
     *
     * - `$gt` - used to select docs with a field greater than a value.
     *   $gt accepts a number or a string.
     *   { age: { $gt: 25 } } - selects docs with the field `age` greater than 25.
     *
     * - `$gte` - used to select docs with a field greater than or equal to a value.
     *  $gte accepts a number or a string.
     *  { age: { $gte: 25 } } - selects docs with the field `age` greater than or equal to 25.
     *
     * - `$lt` - used to select docs with a field less than a value.
     *  $lt accepts a number or a string.
     *  { age: { $lt: 25 } } - selects docs with the field `age` less than 25.
     *
     * - `$lte` - used to select docs with a field less than or equal to a value.
     *  $lte accepts a number or a string.
     *  { age: { $lte: 25 } } - selects docs with the field `age` less than or equal to 25.
     *
     * - `$in` - used to select docs with a field equal to one of the values in an array.
     *  $in accepts an array of strings or numbers.
     *  { age: { $in: [25, 30] } } - selects docs with the field `age` equal to 25 or 30.
     *
     * - `$nin` - used to select docs with a field not equal to any of the values in an array.
     *  $nin accepts an array of strings or numbers.
     *  { age: { $nin: [25, 30] } } - selects docs with the field `age` not equal to 25 or 30.
     *
     * - `$includes` - used to select docs with a field that includes a value.
     *  $includes accepts a string.
     *  { name: { $includes: "John" } } - selects docs with the field `name` that includes "John".
     *
     * - `$like` - used to select docs with a field that matches a pattern.
     * $like accepts a string.
     * { name: { $like: "JoHn" } } - selects docs with the field `name` containing "john" case insensitive.
     *
     * - `$type` - used to select docs with a field of a specific type.
     *  $type accepts a string: "number", "string", "boolean", "null", "array", or "object".
     *  { age: { $type: "number" } } - selects docs with the field `age` of type number.
     */
    export interface QueryOperator {
        $exists  ?: boolean | 1 | 0;
        $eq      ?: number | string;
        $ne      ?: number | string;
        $gt      ?: number | string;
        $gte     ?: number | string;
        $lt      ?: number | string;
        $lte     ?: number | string;
        $in      ?: string[] | number[];
        $nin     ?: string[] | number[];
        $includes?: EndValue;
        $like    ?: string;
        $type    ?: "number" | "string" | "boolean" | "null" | "array" | "object";
    }

    /**
     * The query interface describes a query to select documents from the database.
     */
    export interface Query {
        _id?: string | QueryOperator;
        [property: string]: Value | QueryOperator | undefined;
    }

    /**
     * The projections sets what fields to include or exclude from the query result.
     *
     * The `_id` field is not included by default.
     *
     * Projections accepts either fields to include or exclude.
     */
    export interface Projection {
        _id?: 1 | 0;
        [property: string]: 1 | 0 | undefined;
    }

    /**
     * DocMap describes the map of documents in the database.
     */
    export interface DocMap {
        [id: string]: Doc;
    }

    /**
     * The DataBase interface describes the database.
     *
     * - `options`: The database options.
     *
     * - `docMap`: The map of documents in the database.
     */
    export interface DataBase {
        options: DbOptions;
        docMap : DocMap;
    }

    /**
     * Update operators
     *
     * - `$inc` - used to increment a field by a number.
     *  { $inc: { age: 1 } } - increments the field `age` by 1.
     *  { $inc: { age: -1 } } - decrements the field `age` by 1.
     *  { $inc: { age: 5 } } - increments the field `age` by 5.
     *  { $inc: { val: 1, col: 3 } } - increments multiple fields
     *
     * - `$push` - used to append a value to an array field.
     * { $push: { tags: "new" } } - appends "new" to the `tags` array.
     *
     * - `$rename` - used to rename a field.
     *  { $rename: { old: "new" } } - renames the field `old` to `new`.
     *  Cannot rename the _id field.
     *
     * - `$set` - used to set a field to a value.
     *  { $set: { name: "John" } } - sets the field `name` to "John".
     *  { $set: { name: "John", age: 25 } } - sets multiple fields.
     *  Cannot set the _id field.
     *
     * - `$unset` - used to remove a field.
     *  { $unset: { name: 1 } } - removes the field `name`.
     *  { $unset: { name: true } } - removes the field `name`.
     *  { $unset: { name: 0 } } - does not remove the field `name`.
     *  Cannot remove the _id field.
     */
    export interface Update {
        $inc   ?: Record<string, number>;
        $push  ?: Record<string, Value>;
        $rename?: Record<string, string>;
        $set   ?: Record<string, Value>;
        $unset ?: Record<string, 0 | 1 | boolean>;
    }

    /**
     * The insert options.
     *
     *  - `skipSave`: A boolean that indicates if the insert should skip saving the database.
     */
    export interface InsertOptions {
        skipSave?: boolean;
    }

    /**
     * The `update` options.
     *  - `multi`: A boolean that indicates if the update should update multiple documents.
     *  - `skipSave`: A boolean that indicates if the update should skip saving the database.
     */
    export interface UpdateOptions {
        multi   ?: boolean;
        skipSave?: boolean;
    }

    /**
     * The `remove` options.
     *  - `multi`: A boolean that indicates if the remove should remove multiple documents.
     *  - `skipSave`: A boolean that indicates if the remove should skip saving the database.
     */
    export interface RemoveOptions {
        multi   ?: boolean;
        skipSave?: boolean;
    }

    export class JsonDB {
        dbName: string;
        docMap: DocMap;

        constructor(dbName: string, docMap: DocMap);

        count(query: Query): number;

        find(query: Query, projection?: Projection): Doc[];

        findOne(query: Query, projection?: Projection): Doc | undefined;

        insert(doc: Doc, options?: InsertOptions): string;

        remove(query: Query, options?: RemoveOptions): number;

        update(query: Query, update: Update, options?: UpdateOptions): number;

        save(): void;
    }

    /**
     * Get the value of a key from the database.
     * @param {string}  dbName
     * @returns {JsonDB}
     */
    export function getDb(dbName: string): JsonDB;

    /**
     * Initializes the database.
     * @param {string} dirPath
     * @returns {void}
     */
    export function initDb(dirPath: string): void;

    /**
     * Removes the local reference to the database.
     * @param {string} name
     * @returns {void}
     */
    export function closeDb(name: string): void;

    export interface ApiReq {
        dbName     : string;
        actionName : string;
        query     ?: Query;
        update    ?: Update;
        projection?: Projection;
        doc       ?: Doc;
        options   ?: InsertOptions | UpdateOptions | RemoveOptions;
    }

    /**
     * The API response.
     * @property {number}        status - The status of the response: 200, 400, 404, 500.
     * @property {string | null} err - The error message or null.
     * @property {any}           data - The data.
     */
    export interface ApiRes {
        status: number;
        err   : string | null;
        data  : any;
    }

    /**
     * Serve the DB
     *
     * @param {ApiReq} req
     * @returns {ApiRes}
     */
    export function callDbAction(req: ApiReq): ApiRes;
}
