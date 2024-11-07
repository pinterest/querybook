import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { IFunctionDescription } from 'const/metastore';
import { fetchFunctionDocumentationIfNeeded } from 'redux/dataSources/action';
import { IStoreState } from 'redux/store/types';
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

export const FunctionDocumentationTooltipByName: React.FunctionComponent<{
    language: string;
    functionName: string;
}> = ({ language, functionName }) => {
    const dispatch = useDispatch();
    const functionDocumentationByNameByLanguage = useSelector(
        (state: IStoreState) =>
            state.dataSources.functionDocumentation.byNameByLanguage
    );

    useEffect(() => {
        if (language) {
            dispatch(fetchFunctionDocumentationIfNeeded(language));
        }
    }, [language]);

    const matchFunctionWithDefinition = useCallback(
        (functionName: string) => {
            if (language && language in functionDocumentationByNameByLanguage) {
                const functionDefs =
                    functionDocumentationByNameByLanguage[language];
                const functionNameLower = (functionName || '').toLowerCase();

                if (functionNameLower in functionDefs) {
                    return functionDefs[functionNameLower];
                }
            }

            return null;
        },
        [language, functionDocumentationByNameByLanguage]
    );
    const functionDef = matchFunctionWithDefinition(functionName);

    if (!functionDef) {
        return null;
    }

    return (
        <FunctionDocumentationTooltip functionDocumentations={functionDef} />
    );
};
