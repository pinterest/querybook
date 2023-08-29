import * as React from 'react';
import { useDispatch } from 'react-redux';

import { EntitySelect } from 'components/Search/EntitySelect';
import { ITag } from 'const/tag';
import { isTagValid } from 'lib/utils/tag';
import { Dispatch } from 'redux/store/types';
import { createDataDocTag } from 'redux/tag/action';
import { IconButton } from 'ui/Button/IconButton';
import { DataDocTagResource } from 'resource/dataDoc';
import { TableTagResource } from 'resource/table';

interface IProps {
    id: number;
    tag_type: string;
    tags: ITag[];
}

export const CreateTag: React.FunctionComponent<IProps> = ({
    id,
    tag_type,
    tags,
}) => {
    const dispatch: Dispatch = useDispatch();
    const [showSelect, setShowSelect] = React.useState(false);

    const existingTags = React.useMemo(
        () => (tags || []).map((tag) => tag.name),
        [tags]
    );

    const createTag = React.useCallback(
        (tag: string) => dispatch(createDataDocTag(id, tag)),
        [id, dispatch]
    );

    const handleCreateTag = React.useCallback(
        (val: string) => {
            createTag(val).finally(() => setShowSelect(false));
        },
        [createTag]
    );

    let resource;
    if (tag_type === 'DataDoc') {
        resource = DataDocTagResource;
    } else if (tag_type === 'Table') {
        resource = TableTagResource;
    }

    return (
        <div className="CreateDataDocTag flex-row">
            {showSelect ? (
                <div className="CreateDataDocTag-input flex-row">
                    <EntitySelect
                        creatable
                        mini
                        selectedEntities={existingTags || []}
                        loadEntities={resource.search}
                        onSelect={handleCreateTag}
                        validateEntity={isTagValid}
                        placeholder="alphanumeric only"
                        showSelected={false}
                    />
                </div>
            ) : (
                <IconButton
                    icon="Plus"
                    onClick={() => setShowSelect(true)}
                    tooltip="Add tag"
                    tooltipPos="down"
                    size={18}
                    invertCircle
                />
            )}
        </div>
    );
};
