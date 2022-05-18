import { ITableUploadConfigForm } from 'const/tableUpload';

export enum TableUploaderStepValue {
    SourceConfig = 0,
    TableConfig = 1,
    UploadConfirm = 2,
}

export type ITableUploadFormikForm = ITableUploadConfigForm & {
    auto_generated_column_types: boolean;
    metastore_id: number;
};

export interface IDragObjectFiles {
    dataTransfer: DataTransfer;
    files: File[];
    items: DataTransferItemList;
}
