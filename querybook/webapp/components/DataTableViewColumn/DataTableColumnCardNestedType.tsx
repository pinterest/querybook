import * as React from 'react';

import { ComplexType } from 'lib/utils/complex-types';
import { IconButton } from 'ui/Button/IconButton';
import { AccentText, StyledText } from 'ui/StyledText/StyledText';

interface IDataTableColumnCardNestedTypeProps {
    complexType: ComplexType;
}
export const DataTableColumnCardNestedType: React.FunctionComponent<
    IDataTableColumnCardNestedTypeProps
> = ({ complexType }) => {
    const hasChildren = complexType.children?.length > 0;
    const [expanded, setExpanded] = React.useState(false);

    const rowProps: React.HTMLAttributes<HTMLDivElement> = {
        className: 'flex-row',
    };

    if (hasChildren) {
        rowProps['onClick'] = () => setExpanded(!expanded);
        rowProps['aria-label'] = expanded
            ? 'click to collapse'
            : 'click to expand';
        rowProps['data-balloon-pos'] = 'down-left';
    }

    return (
        <div className="DataTableColumnCardNestedType">
            <div {...rowProps}>
                {hasChildren && (
                    <IconButton
                        icon={expanded ? 'Minus' : 'Plus'}
                        size="16"
                        noPadding={true}
                        className="expand-icon"
                    />
                )}
                <AccentText weight="extra" className="mr12">
                    {complexType.key}
                </AccentText>
                <StyledText
                    color="light"
                    className={`column-type ${!hasChildren && 'nested-indent'}`}
                >
                    {complexType.type}
                </StyledText>
            </div>
            {hasChildren &&
                expanded &&
                complexType.children.map((child) => (
                    <div className="nested-indent m16" key={child.key}>
                        <DataTableColumnCardNestedType complexType={child} />
                    </div>
                ))}
        </div>
    );
};
