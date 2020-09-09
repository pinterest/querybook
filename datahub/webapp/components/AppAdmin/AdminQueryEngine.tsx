import React from 'react';
import moment from 'moment';
import { clone } from 'lodash';
import { useParams } from 'react-router-dom';

import ds from 'lib/datasource';
import history from 'lib/router-history';
import { generateFormattedDate } from 'lib/utils/datetime';
import { useDataFetch } from 'hooks/useDataFetch';

import { AdminAuditLogButton } from 'components/AdminAuditLog/AdminAuditLogButton';

import { Card } from 'ui/Card/Card';
import { Loading } from 'ui/Loading/Loading';
import { SingleCRUD } from 'ui/GenericCRUD/SingleCRUD';
import {
    SmartForm,
    TemplatedForm,
    validateForm,
    updateValue,
    getDefaultFormValue,
} from 'ui/SmartForm/SmartForm';
import { Loader } from 'ui/Loader/Loader';
import { SimpleField } from 'ui/FormikField/SimpleField';
import { Level } from 'ui/Level/Level';

import { IAdminMetastore } from './AdminMetastore';
import { AdminDeletedList } from './AdminDeletedList';
import { IEnvironment } from 'redux/environment/types';
import { Link } from 'ui/Link/Link';

import './AdminQueryEngine.scss';

export interface IAdminQueryEngine {
    id: number;
    created_at: number;
    updated_at: number;
    deleted_at: number;
    name: string;
    language: string;
    description: string;

    metastore_id: number;
    executor: string;
    executor_params: Record<string, any>;
    status_checker: string;

    environments?: IEnvironment[];
}

interface IProps {
    queryEngines: IAdminQueryEngine[];
    metastores: IAdminMetastore[];
    loadQueryEngines: () => Promise<any>;
    loadMetastores: () => Promise<any>;
}

export const AdminQueryEngine: React.FunctionComponent<IProps> = ({
    queryEngines,
    metastores,
    loadQueryEngines,
    loadMetastores,
}) => {
    const { id: queryEngineId } = useParams();

    const { data: queryEngineTemplates } = useDataFetch<
        Array<{
            language: string;
            name: string;
            template: TemplatedForm;
        }>
    >({
        url: `/admin/query_engine_template/`,
    });

    const { data: engineStatusCheckerNames } = useDataFetch<string[]>({
        url: `/admin/query_engine_status_checker/`,
    });

    const datahubLanguages: string[] = React.useMemo(
        () => [
            ...new Set(
                (queryEngineTemplates || []).map(
                    (executor) => executor.language
                )
            ),
        ],
        [queryEngineTemplates]
    );
    const executorByLanguage: Record<string, string[]> = React.useMemo(
        () =>
            (queryEngineTemplates || []).reduce((hash, executor) => {
                if (!(executor.language in hash)) {
                    hash[executor.language] = [];
                }
                hash[executor.language].push(executor.name);
                return hash;
            }, {}),
        [queryEngineTemplates]
    );
    const executorTemplate: Record<string, AllFormField> = React.useMemo(
        () =>
            (queryEngineTemplates || []).reduce((hash, executor) => {
                hash[executor.name] = executor.template;
                return hash;
            }, {}),
        [queryEngineTemplates]
    );

    React.useEffect(() => {
        if (!metastores) {
            loadMetastores();
        }
    }, []);

    const createQueryEngine = React.useCallback(
        async (queryEngine: IAdminQueryEngine) => {
            const { data } = await ds.save(`/admin/query_engine/`, {
                name: queryEngine.name,
                description: queryEngine.description,
                language: queryEngine.language,
                executor: queryEngine.executor,
                executor_params: queryEngine.executor_params,
                metastore_id: queryEngine.metastore_id,
                status_checker: queryEngine.status_checker,
            });

            await loadQueryEngines();
            history.push(`/admin/query_engine/${data.id}/`);

            return data as IAdminQueryEngine;
        },
        []
    );

    const saveQueryEngine = React.useCallback(
        async (queryEngine: Partial<IAdminQueryEngine>) => {
            const { data } = await ds.update(
                `/admin/query_engine/${queryEngineId}/`,
                queryEngine
            );

            return data as IAdminQueryEngine;
        },
        [queryEngineId]
    );

    const deleteQueryEngine = React.useCallback(
        (queryEngine: IAdminQueryEngine) => {
            return ds.delete(`/admin/query_engine/${queryEngine.id}/`);
        },
        []
    );

    const recoverQueryEngine = React.useCallback(async (engineId: number) => {
        const { data } = await ds.save(
            `/admin/query_engine/${engineId}/recover/`
        );

        await loadQueryEngines();
        history.push(`/admin/query_engine/${engineId}/`);

        return data as IAdminQueryEngine;
    }, []);

    const itemValidator = React.useCallback(
        (queryEngine: IAdminQueryEngine) => {
            const errors: Partial<Record<keyof IAdminQueryEngine, string>> = {};
            if ((queryEngine.description || '').length > 500) {
                errors.description = 'Description is too long';
            }

            if (!datahubLanguages.includes(queryEngine.language)) {
                errors.language = 'Unsupported language';
            }

            if (
                !executorByLanguage[queryEngine.language].includes(
                    queryEngine.executor
                )
            ) {
                errors.executor = 'Unsupported executor';
            }
            if (executorTemplate) {
                const formValid = validateForm(
                    queryEngine.executor_params,
                    executorTemplate[queryEngine.executor]
                );
                if (!formValid[0]) {
                    errors.executor_params = `Error found in ${formValid[2]}: ${formValid[1]}`;
                }
            }

            return errors;
        },
        [datahubLanguages, executorByLanguage, executorTemplate]
    );

    const renderQueryEngineExecutorParams = (
        template: TemplatedForm,
        executorParams: Record<string, any>,
        onChange: (
            fieldName: string,
            fieldValue: any,
            item?: IAdminQueryEngine
        ) => IAdminQueryEngine
    ) => {
        return (
            <SmartForm
                formField={template}
                value={executorParams}
                onChange={(path, value) =>
                    onChange(
                        'executor_params',
                        updateValue(executorParams, path, value)
                    )
                }
            />
        );
    };

    const renderQueryEngineItem = (
        item: IAdminQueryEngine,
        onChange: (fieldName: string, fieldValue: any) => IAdminQueryEngine
    ) => {
        const updateExecutor = (executor: string) => {
            onChange('executor', executor);
            onChange(
                'executor_params',
                getDefaultFormValue(executorTemplate[executor])
            );
        };

        const environmentDOM = item.id != null && (
            <div className="AdminForm-section">
                <div className="AdminForm-section-top flex-row">
                    <div className="AdminForm-section-title">Environments</div>
                    <hr className="dh-hr" />
                </div>
                <div className="AdminForm-section-content">
                    <p>
                        This section is read only. Please add the query engine
                        to the environment in the{' '}
                        <Link to="/admin/environment/">environment config</Link>
                        .
                    </p>
                    <div className="AdmingQueryEngine-environment-list m8 p8">
                        {item.environments?.length
                            ? item.environments.map((environment) => (
                                  <div key={environment.id}>
                                      <Link
                                          to={`/admin/environment/${environment.id}/`}
                                      >
                                          {environment.name}
                                      </Link>
                                  </div>
                              ))
                            : 'This query engine does not belong to any environment.'}
                    </div>
                </div>
            </div>
        );

        const logDOM = item.id != null && (
            <div className="right-align">
                <AdminAuditLogButton itemType="query_engine" itemId={item.id} />
            </div>
        );

        return (
            <>
                <div className="AdminForm-top">
                    {logDOM}
                    <SimpleField stacked name="name" type="input" />
                </div>
                <div className="AdminForm-main">
                    <div className="AdminForm-left">
                        <SimpleField
                            stacked
                            name="description"
                            type="textarea"
                            rows={3}
                        />
                        <div className="flex-row">
                            <SimpleField
                                stacked
                                name="metastore_id"
                                label="Metastore"
                                type="select"
                                options={(metastores || []).map(
                                    (metastore: IAdminMetastore) => ({
                                        key: metastore.id,
                                        value: metastore.name,
                                    })
                                )}
                                withDeselect
                            />
                            <SimpleField
                                stacked
                                name="status_checker"
                                type="select"
                                options={engineStatusCheckerNames}
                                withDeselect
                            />
                            <SimpleField
                                stacked
                                name="language"
                                type="select"
                                options={datahubLanguages}
                                onChange={(language) => {
                                    onChange('language', language);
                                    updateExecutor(
                                        executorByLanguage[language][0]
                                    );
                                }}
                            />
                            <SimpleField
                                stacked
                                name="executor"
                                type="select"
                                options={executorByLanguage[item.language]}
                                onChange={updateExecutor}
                            />
                        </div>
                        <div className="AdminForm-section">
                            <div className="AdminForm-section-top flex-row">
                                <div className="AdminForm-section-title">
                                    Executor Params
                                </div>
                                <hr className="dh-hr" />
                            </div>
                            <div className="AdminForm-section-content">
                                <Loader
                                    renderer={() =>
                                        renderQueryEngineExecutorParams(
                                            executorTemplate[item.executor],
                                            item.executor_params,
                                            onChange
                                        )
                                    }
                                    item={executorTemplate[item.executor]}
                                    itemLoader={() => {
                                        return;
                                    }}
                                />
                            </div>
                        </div>
                        {environmentDOM}
                    </div>
                </div>
            </>
        );
    };

    if (queryEngineId === 'new') {
        if (datahubLanguages && executorByLanguage && executorTemplate) {
            const defaultLanguage = datahubLanguages[0];
            const defaultExecutor = executorByLanguage[defaultLanguage]?.[0];
            const defaultExecutorTemplate = executorTemplate[defaultExecutor];

            const newQueryEngine: IAdminQueryEngine = {
                id: null,
                created_at: moment().unix(),
                updated_at: moment().unix(),
                deleted_at: null,
                name: '',
                language: defaultLanguage,
                description: '',
                metastore_id: null,
                executor: defaultExecutor,
                executor_params:
                    defaultExecutorTemplate &&
                    getDefaultFormValue(defaultExecutorTemplate),
                status_checker: null,
            };
            return (
                <div className="AdminQueryEngine">
                    <div className="AdminForm">
                        <SingleCRUD
                            item={newQueryEngine}
                            createItem={createQueryEngine}
                            renderItem={renderQueryEngineItem}
                            validate={itemValidator}
                        />
                    </div>
                </div>
            );
        } else {
            return <Loading />;
        }
    }

    const queryEngineItem = queryEngines?.find(
        (engine) => Number(queryEngineId) === engine.id
    );

    if (
        queryEngineId === 'deleted' ||
        (queryEngineItem && queryEngineItem.deleted_at !== null)
    ) {
        const deletedQueryEngines = queryEngineItem?.deleted_at
            ? [queryEngineItem]
            : queryEngines?.filter((eng) => eng.deleted_at);
        return (
            <div className="AdminQueryEngine">
                <div className="AdminLanding-top">
                    <div className="AdminLanding-desc">
                        Deleted metastores can be recovered.
                    </div>
                </div>
                <div className="AdminLanding-content">
                    <AdminDeletedList
                        items={deletedQueryEngines}
                        onRecover={recoverQueryEngine}
                        keysToShow={[
                            'created_at',
                            'deleted_at',
                            'executor',
                            'executor_params',
                        ]}
                    />
                </div>
            </div>
        );
    }

    if (queryEngineItem) {
        if (datahubLanguages && executorByLanguage && executorTemplate) {
            return (
                <div className="AdminQueryEngine">
                    <div className="AdminForm">
                        <SingleCRUD
                            item={queryEngineItem}
                            deleteItem={deleteQueryEngine}
                            updateItem={saveQueryEngine}
                            validate={itemValidator}
                            renderItem={renderQueryEngineItem}
                            onItemCUD={loadQueryEngines}
                            onDelete={() =>
                                history.push('/admin/query_engine/')
                            }
                        />
                    </div>
                </div>
            );
        } else {
            return <Loading />;
        }
    } else {
        const getCardDOM = () => {
            return clone(queryEngines)
                .filter((eng) => eng.deleted_at == null)
                .sort((e1, e2) => e2.updated_at - e1.updated_at)
                .slice(0, 5)
                .map((e) => {
                    return (
                        <Card
                            key={e.id}
                            title={e.name}
                            children={
                                <div className="AdminLanding-card-content">
                                    <div className="AdminLanding-card-content-top">
                                        Last Updated
                                    </div>
                                    <div className="AdminLanding-card-content-date">
                                        {generateFormattedDate(e.updated_at)}
                                    </div>
                                </div>
                            }
                            onClick={() =>
                                history.push(`/admin/query_engine/${e.id}/`)
                            }
                            height="160px"
                            width="240px"
                        />
                    );
                });
        };
        return (
            <div className="AdminQueryEngine">
                <div className="AdminLanding">
                    <div className="AdminLanding-top">
                        <Level>
                            <div className="AdminLanding-title">
                                Query Engine
                            </div>

                            <AdminAuditLogButton itemType={'query_engine'} />
                        </Level>
                        <div className="AdminLanding-desc">
                            Explore data in any language, from any data source.
                        </div>
                    </div>
                    <div className="AdminLanding-content">
                        <div className="AdminLanding-cards flex-row">
                            {queryEngines && getCardDOM()}
                            <Card
                                title="+"
                                children="create a new query engine"
                                onClick={() =>
                                    history.push('/admin/query_engine/new/')
                                }
                                height="160px"
                                width="240px"
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
};
