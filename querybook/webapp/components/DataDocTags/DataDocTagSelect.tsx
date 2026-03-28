import * as React from 'react';
import { TagSelect } from '../GenericTags/TagSelect';

import './DataDocTagSelect.scss';

interface IProps {
    onSelect: (val: string) => any;
    existingTags?: string[];
    creatable?: boolean;
}

export const DataDocTagSelect: React.FunctionComponent<IProps> = ({
    onSelect,
    existingTags = [],
    creatable = false,
}) => (
    <TagSelect
        onSelect={onSelect}
        existingTags={existingTags}
        creatable={creatable}
        tagType={'DataDoc'}
    />
);
