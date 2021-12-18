import { uniq } from 'lodash';
import React, { useMemo } from 'react';
import { extractFormikError } from 'lib/formik/extract-error';
import { Message } from 'ui/Message/Message';

export const FormError: React.FC<{
    errors: Record<string, any>;
}> = ({ errors }) => {
    const errorStrings = useMemo(() => uniq(extractFormikError(errors)), [
        errors,
    ]);
    if (errorStrings.length === 0) {
        return null;
    }
    return (
        <Message type="error">
            {errorStrings.map((error, idx) => (
                <div key={idx}>
                    <span>{error}</span>
                    <br />
                </div>
            ))}
        </Message>
    );
};
