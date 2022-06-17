import { shallow } from 'enzyme';
import React from 'react';

import { ErrorBoundary } from '../../ui/ErrorBoundary/ErrorBoundary';

it('renders without crashing', () => {
    shallow(<ErrorBoundary>Test</ErrorBoundary>);
});
