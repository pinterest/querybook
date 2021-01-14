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
import { setupOnQuerybookClose } from 'lib/querybookUI';

ReactDOM.render(<App />, document.getElementById('root'));
setupOnQuerybookClose();
