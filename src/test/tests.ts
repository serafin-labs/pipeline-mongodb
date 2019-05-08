import { PipelineAbstract } from "@serafin/pipeline";
import { SchemaBuilder } from "@serafin/schema-builder";
import * as chai from "chai";
import { expect } from "chai";
import { Logger, MongoClient } from "mongodb";
import { PipelineMongoDb } from "../index";

async function configureMongo() {
    const connect = async (retries: number = 5, delay: number = 2000): Promise<MongoClient> => {
        try {
            return await MongoClient.connect(config.mongodbConnexionString, {
                appname: "test",
                useNewUrlParser: true,
            })
        } catch (e) {
            if (retries < 1) {
                throw Error("Connection to mongodb failed, too many retries")
            } else {
                console.log(`Connection to mongodb failed, retry in ${delay}ms`)
                await new Promise(resolve => setTimeout(resolve, delay))
                return await connect(--retries)
            }
        }
    }

    let client = await connect()

    console.log("Connected to mongodb")
    if (!config.isProduction) {
        Logger.setLevel("info")
    }

    const db = client.db(config.mongodbDatabase)
    const registerDb = client.db(config.mongodbRegisterDatabase)
    return [db, registerDb]
}

let mongoInitialization = configureMongo()

const db = mongoInitialization.then(r => r[0])
const registerDb = mongoInitialization.then(r => r[1])

chai.use(require("chai-as-promised"))

const pipeline = new PipelineMongoDb(SchemaBuilder.emptySchema().addString("myString").addNumber("myNumber"), "test", db)

describe('MongoDbPipeline', function () {
    it('should be implemented by a concrete class', function () {
        expect(pipeline).to.be.an.instanceOf(PipelineMongoDb);
        expect(pipeline).to.be.an.instanceOf(PipelineAbstract);
    });

    it('should create an entry', function () {
        let r = pipeline.create([{'myString': "test", 'myNumber': 2}])
        console.log(r.data)
    });

    it('should read an entry', function () {
        pipeline.create([{myString: "test2", myNumber: 1}])
        let r = pipeline.read({myNumber: 1})
        console.log(r.data)
    });
})
