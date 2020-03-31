import React from 'react';
import './ViewerPermissionPicker.scss';

import {
    DataDocPermission,
    IViewerInfo,
} from 'lib/data-doc/datadoc-permission';
import { Popover } from 'ui/Popover/Popover';
interface IProp {
    viewerInfo: IViewerInfo;
    readonly?: boolean;
    publicDataDoc: boolean;

    onPermissionChange: (permision: DataDocPermission) => any;
    onRemoveEditor?: (uid: number) => any;
}

export const ViewerPermissionPicker: React.FunctionComponent<IProp> = ({
    readonly = false,
    publicDataDoc,
    viewerInfo,
    onPermissionChange,
    onRemoveEditor,
}) => {
    const [showEditMenu, setShowEditMenu] = React.useState(false);
    const selfRef = React.useRef<HTMLDivElement>(null);

    const editMenuDOM = showEditMenu && (
        <Popover
            onHide={() => setShowEditMenu(false)}
            anchor={selfRef.current}
            layout={['bottom', 'right']}
            hideArrow
        >
            <div className="dropdown-content">
                {!publicDataDoc && (
                    <a
                        className="dropdown-item"
                        onClick={() =>
                            onPermissionChange(DataDocPermission.CAN_READ)
                        }
                    >
                        read only
                    </a>
                )}
                <a
                    className="dropdown-item"
                    onClick={() =>
                        onPermissionChange(DataDocPermission.CAN_WRITE)
                    }
                >
                    edit
                </a>
                {onRemoveEditor && (
                    <>
                        <hr className="dropdown-divider" />
                        <a
                            className="dropdown-item"
                            onClick={() => onRemoveEditor(viewerInfo.uid)}
                        >
                            remove
                        </a>
                    </>
                )}
            </div>
        </Popover>
    );

    const canShowEditMenu =
        viewerInfo.permission === DataDocPermission.CAN_READ ||
        viewerInfo.permission === DataDocPermission.CAN_WRITE;

    const pickerButton =
        canShowEditMenu && !readonly ? (
            <div
                className="permission-text flex-row"
                onClick={() => setShowEditMenu(true)}
            >
                <i className="fa fa-caret-down caret-icon" />
                <span> {viewerInfo.permission}</span>
            </div>
        ) : (
            <div className="permission-text flex-row">
                {viewerInfo.permission}
            </div>
        );

    return (
        <div className="ViewerPermissionPicker" ref={selfRef}>
            {pickerButton}
            {editMenuDOM}
        </div>
    );
};
