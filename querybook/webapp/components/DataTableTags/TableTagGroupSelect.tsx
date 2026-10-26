import React from 'react';
import { TagGroupSelect } from '../GenericTags/TagGroupSelect';

export const TableTagGroupSelect: React.FC<{
    tags?: string[];
    updateTags: (newTags: string[]) => void;
}> = ({ tags, updateTags }) => (
    <TagGroupSelect tags={tags} tagType={'Table'} updateTags={updateTags} />
);
