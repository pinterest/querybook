import * as React from 'react';
import { useDispatch } from 'react-redux';

import { EntitySelect } from 'components/Search/EntitySelect';
import { ITag } from 'const/tag';
import { isTagValid } from 'lib/utils/tag';
import { Dispatch } from 'redux/store/types';
import { createDataDocTag } from 'redux/tag/action';
import { DataDocTagResource } from 'resource/dataDoc';
import { IconButton } from 'ui/Button/IconButton';

import './CreateDataDocTag.scss';

interface IProps {
    datadocId: number;
    tags: ITag[];
}

export const CreateDataDocTag: React.FunctionComponent<IProps> = ({
    datadocId,
    tags,
}) => {
    const dispatch: Dispatch = useDispatch();
    const [showSelect, setShowSelect] = React.useState(false);

    const existingTags = React.useMemo(
        () => (tags || []).map((tag) => tag.name),
        [tags]
    );

    const createTag = React.useCallback(
        (tag: string) => dispatch(createDataDocTag(datadocId, tag)),
        [datadocId, dispatch]
    );

    const handleCreateTag = React.useCallback(
        (val: string) => {
            createTag(val).finally(() => setShowSelect(false));
        },
        [createTag]
    );

    return (
        <div className="CreateDataDocTag flex-row">
            {showSelect ? (
                <div className="CreateDataDocTag-input flex-row">
                    <EntitySelect
                        creatable
                        mini
                        selectedEntities={existingTags || []}
                        loadEntities={DataDocTagResource.search}
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
