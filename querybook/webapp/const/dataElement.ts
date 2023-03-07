// Keep it in sync with DataElementAssociationType in const/metastore.py
export enum DataElementAssociationType {
    REF = 'ref',
    ARRAY = 'array',
    MAP = 'map',
}

export interface IDataElement {
    id: number;
    name: string;
    type: string;
    description: string;
    properties?: Record<string, string>;
}

export interface IDataElementAssociation {
    type: DataElementAssociationType;
    key?: IDataElement;
    value: IDataElement | string;
}
