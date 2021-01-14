import React from 'react';
import { debounce } from 'lodash';

import { IDataDoc } from 'const/datadoc';
import { IconButton } from 'ui/Button/IconButton';

import { DeleteDataDocButton } from './DeleteDataDocButton';
import { TemplateDataDocButton } from 'components/TemplateDataDocButton/TemplateDataDocButton';
import { ScheduleDataDocButton } from './ScheduleDataDocButton';
import { getScrollParent, smoothScroll } from 'lib/utils';

import './DataDocRightSidebar.scss';
import { useAnnouncements } from 'hooks/redux/useAnnouncements';

interface IProps {
    dataDoc: IDataDoc;
    isSaving: boolean;
    isEditable: boolean;
    isConnected: boolean;

    changeDataDocMeta: (docId: number, meta: Record<string, any>) => any;
    onClone: () => any;
}

export const DataDocRightSidebar: React.FunctionComponent<IProps> = ({
    onClone,
    changeDataDocMeta,

    isSaving,
    isEditable,
    isConnected,

    dataDoc,
}) => {
    const numAnnouncements = useAnnouncements().length;

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
            icon="trash"
            disabled={true}
            tooltipPos="left"
            tooltip="Only editor can delete"
            title="Delete"
        />
    );
    const templateButtonDOM = (
        <TemplateDataDocButton
            dataDoc={dataDoc}
            isEditable={isEditable}
            changeDataDocMeta={changeDataDocMeta}
        />
    );
    const scheduleButtonDOM = (
        <ScheduleDataDocButton isEditable={isEditable} docId={dataDoc.id} />
    );

    const buttonSection = (
        <div className="DataDocRightSidebar-button-section">
            <div className="DataDocRightSidebar-button-section-top flex-column">
                <IconButton
                    icon="arrow-up"
                    className={showScrollToTop ? '' : 'hide-button'}
                    onClick={() => {
                        const scrollParent = getScrollParent(selfRef.current);
                        if (scrollParent) {
                            smoothScroll(scrollParent, 0, 200);
                        }
                    }}
                />
                <IconButton
                    icon="loader"
                    className={isSaving ? '' : 'hide-button'}
                    title="Saving"
                />
                <IconButton
                    icon="link"
                    tooltip="Connecting to websocket"
                    tooltipPos="left"
                    className={
                        'connected-button ' + (isConnected ? 'hide-button' : '')
                    }
                />
            </div>
            <div className="DataDocRightSidebar-button-section-bottom flex-column">
                {templateButtonDOM}
                {scheduleButtonDOM}
                <IconButton
                    icon="copy"
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
