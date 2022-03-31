import 'core-js/stable';
import 'regenerator-runtime/runtime';

import React from 'react';
import { createRoot } from 'react-dom/client';

import './stylesheets/_variables.scss';
import './stylesheets/_utilities.scss';
import './index.scss';

// Vendor css
import 'react-virtualized/styles.css';
import 'draft-js/dist/Draft.css';

import { App } from './components/App/App';
import { setupOnQuerybookClose } from 'lib/querybookUI';

const root = createRoot(document.getElementById('root'));
root.render(<App />);

setupOnQuerybookClose();
