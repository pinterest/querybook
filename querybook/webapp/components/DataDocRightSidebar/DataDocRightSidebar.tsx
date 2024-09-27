import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { DataDocBoardsButton } from 'components/DataDocBoardsButton/DataDocBoardsButton';
import { DataDocDAGExporterButton } from 'components/DataDocDAGExporter/DataDocDAGExporterButton';
import { DataDocTemplateButton } from 'components/DataDocTemplateButton/DataDocTemplateButton';
import { DataDocUIGuide } from 'components/UIGuide/DataDocUIGuide';
import { ComponentType, ElementType } from 'const/analytics';
import { IDataDoc, IDataDocMeta } from 'const/datadoc';
import { useAnnouncements } from 'hooks/redux/useAnnouncements';
import { useScrollToTop } from 'hooks/ui/useScrollToTop';
import { trackClick } from 'lib/analytics';
import { fetchDAGExporters } from 'redux/dataDoc/action';
import { IStoreState } from 'redux/store/types';
import { IconButton } from 'ui/Button/IconButton';

import { DataDocCloneButton } from './DataDocCloneButton';
import { DataDocRunAllButton } from './DataDocRunAllButton';
import { DataDocScheduleButton } from './DataDocScheduleButton';
import { DeleteDataDocButton } from './DeleteDataDocButton';

import './DataDocRightSidebar.scss';

interface IProps {
    dataDoc: IDataDoc;
    isSaving: boolean;
    isEditable: boolean;
    isConnected: boolean;

    changeDataDocMeta: (docId: number, meta: IDataDocMeta) => Promise<void>;

    onCollapse: () => any;
    defaultCollapse: boolean;
}

export const DataDocRightSidebar: React.FunctionComponent<IProps> = ({
    changeDataDocMeta,

    isSaving,
    isEditable,
    isConnected,

    dataDoc,

    onCollapse,
    defaultCollapse,
}) => {
    const numAnnouncements = useAnnouncements().length;
    const exporterExists = useExporterExists();

    const selfRef = React.useRef<HTMLDivElement>();
    const { showScrollToTop, scrollToTop } = useScrollToTop({
        containerRef: selfRef,
    });

    const deleteButtonDOM = isEditable ? (
        <DeleteDataDocButton docId={dataDoc.id} />
    ) : (
        <IconButton
            icon="Trash"
            disabled={true}
            tooltipPos="left"
            tooltip="Only editor can delete"
            title="Delete"
        />
    );

    const boardsButtonDOM = <DataDocBoardsButton dataDoc={dataDoc} />;

    const templateButtonDOM = (
        <DataDocTemplateButton
            dataDoc={dataDoc}
            isEditable={isEditable}
            changeDataDocMeta={changeDataDocMeta}
        />
    );
    const scheduleButtonDOM = (
        <DataDocScheduleButton isEditable={isEditable} docId={dataDoc.id} />
    );

    const runAllButtonDOM = isEditable && (
        <DataDocRunAllButton docId={dataDoc.id} />
    );

    const cloneButtonDOM = <DataDocCloneButton docId={dataDoc.id} />;

    const buttonSection = (
        <div className="DataDocRightSidebar-button-section vertical-space-between">
            <div className="DataDocRightSidebar-button-section-top flex-column">
                <IconButton
                    icon="ArrowUp"
                    className={showScrollToTop ? '' : 'hide-button'}
                    onClick={() => {
                        trackClick({
                            component: ComponentType.DATADOC_PAGE,
                            element: ElementType.GO_TO_TOP_BUTTON,
                        });
                        scrollToTop();
                    }}
                />
                <IconButton
                    icon={defaultCollapse ? 'Maximize2' : 'Minimize2'}
                    tooltip={
                        defaultCollapse
                            ? 'Uncollapse query cells'
                            : 'Collapse query cells'
                    }
                    tooltipPos="left"
                    onClick={() => {
                        trackClick({
                            component: ComponentType.DATADOC_PAGE,
                            element: ElementType.COLLAPSE_DATADOC_BUTTON,
                        });
                        onCollapse();
                    }}
                />
                <DataDocUIGuide />
                <IconButton
                    icon="Loading"
                    className={isSaving ? '' : 'hide-button'}
                    title="Saving"
                />
                <IconButton
                    icon="Link"
                    tooltip="Connecting to websocket"
                    tooltipPos="left"
                    className={
                        'connected-button ' + (isConnected ? 'hide-button' : '')
                    }
                    color="accent"
                />
            </div>
            <div className="DataDocRightSidebar-button-section-bottom flex-column mb8">
                {runAllButtonDOM}
                {isEditable && exporterExists && (
                    <DataDocDAGExporterButton docId={dataDoc.id} />
                )}
                {boardsButtonDOM}
                {templateButtonDOM}
                {scheduleButtonDOM}
                {cloneButtonDOM}
                {deleteButtonDOM}
            </div>
        </div>
    );

    return (
        <div
            className="DataDocRightSidebar right-align"
            style={{ height: `calc(100vh - ${numAnnouncements * 40}px)` }}
            ref={selfRef}
        >
            {buttonSection}
        </div>
    );
};

function useExporterExists() {
    const dispatch = useDispatch();
    const currentEnvironmentId = useSelector(
        (state: IStoreState) => state.environment.currentEnvironmentId
    );
    const exporterDataByName = useSelector(
        (state: IStoreState) => state.dataDoc.dagExporterDataByName
    );
    const exporterNames = React.useMemo(
        () => Object.keys(exporterDataByName || {}),
        [exporterDataByName]
    );

    React.useEffect(() => {
        dispatch(fetchDAGExporters(currentEnvironmentId));
    }, [dispatch, currentEnvironmentId]);

    const exporterExists = exporterNames.length > 0;

    return exporterExists;
}
