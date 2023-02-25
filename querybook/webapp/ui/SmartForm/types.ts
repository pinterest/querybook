// Keep this in sync with lib/form/__init__.py

type FormFieldType = 'string' | 'boolean' | 'number' | 'select';
type CompositeFieldType = 'list' | 'struct';

interface IBaseFormField {
    field_type: FormFieldType | CompositeFieldType;
}

interface IFormField extends IBaseFormField {
    description?: string;
    required?: boolean; // For validation
    regex?: string; // For validation
    hidden?: boolean; // For password
    helper?: string;
    options?: string[]; // For select
    field_type: FormFieldType; // For type of corresponding value
}

interface IExpandableFormField extends IBaseFormField {
    field_type: 'list';
    of: AllFormField;
    min?: number;
    max?: number;
}

interface IStructFormField extends IBaseFormField {
    field_type: 'struct';
    fields: Array<[name: string, field: AllFormField]>;
}

type AllFormField = IFormField | IExpandableFormField | IStructFormField;
