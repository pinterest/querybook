import 'core-js/stable';
import 'regenerator-runtime/runtime';

import React from 'react';
import * as ReactDOM from 'react-dom';

import './stylesheets/_variables.scss';
import './stylesheets/_utilities.scss';
import './index.scss';

// Vendor css
import 'react-virtualized/styles.css';
import 'draft-js/dist/Draft.css';

import { App } from './components/App/App';
import { setupOnWebPageClose } from 'lib/globalUI';

ReactDOM.render(<App />, document.getElementById('root'));
setupOnWebPageClose();
