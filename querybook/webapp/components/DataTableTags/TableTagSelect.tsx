import * as React from 'react';
import { TagSelect } from '../GenericTags/TagSelect';

import './TableTagSelect.scss';

interface IProps {
    onSelect: (val: string) => any;
    existingTags?: string[];
    creatable?: boolean;
}

export const TableTagSelect: React.FunctionComponent<IProps> = ({
    onSelect,
    existingTags = [],
    creatable = false,
}) => (
    <TagSelect
        onSelect={onSelect}
        existingTags={existingTags}
        creatable={creatable}
        tagType={'Table'}
    />
);
