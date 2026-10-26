import React from 'react';
import { ITag } from 'const/tag';
import { TagConfigModal } from '../GenericTags/TagConfigModal';

export const TableTagConfigModal: React.FC<{
    tag: ITag;
    onHide: () => void;
}> = ({ tag, onHide }) => <TagConfigModal tag={tag} onHide={onHide} />;
