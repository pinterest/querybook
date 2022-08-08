import React from 'react';
import {
    FormFieldLabelSection,
    FormFieldInputSection,
} from 'ui/Form/FormField';

export const DataDocScheduleSelectionList = ({ label, children }) => {
    return (
        <div className="FormField">
            <FormFieldLabelSection>{label}</FormFieldLabelSection>
            <FormFieldInputSection>{children}</FormFieldInputSection>
        </div>
    );
};
