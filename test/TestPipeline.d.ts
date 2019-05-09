import { PipelineAbstract, IdentityInterface, ResultsInterface } from "@serafin/pipeline";
export declare class TestPipeline<T extends IdentityInterface> extends PipelineAbstract<T> {
    protected _create(resources: any[], options?: any): Promise<ResultsInterface<any>>;
    protected _read(query?: any, options?: any): Promise<ResultsInterface<any>>;
    protected _replace(id: string, values: any, options?: any): Promise<ResultsInterface<any>>;
    protected _patch(query: any, values: any, options?: any): Promise<ResultsInterface<any>>;
    protected _delete(query: any, options?: any): Promise<ResultsInterface<any>>;
}
export declare const schemaTestPipeline: {
    model: {
        type: string;
        additionalProperties: boolean;
        properties: {
            id: {
                description: string;
                type: string;
            };
            method: {
                description: string;
                type: string;
            };
        };
        required: string[];
    };
    createValues: {
        type: string;
        additionalProperties: boolean;
        properties: {
            id: {
                description: string;
                type: string;
            };
            method: {
                description: string;
                type: string;
            };
        };
        required: string[];
    };
    createOptions: {
        type: string;
        additionalProperties: boolean;
    };
    createMeta: {
        type: string;
        additionalProperties: boolean;
    };
    readQuery: {
        type: string;
        additionalProperties: boolean;
        properties: {
            id: {
                oneOf: ({
                    description: string;
                    type: string;
                    items?: undefined;
                } | {
                    type: string;
                    items: {
                        description: string;
                        type: string;
                    };
                    description?: undefined;
                })[];
            };
            method: {
                oneOf: ({
                    description: string;
                    type: string;
                    items?: undefined;
                } | {
                    type: string;
                    items: {
                        description: string;
                        type: string;
                    };
                    description?: undefined;
                })[];
            };
        };
    };
    readOptions: {
        type: string;
        additionalProperties: boolean;
    };
    readMeta: {
        type: string;
        additionalProperties: boolean;
    };
    replaceValues: {
        type: string;
        additionalProperties: boolean;
        properties: {
            method: {
                description: string;
                type: string;
            };
        };
        required: string[];
    };
    replaceOptions: {
        type: string;
        additionalProperties: boolean;
    };
    replaceMeta: {
        type: string;
        additionalProperties: boolean;
    };
    patchQuery: {
        type: string;
        additionalProperties: boolean;
        properties: {
            id: {
                oneOf: ({
                    description: string;
                    type: string;
                    items?: undefined;
                } | {
                    type: string;
                    items: {
                        description: string;
                        type: string;
                    };
                    description?: undefined;
                })[];
            };
        };
        required: string[];
    };
    patchValues: {
        type: string;
        additionalProperties: boolean;
        properties: {
            method: {
                description: string;
                type: string;
            };
        };
    };
    patchOptions: {
        type: string;
        additionalProperties: boolean;
    };
    patchMeta: {
        type: string;
        additionalProperties: boolean;
    };
    deleteQuery: {
        type: string;
        additionalProperties: boolean;
        properties: {
            id: {
                oneOf: ({
                    description: string;
                    type: string;
                    items?: undefined;
                } | {
                    type: string;
                    items: {
                        description: string;
                        type: string;
                    };
                    description?: undefined;
                })[];
            };
        };
        required: string[];
    };
    deleteOptions: {
        type: string;
        additionalProperties: boolean;
    };
    deleteMeta: {
        type: string;
        additionalProperties: boolean;
    };
};
