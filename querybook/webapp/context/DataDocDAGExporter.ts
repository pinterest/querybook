import React from 'react';

import { IDataDocDAGExporter } from 'const/datadoc';
import { Nullable } from 'lib/typescript';

export interface IDataDocDAGExporterContextType {
    docId: number;
    currentExporter: Nullable<IDataDocDAGExporter>;

    isEngineSupported: (engineId: number) => boolean;
}

export const DataDocDAGExporterContext =
    React.createContext<IDataDocDAGExporterContextType>(null);
