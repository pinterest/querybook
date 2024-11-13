import { inlineCopilot } from 'codemirror-copilot';
import { useMemo } from 'react';

export const useCopilotExtension = () => {
    const extension = useMemo(
        () =>
            inlineCopilot(async (prefix, suffix) => {
                // TODO: To be implemented
                return null;
            }),
        []
    );

    return extension;
};
