import React from 'react';
import { debounce } from 'lodash';
import { useDispatch, useSelector } from 'react-redux';

import { IDataDoc } from 'const/datadoc';
import { fetchDAGExporters } from 'redux/dataDoc/action';
import { IStoreState } from 'redux/store/types';
import { getScrollParent, smoothScroll } from 'lib/utils';
import { useAnnouncements } from 'hooks/redux/useAnnouncements';

import { DeleteDataDocButton } from './DeleteDataDocButton';
import { DataDocTemplateButton } from 'components/DataDocTemplateButton/DataDocTemplateButton';
import { DataDocScheduleButton } from './DataDocScheduleButton';
import { DataDocDAGExporterButton } from 'components/DataDocDAGExporter/DataDocDAGExporterButton';

import { IconButton } from 'ui/Button/IconButton';

import './DataDocRightSidebar.scss';

interface IProps {
    dataDoc: IDataDoc;
    isSaving: boolean;
    isEditable: boolean;
    isConnected: boolean;

    changeDataDocMeta: (docId: number, meta: Record<string, any>) => any;
    onClone: () => any;

    onCollapse: () => any;
    defaultCollapse: boolean;
}

export const DataDocRightSidebar: React.FunctionComponent<IProps> = ({
    onClone,
    changeDataDocMeta,

    isSaving,
    isEditable,
    isConnected,

    dataDoc,

    onCollapse,
    defaultCollapse,
}) => {
    const dispatch = useDispatch();

    const numAnnouncements = useAnnouncements().length;

    const exporterDataByName = useSelector(
        (state: IStoreState) => state.dataDoc.dagExporterDataByName
    );
    const exporterNames = React.useMemo(
        () => Object.keys(exporterDataByName || {}),
        [exporterDataByName]
    );

    React.useEffect(() => {
        if (exporterNames.length === 0) {
            dispatch(fetchDAGExporters());
        }
    }, [dispatch]);

    const exporterExists = React.useMemo(
        () =>
            exporterNames.length === 0 ||
            (exporterNames.length === 1 && exporterNames[0] === 'demo')
                ? false
                : true,
        [exporterNames]
    );

    const [showScrollToTop, setShowScrollToTop] = React.useState(false);
    const selfRef = React.useRef<HTMLDivElement>();

    const checkParentScroll = React.useCallback(
        debounce((scrollTop: number) => {
            setShowScrollToTop(scrollTop > 230);
        }, 500),
        []
    );

    React.useEffect(() => {
        const scrollParent = getScrollParent(selfRef.current);
        const scrollFunction = (e) => checkParentScroll(e.target.scrollTop);
        if (scrollParent) {
            scrollParent.addEventListener('scroll', scrollFunction);
        }

        return () => {
            if (scrollParent && scrollFunction) {
                scrollParent.removeEventListener('scroll', scrollFunction);
            }
        };
    }, []);

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

    const buttonSection = (
        <div className="DataDocRightSidebar-button-section vertical-space-between">
            <div className="DataDocRightSidebar-button-section-top flex-column">
                <IconButton
                    icon="ArrowUp"
                    className={showScrollToTop ? '' : 'hide-button'}
                    onClick={() => {
                        const scrollParent = getScrollParent(selfRef.current);
                        if (scrollParent) {
                            smoothScroll(scrollParent, 0, 200);
                        }
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
                    onClick={onCollapse}
                />
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
                {isEditable && exporterExists && (
                    <DataDocDAGExporterButton
                        readonly={!isEditable}
                        docId={dataDoc.id}
                    />
                )}
                {templateButtonDOM}
                {scheduleButtonDOM}
                <IconButton
                    icon="Copy"
                    onClick={onClone}
                    tooltip={'Clone'}
                    tooltipPos={'left'}
                    title="Clone"
                />
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
