import * as React from 'react';

import { IAdminQueryEngine } from 'const/admin';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import {
    FormField,
    FormFieldInputSection,
    FormFieldInputSectionRow,
} from 'ui/Form/FormField';
import { makeSelectOptions, Select } from 'ui/Select/Select';

interface IProps {
    queryEngines: IAdminQueryEngine[];
    handleAddQueryEngine: (selectedQueryEngineId: number) => Promise<any>;
}

export const QueryEngineSelect: React.FunctionComponent<IProps> = ({
    queryEngines,
    handleAddQueryEngine,
}) => {
    const [selectedQueryEngineId, setSelectedQueryEngineId] =
        React.useState<number>(0);

    const selectOptions = React.useMemo(() => {
        const emptyOption: {
            key: any;
            value: string;
        } = { key: -1, value: '' };
        const options = queryEngines.map((eng) => ({
            key: eng.id,
            value: eng.name,
        }));
        options.unshift(emptyOption);
        return options;
    }, [queryEngines]);

    return (
        <div className="QueryEngineSelect">
            <FormField stacked>
                <FormFieldInputSectionRow>
                    <FormFieldInputSection>
                        <Select
                            value={selectedQueryEngineId}
                            onChange={(event) => {
                                if (event.target.value) {
                                    setSelectedQueryEngineId(
                                        Number(event.target.value)
                                    );
                                }
                            }}
                        >
                            {queryEngines && makeSelectOptions(selectOptions)}
                        </Select>
                    </FormFieldInputSection>
                    <AsyncButton
                        title="Add Query Engine"
                        onClick={() =>
                            handleAddQueryEngine(selectedQueryEngineId)
                        }
                        disabled={!selectedQueryEngineId}
                        className="ml8"
                    />
                </FormFieldInputSectionRow>
            </FormField>
        </div>
    );
};
