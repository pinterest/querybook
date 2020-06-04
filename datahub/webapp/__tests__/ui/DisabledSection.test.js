import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import renderer from 'react-test-renderer';

import { DisabledSection } from '../../ui/DisabledSection/DisabledSection';

it('renders without crashing', () => {
    shallow(
        <DisabledSection>
            <input />
        </DisabledSection>
    );
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        let wrapper = shallow(
            <DisabledSection>
                <input />
            </DisabledSection>
        );
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - false', () => {
        let wrapper = shallow(
            <DisabledSection disabled={false}>
                <input />
            </DisabledSection>
        );
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(
            <DisabledSection>
                <input />
            </DisabledSection>
        );
        expect(output).toMatchSnapshot();
    });
});
