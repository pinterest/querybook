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
        const wrapper = shallow(
            <DisabledSection>
                <input />
            </DisabledSection>
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - false', () => {
        const wrapper = shallow(
            <DisabledSection disabled={false}>
                <input />
            </DisabledSection>
        );
        const serialized = toJson(wrapper);
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
