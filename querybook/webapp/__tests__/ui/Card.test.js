import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';

import { Card } from '../../ui/Card/Card';

it('renders without crashing', () => {
    shallow(
        <Card title="test" onClick={() => null}>
            Test Content
        </Card>
    );
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(
            <Card title="test" onClick={() => null}>
                Test Content
            </Card>
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - height/width', () => {
        const wrapper = shallow(
            <Card
                title="test"
                onClick={() => null}
                disabled
                height="120px"
                width="120px"
                flexRow
            >
                Test Content
            </Card>
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});
