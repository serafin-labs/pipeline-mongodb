import { PipelineAbstract } from "@serafin/pipeline";
import { SchemaBuilder } from "@serafin/schema-builder";
import * as chai from "chai";
import { expect } from "chai";
import { PipelineMongoDb } from "../index";
import * as mongodb from 'mongo-mock';
chai.use(require("chai-as-promised"))

const MongoClient = mongodb.MongoClient;
const url = 'mongodb://localhost:27017/test';

const connect = async (): Promise<MongoClient> => new Promise((resolve, reject) => {
    MongoClient.connect(url, {}, function(err, db) {
        if (err) {
            reject(err)
        }
        resolve(db)
    })
})

describe('MongoDbPipeline', async () => {
    const db:any

    beforeEach(async () => {
        db = await connect()
    });

    afterEach(async () => {
        db.collection('test').toJSON().documents = []
        await db.close()
    });

    it('should be implemented by a concrete class', async () => {
        const pipeline = new PipelineMongoDb(SchemaBuilder.emptySchema().addString("id").addString("myString").addNumber("myNumber"), "test", db)
        expect(pipeline).to.be.an.instanceOf(PipelineMongoDb);
        expect(pipeline).to.be.an.instanceOf(PipelineAbstract);
    })

    it('should create an entry', async () => {
        const pipeline = new PipelineMongoDb(SchemaBuilder.emptySchema().addString("id").addString("myString").addNumber("myNumber"), "test", db)
        let r = await pipeline.create([{id: 'id1', myString: "test", myNumber: 2}])
        expect(r.data).to.be.deep.equal([{id: 'id1', myString: "test", myNumber: 2}]);
    })

    it('should read all entries', async () => {
        const pipeline = new PipelineMongoDb(SchemaBuilder.emptySchema().addString("id").addString("myString").addNumber("myNumber"), "test", db)
        await pipeline.create([{id: 'id1', myString: "test1", myNumber: 3}])
        await pipeline.create([{id: 'id2', myString: "test2", myNumber: 1}])
        let r = await pipeline.read()
        expect(r.data).to.be.deep.equal([
            {id: 'id1', myString: "test1", myNumber: 3},
            {id: 'id2', myString: "test2", myNumber: 1}
        ])
    })

    it('should read one entry', async () => {
        const pipeline = new PipelineMongoDb(SchemaBuilder.emptySchema().addString("id").addString("myString").addNumber("myNumber"), "test", db)
        await pipeline.create([{id: 'id1', myString: "test1", myNumber: 3}])
        await pipeline.create([{id: 'id2', myString: "test2", myNumber: 1}])
        let r = await pipeline.read({id: "id2"})
        expect(r.data).to.be.deep.equal([
            {id: 'id2', myString: "test2", myNumber: 1}
        ])
    })
})
