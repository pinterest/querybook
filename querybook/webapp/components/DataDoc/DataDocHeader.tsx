import clsx from 'clsx';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { BoardItemAddButton } from 'components/BoardItemAddButton/BoardItemAddButton';
import { DataDocViewersBadge } from 'components/DataDocViewersBadge/DataDocViewersBadge';
import { ImpressionWidget } from 'components/ImpressionWidget/ImpressionWidget';
import { emptyDataDocTitleMessage, IDataDoc } from 'const/datadoc';
import { generateFormattedDate } from 'lib/utils/datetime';
import { favoriteDataDoc, unfavoriteDataDoc } from 'redux/dataDoc/action';
import { Dispatch, IStoreState } from 'redux/store/types';
import { IconButton } from 'ui/Button/IconButton';
import { Icon } from 'ui/Icon/Icon';
import { ResizableTextArea } from 'ui/ResizableTextArea/ResizableTextArea';
import { AccentText } from 'ui/StyledText/StyledText';

interface IProps {
    dataDoc: IDataDoc;
    isEditable: boolean;
    isSaving: boolean;
    lastUpdated: number;

    changeDataDocTitle: (docId: number, str: string) => any;
}

export const DataDocHeader = React.forwardRef<HTMLDivElement, IProps>(
    (
        {
            dataDoc,
            isEditable,
            isSaving,
            lastUpdated,

            changeDataDocTitle,
        },
        ref
    ) => {
        const dispatch: Dispatch = useDispatch();
        const isFavorite = useSelector((state: IStoreState) =>
            state.dataDoc.favoriteDataDocIds.includes(dataDoc.id)
        );
        const toggleFavorite = React.useCallback(() => {
            if (isFavorite) {
                dispatch(unfavoriteDataDoc(dataDoc.id));
            } else {
                dispatch(favoriteDataDoc(dataDoc.id));
            }
        }, [isFavorite, dataDoc.id]);

        const timeMessage = isSaving ? (
            <div className="flex-row">
                Saving
                <Icon name="Loading" className="ml8" size={20} />
            </div>
        ) : (
            `Updated ${generateFormattedDate(lastUpdated, 'X')}`
        );

        return (
            <div className="data-doc-header" ref={ref} key="data-doc-header">
                <div className="data-doc-header-top horizontal-space-between mb4">
                    <div className="data-doc-header-time flex-row mr8">
                        <AccentText
                            className="ml8"
                            size="text"
                            weight="bold"
                            color="lightest"
                        >
                            {timeMessage}
                        </AccentText>
                        <IconButton
                            noPadding
                            size={16}
                            icon="Star"
                            className={clsx({
                                'favorite-icon-button': true,
                                'favorite-icon-button-favorited': isFavorite,
                            })}
                            onClick={toggleFavorite}
                        />
                        <BoardItemAddButton
                            noPadding
                            size={16}
                            itemType="data_doc"
                            itemId={dataDoc.id}
                        />
                        <ImpressionWidget
                            itemId={dataDoc.id}
                            type={'DATA_DOC'}
                            popoverLayout={['right', 'top']}
                        />
                    </div>
                    <div className="data-doc-header-users flex-row">
                        <DataDocViewersBadge docId={dataDoc.id} />
                    </div>
                </div>
                <AccentText color="light" size="xlarge" weight="extra">
                    <ResizableTextArea
                        value={dataDoc.title}
                        onChange={changeDataDocTitle.bind(this, dataDoc.id)}
                        className="data-doc-title"
                        placeholder={emptyDataDocTitleMessage}
                        disabled={!isEditable}
                        transparent
                    />
                </AccentText>
            </div>
        );
    }
);
