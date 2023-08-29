import * as React from 'react';
import { ITag } from 'const/tag';
import { CreateTag } from '../GenericTags/CreateTag';

interface IProps {
    tableId: number;
    tags: ITag[];
}

export const CreateDataTableTag: React.FunctionComponent<IProps> = ({
    tableId,
    tags,
}) => <CreateTag id={tableId} tag_type={'Table'} tags={tags} />;
