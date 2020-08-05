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
            const separator = index > 0 ? <hr /> : null;

            return (
                <div key={index}>
                    {separator}
                    <div className="rich-text-content">
                        <p>{signature}</p>

                        <h6>Returns</h6>
                        <p>{returnType}</p>

                        <h6>Description</h6>
                        <p>
                            <ShowMoreText text={description} length={200} />
                        </p>
                    </div>
                </div>
            );
        }
    );

    return <div>{functionsDOM}</div>;
};
