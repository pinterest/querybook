import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import renderer from 'react-test-renderer';

import { Level, LevelItem } from '../../ui/Level/Level';

it('renders without crashing', () => {
    shallow(
        <Level>
            <LevelItem />
        </Level>
    );
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        let wrapper = shallow(
            <Level>
                <LevelItem />
            </Level>
        );
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(
            <Level>
                <LevelItem />
            </Level>
        );
        expect(output).toMatchSnapshot();
    });
});
