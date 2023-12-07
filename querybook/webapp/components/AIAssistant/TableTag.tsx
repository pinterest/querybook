import React from 'react';

import { TableTooltipByName } from 'components/CodeMirrorTooltip/TableTooltip';
import { Popover } from 'ui/Popover/Popover';
import { PopoverHoverWrapper } from 'ui/Popover/PopoverHoverWrapper';
import { HoverIconTag } from 'ui/Tag/HoverIconTag';

interface ITableTagProps {
    metastoreId: number;
    tableName: string;
    onIconClick?: () => void;
    highlighted?: boolean;
}

export const TableTag: React.FunctionComponent<ITableTagProps> = ({
    metastoreId,
    tableName,
    onIconClick,
    highlighted = false,
}) => (
    <PopoverHoverWrapper>
        {(showPopover, anchorElement) => (
            <>
                <HoverIconTag
                    name={tableName}
                    iconOnHover={onIconClick ? 'X' : undefined}
                    onIconHoverClick={onIconClick}
                    mini
                    highlighted={highlighted}
                    light
                />
                {showPopover && (
                    <Popover
                        onHide={() => null}
                        anchor={anchorElement}
                        layout={['right']}
                    >
                        <TableTooltipByName
                            metastoreId={metastoreId}
                            tableFullName={tableName}
                            showDetails={true}
                        />
                    </Popover>
                )}
            </>
        )}
    </PopoverHoverWrapper>
);
