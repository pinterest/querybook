import ds from 'lib/datasource';

export const DemoResource = {
    setup: () =>
        ds.save<{
            environment: string;
            data_doc_id: number;
        }>('/admin/demo_set_up/'),
};
