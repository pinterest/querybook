import cronstrue from 'cronstrue';
import { Field } from 'formik';
import React from 'react';

import { FormField } from 'ui/Form/FormField';

export const RecurrenceEditorCronPicker: React.FunctionComponent<{
    cron?: string;
}> = ({ cron }) => {
    const cronDescription = React.useMemo(() => {
        try {
            return cronstrue.toString(cron);
        } catch (e) {
            return null;
        }
    }, [cron]);

    return (
        <FormField label="Cron Expression">
            <Field
                name="recurrence.cron"
                render={({ field }) => (
                    <>
                        <input
                            {...field}
                            className="editor-input"
                            placeholder="* * * * *"
                        />
                        <div className="editor-text mt12">
                            {cronDescription}
                        </div>
                    </>
                )}
            />
        </FormField>
    );
};
