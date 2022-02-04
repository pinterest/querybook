import React from 'react';

import { IFunctionDescription } from 'const/metastore';
import { ShowMoreText } from 'ui/ShowMoreText/ShowMoreText';

interface IProps {
    functionDocumentations: IFunctionDescription[];
}

export const FunctionDocumentationTooltip: React.FunctionComponent<IProps> = ({
    functionDocumentations,
}) => {
    const functionsDOM = functionDocumentations.map(
        (functionDocumentation, index) => {
            const {
                description,
                name,
                params,
                return_type: returnType,
            } = functionDocumentation;

            const signature = `${name}(${params})`;

            return (
                <div key={index}>
                    <div className="rich-text-content">
                        <div className="table-tooltip-header">{signature}</div>

                        <div className="tooltip-title">Returns</div>
                        <div className="tooltip-content">{returnType}</div>

                        <div className="tooltip-title">Description</div>
                        <div className="tooltip-content">
                            <ShowMoreText text={description} length={200} />
                        </div>
                    </div>
                </div>
            );
        }
    );

    return <div>{functionsDOM}</div>;
};
