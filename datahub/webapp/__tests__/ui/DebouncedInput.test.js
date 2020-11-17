import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';

import { DebouncedInput } from '../../ui/DebouncedInput/DebouncedInput';

it('renders without crashing', () => {
    shallow(<DebouncedInput value="test" onChange={() => null} />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(
            <DebouncedInput value="test" onChange={() => null} />
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - placeholder', () => {
        const wrapper = shallow(
            <DebouncedInput
                value="test"
                onChange={() => null}
                inputProps={{ placeholder: 'test placeholder' }}
            />
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});
