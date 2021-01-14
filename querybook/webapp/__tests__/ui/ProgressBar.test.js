import React from 'react';
import { shallow } from 'enzyme';
import renderer from 'react-test-renderer';

import { ProgressBar } from '../../ui/ProgressBar/ProgressBar';

it('renders without crashing', () => {
    shallow(<ProgressBar value={10} />);
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(<ProgressBar value={10} />);
        expect(output).toMatchSnapshot();
    });
});
