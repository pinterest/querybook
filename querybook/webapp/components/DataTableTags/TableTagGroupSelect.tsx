import React, { useMemo } from 'react';

import { HoverIconTag } from 'ui/Tag/HoverIconTag';

import { TableTagSelect } from './TableTagSelect';

export const TableTagGroupSelect: React.FC<{
    tags?: string[];
    updateTags: (newTags: string[]) => void;
}> = ({ tags: propsTag, updateTags }) => {
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
        <div className="tables-tag-list mb8">
            {tags.map((tag) => (
                <HoverIconTag
                    key={tag}
                    iconOnHover={'X'}
                    onIconHoverClick={() => handleTagRemove(tag)}
                >
                    <span>{tag}</span>
                </HoverIconTag>
            ))}
        </div>
    ) : null;

    return (
        <div className="TableTagGroupSelect">
            {tagsListDOM}
            <TableTagSelect existingTags={tags} onSelect={handleTagSelect} />
        </div>
    );
};
