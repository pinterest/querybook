import ds from 'lib/datasource';
import { IResource } from '../types';

export const getQuerybookConfig: IResource<Record<string, unknown>> = () =>
    ds.fetch(`/admin/querybook_config/`);
