import {
    ITableUploadConfigForm,
    ITableUploadPreviewForm,
    TUploadedTableColumnTypes,
} from 'const/tableUpload';
import ds from 'lib/datasource';

export const TableUploadResource = {
    previewColumns: (form: ITableUploadPreviewForm) => {
        const uploadForm = form;
        if (form.file) {
            // The preview only needs 5 rows, 512KB should be reasonable
            // enough to extract that
            const reasonablePreviewSize = 512 * 1024; // 512 KB
            uploadForm.file = getFileChunk(form.file, reasonablePreviewSize);
        }

        return ds.upload<
            Array<[colName: string, colType: TUploadedTableColumnTypes]>
        >('/table_upload/preview/', uploadForm);
    },

    createTable: (form: ITableUploadConfigForm) =>
        ds.upload<number>('/table_upload/', form),
};

function getFileChunk(file: File, byteSize: number) {
    const blob = file.slice(0, byteSize);
    return new File([blob], file.name);
}
