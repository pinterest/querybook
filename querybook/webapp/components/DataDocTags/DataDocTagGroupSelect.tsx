import React from 'react';
import { TagGroupSelect } from '../GenericTags/TagGroupSelect';

export const DataDocTagGroupSelect: React.FC<{
    tags?: string[];
    updateTags: (newTags: string[]) => void;
}> = ({ tags, updateTags }) => (
    <TagGroupSelect tags={tags} tagType={'DataDoc'} updateTags={updateTags} />
);
