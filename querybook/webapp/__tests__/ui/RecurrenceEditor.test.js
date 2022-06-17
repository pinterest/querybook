import { shallow } from 'enzyme';
import React from 'react';

import { RecurrenceEditor } from '../../ui/ReccurenceEditor/RecurrenceEditor';

const recurrence = {
    hour: 0,
    minute: 0,

    recurrence: 'daily',
    on: [0],
};

it('renders without crashing', () => {
    shallow(
        <RecurrenceEditor
            recurrence={recurrence}
            setRecurrence={(val) => setFieldValue('recurrence', val)}
        />
    );
});
