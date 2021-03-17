import clsx from 'clsx';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { favoriteDataDoc, unfavoriteDataDoc } from 'redux/dataDoc/action';
import { IDataDoc, emptyDataDocTitleMessage } from 'const/datadoc';
import { Dispatch, IStoreState } from 'redux/store/types';

import { generateFormattedDate } from 'lib/utils/datetime';
import { DataDocViewersBadge } from 'components/DataDocViewersBadge/DataDocViewersBadge';
import { ResizableTextArea } from 'ui/ResizableTextArea/ResizableTextArea';
import { IconButton } from 'ui/Button/IconButton';
import { ImpressionWidget } from 'components/ImpressionWidget/ImpressionWidget';
import { BoardItemAddButton } from 'components/BoardItemAddButton/BoardItemAddButton';

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
            <span>
                Saving
                <i className="fa fa-spinner fa-pulse ml8" />
            </span>
        ) : (
            `Updated at ${generateFormattedDate(lastUpdated, 'X')}`
        );

        return (
            <div className="data-doc-header" ref={ref} key="data-doc-header">
                <div className="data-doc-header-top horizontal-space-between">
                    <div className="data-doc-header-time flex-row mr8">
                        <p>{timeMessage}</p>
                        <IconButton
                            noPadding
                            size={16}
                            icon="star"
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
                <ResizableTextArea
                    value={dataDoc.title}
                    onChange={changeDataDocTitle.bind(this, dataDoc.id)}
                    className="data-doc-title"
                    placeholder={emptyDataDocTitleMessage}
                    disabled={!isEditable}
                    transparent
                />
            </div>
        );
    }
);
