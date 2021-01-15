import React from 'react';
import { getAppVersion } from 'lib/utils/global';

export const QuerybookVersion: React.FC = () => <span>{getAppVersion()}</span>;
