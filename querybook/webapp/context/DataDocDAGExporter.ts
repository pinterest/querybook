import React from 'react';

import { IDataDocDAGExporter } from 'const/datadoc';

export interface IDataDocDAGExporterContextType {
    docId: number;
    currentExporter: IDataDocDAGExporter;

    isEngineSupported: (engineId: number) => boolean;
}

export const DataDocDAGExporterContext =
    React.createContext<IDataDocDAGExporterContextType>(null);
