import { SchemaBuilder } from "@serafin/schema-builder"
import { IdentityInterface, PipelineAbstract, ResultsInterface, SchemaBuildersInterface } from "@serafin/pipeline"
import * as _ from "lodash"
import * as mongodb from "mongodb"

/**
 * Regexp used to detect an objectId represented as an hex string
 */
const objectIdRegexp = /^[a-f\d]{24}$/

/**
 * Default readOptions schema for mongodb pipeline
 */
export const readOptionsSchema = SchemaBuilder.emptySchema()
    .addInteger("skip", { description: "Offset of the first resource to return", minimum: 0, default: 0 }, false)
    .addInteger("limit", { description: "Number of resources to return", minimum: 0, maximum: 10000, default: 0 }, false)
    .addBoolean("withCount", { description: "Indicate if the result should contain the count of all documents matching the query", default: false }, false)
    .addProperty("sort", SchemaBuilder.emptySchema().addAdditionalProperties(SchemaBuilder.integerSchema({ minimum: -1, maximum: 1 })), false)
    .addProperty("_projection", SchemaBuilder.emptySchema().addAdditionalProperties(), false)

/**
* Default readMeta schema for mongodb pipeline
*/
export const readMetaSchema = SchemaBuilder.emptySchema()
    .addInteger("count", { description: "Count of all documents matching the query", minimum: 0 }, false)

/**
* Default patchOptions schema for mongodb pipeline
*/
const patchOptionsSchema = SchemaBuilder.emptySchema()
    .addInteger("skip", { description: "Offset of the first resource to modify", minimum: 0, default: 0 }, false)
    .addInteger("limit", { description: "Number of resources to modify.", minimum: 1, maximum: 100, default: 1 }, false)


/**
* Default patchMeta schema for mongodb pipeline
*/
const patchMetaSchema = SchemaBuilder.emptySchema()
    .addInteger("updatedCount", { description: "Count of all documents that were updated by the patch operation", minimum: 0 })

/**
* Default deleteOptions schema for mongodb pipeline
*/
const deleteOptionsSchema = SchemaBuilder.emptySchema()
    .addInteger("limit", { description: "Number of resources to return. This does not affect the number of deleted objects.", minimum: 1, maximum: 100, default: 1 }, false)

/**
* Default deleteMeta schema for mongodb pipeline
*/
const deleteMetaSchema = SchemaBuilder.emptySchema()
    .addInteger("deletedCount", { description: "Count of all documents that were deleted by the delete operation", minimum: 0 })


/**
 * Deep mapValues and array map function
 */
const deepMap = (v: any, fn: (o: any) => any): any => (
    _.isArray(v) ? fn(v.map(v => deepMap(v, fn))) : _.isPlainObject(v) ? fn(_.mapValues(v, v => deepMap(v, fn))) : fn(v)
)

/**
 * Deep mapKeys and array map function
 */
const deepMapKeys = (v: any, fn: (v: any, k: string) => any): any => {
    if (_.isArray(v)) {
        return v.map(v => deepMapKeys(v, fn))
    } else if (_.isPlainObject(v)) {
        return _.mapValues(_.mapKeys(v, fn), v => deepMapKeys(v, fn))
    } else {
        return v
    }

}

/**
 * Pipeline that stores its data into a mongodb collection
 */
export class PipelineMongoDb<M extends IdentityInterface, S extends SchemaBuildersInterface = ReturnType<PipelineMongoDb<M, null>["mongodbPipelineDefaultSchema"]>> extends PipelineAbstract<M, S> {
    constructor(modelSchemaBuilder: SchemaBuilder<M>, public collectionName: string, protected readonly db: Promise<mongodb.Db>) {
        super(modelSchemaBuilder)
        this.schemaBuilders = this.mongodbPipelineDefaultSchema(modelSchemaBuilder) as any
    }

    /**
     * Overwrite defaultSchema to add additional options and meta to it
     * @param modelSchemaBuilder
     */
    mongodbPipelineDefaultSchema(modelSchemaBuilder: SchemaBuilder<M>) {
        return {
            model: modelSchemaBuilder,
            createValues: modelSchemaBuilder.setOptionalProperties(["id"]),
            createOptions: SchemaBuilder.emptySchema(),
            createMeta: SchemaBuilder.emptySchema(),
            readQuery: modelSchemaBuilder.transformPropertiesToArray().toOptionals(),
            readOptions: readOptionsSchema,
            readMeta: readMetaSchema,
            replaceValues: modelSchemaBuilder.omitProperties(["id"]),
            replaceOptions: SchemaBuilder.emptySchema(),
            replaceMeta: SchemaBuilder.emptySchema(),
            patchQuery: modelSchemaBuilder.pickProperties(["id"]).transformPropertiesToArray(),
            patchValues: modelSchemaBuilder.omitProperties(["id"]).toDeepOptionals().toNullable(),
            patchOptions: patchOptionsSchema,
            patchMeta: patchMetaSchema,
            deleteQuery: modelSchemaBuilder.pickProperties(["id"]).transformPropertiesToArray(),
            deleteOptions: deleteOptionsSchema,
            deleteMeta: deleteMetaSchema,
        }
    }

    /**
     * Transform an input query to mongodb query format
     *
     * @param query
     */
    toMongoQueryFormat(query: any) {
        let result = {} as mongodb.FilterQuery<any>
        result = deepMapKeys(query, (v, k) => k === "id" ? "_id" : k)
        result = deepMap(result, v => {
            if (typeof v === "string" && objectIdRegexp.test(v)) {
                return mongodb.ObjectID.createFromHexString(v)
            } else if (Array.isArray(v)) {
                return { $in: v }
            }
            return v
        })
        return result
    }

    /**
     * Transform the given obj to use _id ObjectId format
     * @param obj
     */
    static toMongoFormat(obj: any) {
        obj = deepMap(obj, v => {
            if (typeof v === "string" && objectIdRegexp.test(v)) {
                return mongodb.ObjectID.createFromHexString(v)
            }
            return v
        })
        obj = deepMapKeys(obj, (v, k) => k === "id" ? "_id" : k)
        return obj
    }

    /**
     * Transform the given obj to use id instead of _id
     * @param obj
     */
    static fromMongoFormat(obj: any) {
        obj = deepMap(obj, v => {
            if (v instanceof mongodb.ObjectID) {
                return v.toHexString()
            }
            return v
        })
        obj = deepMapKeys(obj, (v, k) => k === "_id" ? "id" : k)
        return obj
    }

    /**
     * Transform the given object into a mongo patch
     * null values => $unset
     * non-null values => $set
     */
    toMongoPatchFormat(obj: any) {
        let patch: any = {
        }
        for (let key in obj) {
            let value = obj[key]
            if (value === null) {
                patch.$unset = patch.$unset || {}
                patch.$unset[key] = ""
            } else {
                patch.$set = patch.$set || {}
                patch.$set[key] = value
            }
        }
        return patch
    }

    /**
     * Filter the ouput data according to the model schema
     */
    filterKeys: string[] = null
    filterOutput(objects: any[]) {
        if (this.modelSchemaBuilder.hasAdditionalProperties) {
            return objects
        }
        if (!this.filterKeys) {
            this.filterKeys = Object.keys(this.modelSchemaBuilder.schema.properties)
        }
        if (objects && objects.length > 0) {
            return objects.map(o => {
                let r = {} as any
                for (let key of this.filterKeys) {
                    if (key in o) {
                        r[key] = o[key]
                    }
                }
                return r
            })
        }
        return objects
    }

    protected getResult(collection: mongodb.Collection<any>, query: any, options?: any): mongodb.Cursor | mongodb.AggregationCursor {
        return collection.find(this.toMongoQueryFormat(query))
    }

    protected async getMeta(collection: mongodb.Collection<any>, cursor: mongodb.Cursor | mongodb.AggregationCursor, query: any, options?: any) {
        // eventually add a total count to it
        let meta: any = {}

        if (options && options.withCount && cursor) {
            let count: number
            if (cursor instanceof mongodb.AggregationCursor) {
                count = cursor.readableLength
            } else if (cursor instanceof mongodb.Cursor) {
                count = await cursor.count()
            }
            meta.count = count
        }

        return meta
    }

    /**
     * Find documents matching query parameter
     */
    protected async _read(query: any, options: typeof readOptionsSchema["T"]) {
        // wait for the database to be ready
        const db = await this.db
        // prepare the query
        let cursor = this.getResult(db.collection(this.collectionName), query, options)
        if (options) {
            !!options.skip && (cursor = cursor.skip(options.skip))
            !!options.limit && (cursor = cursor.limit(options.limit))
            !!options._projection && (cursor = cursor.project(options._projection))
            !!options.sort && (cursor = (cursor as any).sort(options.sort as any))
        }

        // get the results
        let data = await cursor.toArray()
        let result: ResultsInterface<this["schemaBuilders"]["model"]["T"], this["schemaBuilders"]["readMeta"]["T"]> = {
            data: this.filterOutput(data.map(PipelineMongoDb.fromMongoFormat)),
            meta: await this.getMeta(db.collection(this.collectionName), cursor, query, options)
        }

        return result
    }

    /**
     * Create given resources
     */
    protected async _create(resources: any[], options: any) {
        // wait for the database to be ready
        const db = await this.db
        // if resources have explicit identifiers, map them to _id
        // insert data in database
        let insertResult = await db.collection(this.collectionName).insertMany(resources.map(PipelineMongoDb.toMongoFormat))
        // map resulting ids to the resource
        let results = resources.map((r: M, index: number) => {
            if (!r.id) {
                r.id = insertResult.insertedIds[index].toHexString()
            }
            return r
        })
        let result: ResultsInterface<this["schemaBuilders"]["model"]["T"], this["schemaBuilders"]["createMeta"]["T"]> = {
            data: this.filterOutput(results),
            meta: {} as any
        }
        return result
    }

    /**
     * Replace a document using its identifier
     */
    protected async _replace(id: string, values: any, options: any) {
        // wait for the database to be ready
        const db = await this.db
        // complete id if it was not provided
        if (!values.id) {
            values.id = id
        }
        // if resources have explicit identifiers, map them to _id
        // insert data in database
        let replaceResult = await db.collection(this.collectionName).replaceOne({
            _id: mongodb.ObjectID.createFromHexString(id)
        }, PipelineMongoDb.toMongoFormat(values))
        let result: ResultsInterface<this["schemaBuilders"]["model"]["T"], this["schemaBuilders"]["replaceMeta"]["T"]> = {
            data: this.filterOutput([values]),
            meta: {} as any
        }
        return result
    }

    /**
     * Modify documents matching the query parameter
     */
    protected async _patch(query: any, values: any, options: typeof patchOptionsSchema["T"]) {
        // wait for the database to be ready
        const db = await this.db

        // read data matching the query
        let cursor = db.collection(this.collectionName).find(this.toMongoQueryFormat(query), {
            skip: options ? options.skip : 0,
            limit: options ? options.limit : 0
        })
        let matchingData = await cursor.toArray()

        // nothing match the query
        if (matchingData.length === 0) {
            return {
                data: [] as any[],
                meta: {
                    updatedCount: 0
                }
            }
        }

        // prepare the data that matches all elements
        let matchingQuery = {
            _id: {
                $in: matchingData.map(e => e._id)
            }
        }
        // patch all documents matching the query
        let patch = this.toMongoPatchFormat(PipelineMongoDb.toMongoFormat(values))
        let patchResult = await db.collection(this.collectionName).updateMany(matchingQuery, patch)

        let data = [] as any[]
        let cursor2 = db.collection(this.collectionName).find(matchingQuery, { limit: matchingData.length })
        data = await cursor2.toArray()
        let result: ResultsInterface<this["schemaBuilders"]["model"]["T"], this["schemaBuilders"]["patchMeta"]["T"]> = {
            data: this.filterOutput(data.map(PipelineMongoDb.fromMongoFormat)),
            meta: {
                updatedCount: patchResult.modifiedCount
            }
        }
        return result
    }

    /**
     * Delete all documents matching query parameter
     */
    protected async _delete(query: any, options: typeof deleteOptionsSchema["T"]) {
        // wait for the database to be ready
        const db = await this.db
        let mongoQuery = this.toMongoQueryFormat(query)

        // read data matching the query
        let cursor = db.collection(this.collectionName).find(mongoQuery, {
            limit: options ? options.limit : 0
        })
        let data = await cursor.toArray()

        // nothing match the query
        if (data.length === 0) {
            return {
                data: [] as any[],
                meta: {
                    deletedCount: 0
                }
            }
        }

        // delete all matching documents
        let deleteResult = await db.collection(this.collectionName).deleteMany({
            _id: {
                $in: data.map(e => e._id)
            }
        })

        let result: ResultsInterface<this["schemaBuilders"]["model"]["T"], this["schemaBuilders"]["deleteMeta"]["T"]> = {
            data: this.filterOutput(data.map(PipelineMongoDb.fromMongoFormat)),
            meta: {
                deletedCount: deleteResult.deletedCount
            }
        }
        return result
    }
}