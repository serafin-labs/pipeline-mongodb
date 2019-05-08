import { PipelineAbstract, IdentityInterface, ResultsInterface } from "@serafin/pipeline";
import { SchemaBuilder } from "@serafin/schema-builder";

// @description("test pipeline description")
export class TestPipeline<T extends IdentityInterface> extends PipelineAbstract<T> {
    protected async _create(resources: any[], options?: any): Promise<ResultsInterface<any>> {
        return { data: [{ id: '1', method: 'create' }], meta: {} };
    }

    protected async _read(query?: any, options?: any): Promise<ResultsInterface<any>> {
        return { data: [{ id: '1', method: 'read' }], meta: {} };
    }

    protected async _replace(id: string, values: any, options?: any): Promise<ResultsInterface<any>> {
        return { data: [{ id: '1', method: 'replace' }], meta: {} };
    }

    protected async _patch(query: any, values: any, options?: any): Promise<ResultsInterface<any>> {
        return { data: [{ id: '1', method: 'patch' }], meta: {} };
    }

    protected async _delete(query: any, options?: any): Promise<ResultsInterface<any>> {
        return { data: [{ id: '1', method: 'delete' }], meta: {} };
    }
}

export const schemaTestPipeline =
    {
        model:
            {
                type: 'object',
                additionalProperties: false,
                properties:
                    {
                        id: { description: 'id', type: 'string' },
                        method: { description: 'method', type: 'string' }
                    },
                required: ['id', 'method']
            },
        createValues:
            {
                type: 'object',
                additionalProperties: false,
                properties:
                    {
                        id: { description: 'id', type: 'string' },
                        method: { description: 'method', type: 'string' }
                    },
                required: ['method']
            },
        createOptions: { type: 'object', additionalProperties: false },
        createMeta: { type: 'object', additionalProperties: false },
        readQuery:
            {
                type: 'object',
                additionalProperties: false,
                properties:
                    {
                        id:
                            {
                                oneOf:
                                    [{ description: 'id', type: 'string' },
                                    { type: 'array', items: { description: 'id', type: 'string' } }]
                            },
                        method:
                            {
                                oneOf:
                                    [{ description: 'method', type: 'string' },
                                    {
                                        type: 'array',
                                        items: { description: 'method', type: 'string' }
                                    }]
                            }
                    }
            },
        readOptions: { type: 'object', additionalProperties: false },
        readMeta: { type: 'object', additionalProperties: false },
        replaceValues:
            {
                type: 'object',
                additionalProperties: false,
                properties: { method: { description: 'method', type: 'string' } },
                required: ['method']
            },
        replaceOptions: { type: 'object', additionalProperties: false },
        replaceMeta: { type: 'object', additionalProperties: false },
        patchQuery:
            {
                type: 'object',
                additionalProperties: false,
                properties:
                    {
                        id:
                            {
                                oneOf:
                                    [{ description: 'id', type: 'string' },
                                    { type: 'array', items: { description: 'id', type: 'string' } }]
                            }
                    },
                required: ['id']
            },
        patchValues:
            {
                type: 'object',
                additionalProperties: false,
                properties: { method: { description: 'method', type: 'string' } }
            },
        patchOptions: { type: 'object', additionalProperties: false },
        patchMeta: { type: 'object', additionalProperties: false },
        deleteQuery:
            {
                type: 'object',
                additionalProperties: false,
                properties:
                    {
                        id:
                            {
                                oneOf:
                                    [{ description: 'id', type: 'string' },
                                    { type: 'array', items: { description: 'id', type: 'string' } }]
                            }
                    },
                required: ['id']
            },
        deleteOptions: { type: 'object', additionalProperties: false },
        deleteMeta: { type: 'object', additionalProperties: false }
    };
