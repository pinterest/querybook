import * as React from 'react';
import { ITag } from 'const/tag';
import { CreateTag } from '../GenericTags/CreateTag';

interface IProps {
    datadocId: number;
    tags: ITag[];
}

export const CreateDataDocTag: React.FunctionComponent<IProps> = ({
    datadocId,
    tags,
}) => <CreateTag id={datadocId} tag_type={'DataDoc'} tags={tags} />;
