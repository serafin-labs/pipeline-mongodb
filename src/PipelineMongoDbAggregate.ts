import { IdentityInterface, notImplementedError, SchemaBuildersInterface } from "@serafin/pipeline"
import * as _ from "lodash"
import { SchemaBuilder } from "@serafin/schema-builder"
import * as mongodb from "mongodb"
import { MongodbPipelineSource, readOptionsSchema, readMetaSchema } from "./PipelineMongoDb"

/**
 * Pipeline performing an aggregation query
 */
export class PipelineMongoDbAggregate<M extends IdentityInterface, Q, RQ extends SchemaBuilder<any> = ReturnType<PipelineMongoDbAggregate<M, Q, null>["readQuerySchema"]>,
    S extends SchemaBuildersInterface = ReturnType<PipelineMongoDbAggregate<M, Q, RQ, null>["newSchema"]>>
    extends MongodbPipelineSource<M, S>{
    constructor(modelSchemaBuilder: SchemaBuilder<M>, collectionName: string,
        db: Promise<mongodb.Db>,
        public readonly queryPipelines: (query: RQ["T"]) => Object[],
        public querySchemaBuilder: SchemaBuilder<Q> = null,
        public readonly queryPipelinesMeta: (query: RQ["T"]) => Object[] = null,
    ) {
        super(modelSchemaBuilder, collectionName, db)

        if (!querySchemaBuilder) {
            this.querySchemaBuilder = SchemaBuilder.emptySchema() as any
        }
        this.schemaBuilders = this.newSchema(modelSchemaBuilder) as any
    }

    /**
     * Overwrite defaultSchema to add additional options and turn it read-only
     * @param modelSchemaBuilder
     */
    protected newSchema(modelSchemaBuilder: SchemaBuilder<M>) {
        return {
            model: modelSchemaBuilder,
            createValues: SchemaBuilder.emptySchema(),
            createOptions: SchemaBuilder.emptySchema(),
            createMeta: SchemaBuilder.emptySchema(),
            readQuery: modelSchemaBuilder.transformPropertiesToArray().toOptionals().mergeProperties(this.querySchemaBuilder),
            readOptions: readOptionsSchema,
            readMeta: readMetaSchema,
            replaceValues: SchemaBuilder.emptySchema(),
            replaceOptions: SchemaBuilder.emptySchema(),
            replaceMeta: SchemaBuilder.emptySchema(),
            patchQuery: SchemaBuilder.emptySchema(),
            patchValues: SchemaBuilder.emptySchema(),
            patchOptions: SchemaBuilder.emptySchema(),
            patchMeta: SchemaBuilder.emptySchema(),
            deleteQuery: SchemaBuilder.emptySchema(),
            deleteOptions: SchemaBuilder.emptySchema(),
            deleteMeta: SchemaBuilder.emptySchema(),
        }
    }

    /**
     * Read options to be used in the query
     * @param modelSchemaBuilder
     */
    protected readQuerySchema(modelSchemaBuilder: SchemaBuilder<M>) {
        return super.schemaBuilders.readQuery.mergeProperties(this.querySchemaBuilder.clone())
    }

    protected async getMeta(collection: mongodb.Collection<any>, cursor: mongodb.Cursor | mongodb.AggregationCursor, query: any, options?: any) {
        // eventually add a total count to it
        let meta = super.getMeta(collection, cursor, query, options)

        // prepare the query
        if (this.queryPipelinesMeta) {
            cursor = collection.aggregate([...this.queryPipelinesMeta(query)])
            meta = { ...meta, ...await cursor.next() }
        }

        return meta
    }

    protected getResult(collection: mongodb.Collection<any>, query: any, options?: any) {
        return collection.aggregate([...this.queryPipelines(query), { $match: super.toMongoQueryFormat(_.omit(query, Object.keys(this.querySchemaBuilder.schema.properties || []))) }])
    }

    protected async _create(resources: any[], options: any): Promise<never> {
        throw notImplementedError("create", Object.getPrototypeOf(this).constructor.name)
    }

    protected async _replace(id: string, values: any, options: any): Promise<never> {
        throw notImplementedError("replace", Object.getPrototypeOf(this).constructor.name)
    }

    protected async _patch(query: any, values: any, options: any): Promise<never> {
        throw notImplementedError("patch", Object.getPrototypeOf(this).constructor.name)
    }

    protected async _delete(query: any, options: any): Promise<never> {
        throw notImplementedError("delete", Object.getPrototypeOf(this).constructor.name)
    }
}