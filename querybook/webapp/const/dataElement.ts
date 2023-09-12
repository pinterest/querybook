// Keep it in sync with DataElementAssociationType in const/data_element.py
export enum DataElementAssociationType {
    REF = 'ref',
    ARRAY = 'array',
    MAP = 'map',
    STRUCT = 'struct',
    UNION = 'union',
}

// Keep it in sync with DataElementDict in const/metastore.py
export interface IDataElement {
    id: number;
    name: string;
    type: string;
    description: string;
    properties?: Record<string, string>;
}

// Keep it in sync with DataElementAssociationDict in const/data_element.py
export interface IDataElementAssociation {
    type: DataElementAssociationType;
    key?: IDataElement | string;
    value: IDataElement | string;
}
