import React, { useMemo } from 'react';
import { HoverIconTag } from 'ui/Tag/HoverIconTag';
import { DataDocTagSelect } from '../DataDocTags/DataDocTagSelect';
import { TableTagSelect } from '../DataTableTags/TableTagSelect';

export const TagGroupSelect: React.FC<{
    tags?: string[];
    tagType: string;
    updateTags: (newTags: string[]) => void;
}> = ({ tags: propsTag, tagType, updateTags }) => {
    const tags = useMemo(() => propsTag ?? [], [propsTag]);

    const handleTagSelect = React.useCallback(
        (tag: string) => {
            updateTags([...tags, tag]);
        },
        [tags, updateTags]
    );

    const handleTagRemove = React.useCallback(
        (tag: string) => {
            updateTags(tags.filter((existingTag) => existingTag !== tag));
        },
        [tags, updateTags]
    );

    const tagsListDOM = tags.length ? (
        <div className="mb8">
            {tags.map((tag) => (
                <HoverIconTag
                    key={tag}
                    name={tag}
                    iconOnHover={'X'}
                    onIconHoverClick={() => handleTagRemove(tag)}
                />
            ))}
        </div>
    ) : null;

    if (tagType === 'DataDoc') {
        return (
            <div className="DataDocTagGroupSelect">
                {tagsListDOM}
                <DataDocTagSelect
                    existingTags={tags}
                    onSelect={handleTagSelect}
                />
            </div>
        );
    } else if (tagType === 'Table') {
        return (
            <div className="TableTagGroupSelect">
                {tagsListDOM}
                <TableTagSelect
                    existingTags={tags}
                    onSelect={handleTagSelect}
                />
            </div>
        );
    }
};
