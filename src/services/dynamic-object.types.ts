export enum DynamicObjectType {
    STRING = 'STRING',
    NUMBER = 'NUMBER',
    BOOLEAN = 'BOOLEAN',
    ARRAY = 'ARRAY',
    OBJECT = 'OBJECT',
    DATE = 'DATE',
    RAW = 'RAW'
}

// Mapeo en tiempo de compilación para inferencia de tipos
export type DynamicTypeMapping<T = any> = {
    [DynamicObjectType.STRING]: string;
    [DynamicObjectType.NUMBER]: number;
    [DynamicObjectType.BOOLEAN]: boolean;
    [DynamicObjectType.ARRAY]: any[];
    [DynamicObjectType.OBJECT]: Record<string, any>;
    [DynamicObjectType.DATE]: Date | null;
    [DynamicObjectType.RAW]: T;
};

export interface DynamicGetOptions<T = any> {
    defaultValue?: T;
    trimSpaces?: boolean;
    notReplaceIfNotFound?: boolean;
}