import React from 'react';
import { shallow } from 'enzyme';

import { ErrorBoundary } from '../../ui/ErrorBoundary/ErrorBoundary';

it('renders without crashing', () => {
    shallow(<ErrorBoundary>Test</ErrorBoundary>);
});
