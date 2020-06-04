import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';

import { Tabs } from '../../ui/Tabs/Tabs';

it('renders without crashing', () => {
    shallow(<Tabs items={[{ key: 'test' }]} onSelect={() => null} />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        let wrapper = shallow(
            <Tabs items={[{ key: 'test' }]} onSelect={() => null} />
        );
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot', () => {
        let wrapper = shallow(
            <Tabs
                items={[{ name: 'test', icon: 'check', key: 'test' }]}
                onSelect={() => null}
                vertical
                borderless
                wide
                size="small"
                align="right"
            />
        );
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});
