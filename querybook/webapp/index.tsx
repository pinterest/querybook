import 'core-js/stable';
import 'draft-js/dist/Draft.css';
import React from 'react';
import * as ReactDOM from 'react-dom';
// Vendor css
import 'react-virtualized/styles.css';
import 'regenerator-runtime/runtime';

import { setupOnQuerybookClose } from 'lib/querybookUI';

import { App } from './components/App/App';

import './index.scss';
import './stylesheets/_utilities.scss';
import './stylesheets/_variables.scss';

ReactDOM.render(<App />, document.getElementById('root'));
setupOnQuerybookClose();
