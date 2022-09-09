import { clone } from 'lodash';
import moment from 'moment';
import React from 'react';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';

import { AdminAuditLogButton } from 'components/AdminAuditLog/AdminAuditLogButton';
import { IAdminMetastore, IAdminQueryEngine } from 'const/admin';
import { QueryEngineStatus } from 'const/queryEngine';
import { useResource } from 'hooks/useResource';
import { sendConfirm } from 'lib/querybookUI';
import history from 'lib/router-history';
import { titleize } from 'lib/utils';
import { generateFormattedDate } from 'lib/utils/datetime';
import NOOP from 'lib/utils/noop';
import { AdminQueryEngineResource } from 'resource/admin/queryEngine';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { Card } from 'ui/Card/Card';
import { Content } from 'ui/Content/Content';
import { SimpleField } from 'ui/FormikField/SimpleField';
import { GenericCRUD } from 'ui/GenericCRUD/GenericCRUD';
import { Level } from 'ui/Level/Level';
import { Link } from 'ui/Link/Link';
import { Loader } from 'ui/Loader/Loader';
import { Loading } from 'ui/Loading/Loading';
import {
    getDefaultFormValue,
    SmartForm,
    TemplatedForm,
    updateValue,
    validateForm,
} from 'ui/SmartForm/SmartForm';

import { AdminDeletedList } from './AdminDeletedList';

import './AdminQueryEngine.scss';

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

    const { data: queryEngineTemplates } = useResource(
        AdminQueryEngineResource.getTemplates
    );

    const { data: engineStatusCheckerNames } = useResource(
        AdminQueryEngineResource.getCheckerNames
    );

    const { data: tableUploadExporterNames } = useResource(
        AdminQueryEngineResource.getTableUploadExporterNames
    );

    const { data: queryValidators } = useResource(
        AdminQueryEngineResource.getQueryValidators
    );

    const querybookLanguages: string[] = React.useMemo(
        () => [
            ...new Set(
                (queryEngineTemplates || []).map(
                    (executor) => executor.language
                )
            ),
        ],
        [queryEngineTemplates]
    );
    const querybookLanguageOptions = React.useMemo(
        () =>
            querybookLanguages.map((l) => ({
                label: titleize(l),
                value: l,
            })),
        [querybookLanguages]
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

    const queryValidatorsPerLanguage = React.useMemo(
        () =>
            (queryValidators ?? []).reduce((hash, validator) => {
                for (const language of validator.languages) {
                    hash[language] = hash[language] ?? [];
                    hash[language].push(validator.name);
                }
                return hash;
            }, {} as Record<string, string[]>),
        [queryValidators]
    );

    React.useEffect(() => {
        if (!metastores) {
            loadMetastores();
        }
    }, []);

    const createQueryEngine = React.useCallback(
        async (queryEngine: IAdminQueryEngine) => {
            const { data } = await AdminQueryEngineResource.create(queryEngine);

            await loadQueryEngines();
            history.push(`/admin/query_engine/${data.id}/`);

            return data;
        },
        []
    );

    const saveQueryEngine = React.useCallback(
        async (queryEngine: Partial<IAdminQueryEngine>) => {
            const { data } = await AdminQueryEngineResource.update(
                queryEngineId,
                queryEngine
            );
            return data;
        },
        [queryEngineId]
    );

    const deleteQueryEngine = React.useCallback(
        (queryEngine: IAdminQueryEngine) =>
            new Promise((resolve, reject) => {
                sendConfirm({
                    header: 'Archive Query Engine?',
                    message: (
                        <Content>
                            <p>
                                Once archived, the engine will become{' '}
                                <b>read-only</b>, and it can be recovered later
                                in the{' '}
                                <Link to="/admin/query_engine/deleted/">
                                    trash
                                </Link>
                                .
                            </p>
                            <br />
                            <p>Archiving this query engine means:</p>
                            <ul>
                                <li>
                                    New queries using this engine will fail.
                                </li>
                                <li>
                                    Users will not be able to see this engine in
                                    any environment.
                                </li>
                                <li>
                                    Users' past queries and query results are
                                    preserved and accessible.
                                </li>
                            </ul>
                            <p>
                                If you want to revoke all users' access to their
                                past query results executed by the engine,
                                please remove the engine from all environments
                                before archiving.
                            </p>
                        </Content>
                    ),
                    onConfirm: () =>
                        AdminQueryEngineResource.delete(queryEngine.id).then(
                            resolve
                        ),
                    onDismiss: reject,
                });
            }),
        []
    );

    const recoverQueryEngine = React.useCallback(async (engineId: number) => {
        const { data } = await AdminQueryEngineResource.recover(engineId);

        await loadQueryEngines();
        history.push(`/admin/query_engine/${engineId}/`);

        return data;
    }, []);

    const itemValidator = React.useCallback(
        (queryEngine: IAdminQueryEngine) => {
            const errors: Partial<Record<keyof IAdminQueryEngine, string>> = {};
            if ((queryEngine.description || '').length > 500) {
                errors.description = 'Description is too long';
            }

            if (!querybookLanguages.includes(queryEngine.language)) {
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
        [querybookLanguages, executorByLanguage, executorTemplate]
    );

    const renderQueryEngineExecutorParams = (
        template: TemplatedForm,
        executorParams: Record<string, any>,
        onChange: (
            fieldName: string,
            fieldValue: any,
            item?: IAdminQueryEngine
        ) => void
    ) => (
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

    const renderQueryEngineItem = (
        item: IAdminQueryEngine,
        onChange: (fieldName: string, fieldValue: any) => void
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
                </div>
                <div className="AdminForm-section-content">
                    <p>
                        This section is read only. Please add the query engine
                        to the environment in the{' '}
                        <Link to="/admin/environment/">environment config</Link>
                        .
                    </p>
                    <div className="AdmingQueryEngine-environment-list mt8 p8">
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
                            : 'This query engine does not belong to any environments.'}
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
                        <div className="flex-row stacked-fields flex0-children">
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
                                onChange={(value) => {
                                    onChange(
                                        'metastore_id',
                                        value !== '' ? value : null
                                    );
                                }}
                                withDeselect
                            />
                            <SimpleField
                                stacked
                                help={() => (
                                    <div>
                                        Didn’t find your engine? Querybook
                                        supports more, click{' '}
                                        <Link
                                            newTab
                                            to="https://www.querybook.org/docs/setup_guide/connect_to_query_engines/"
                                        >
                                            here
                                        </Link>{' '}
                                        to find out how to easily enable it.
                                    </div>
                                )}
                                name="language"
                                type="react-select"
                                options={querybookLanguageOptions}
                                onChange={(language) => {
                                    onChange('language', language);
                                    updateExecutor(
                                        executorByLanguage[language][0]
                                    );
                                }}
                                className="flex1"
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
                                    itemLoader={NOOP}
                                />
                            </div>
                        </div>

                        <div className="AdminForm-section">
                            <div className="AdminForm-section-top flex-row">
                                <div className="AdminForm-section-title">
                                    Additional Features
                                </div>
                            </div>
                            <div className="AdminForm-section-content">
                                <SimpleField
                                    stacked
                                    name="feature_params.status_checker"
                                    type="react-select"
                                    options={engineStatusCheckerNames}
                                    withDeselect
                                />

                                <SimpleField
                                    stacked
                                    name="feature_params.upload_exporter"
                                    type="react-select"
                                    label="(Experimental) Table Upload Exporter"
                                    options={tableUploadExporterNames}
                                    withDeselect
                                />

                                <SimpleField
                                    stacked
                                    name="feature_params.validator"
                                    type="react-select"
                                    label="(Experimental) Query Validator"
                                    options={
                                        queryValidatorsPerLanguage[
                                            item.language
                                        ] ?? []
                                    }
                                    withDeselect
                                />

                                <SimpleField
                                    stacked
                                    name="feature_params.row_limit"
                                    type="toggle"
                                    label="(Experimental) Enable Row Limit"
                                />
                            </div>
                        </div>

                        {environmentDOM}
                    </div>
                </div>
            </>
        );
    };

    const renderQueryEngineItemActions = (item: IAdminQueryEngine) => {
        const hasStatusChecker = Boolean(item.feature_params?.status_checker);
        const handleTestConnectionClick = () =>
            toast.promise(
                AdminQueryEngineResource.testConnection(item).then(
                    ({ data }) => {
                        if (data.status === QueryEngineStatus.GOOD) {
                            return Promise.resolve(data.messages);
                        } else {
                            return Promise.reject(data.messages);
                        }
                    }
                ),
                {
                    loading: 'Checking status...',
                    success: (msg) => msg.join('\n'),
                    error: (msg) => msg.join('\n'),
                }
            );
        return (
            <>
                <AsyncButton
                    icon="PlugZap"
                    title="Test Connection"
                    disabled={!hasStatusChecker}
                    aria-label={
                        hasStatusChecker
                            ? null
                            : `Must specify Status Checker to test connection`
                    }
                    data-balloon-pos={'up'}
                    onClick={handleTestConnectionClick}
                    disableWhileAsync
                />
            </>
        );
    };

    if (queryEngineId === 'new') {
        if (querybookLanguages && executorByLanguage && executorTemplate) {
            const defaultLanguage = querybookLanguages[0];
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

                // Since defaultExecutorTemplate has to be StructForm
                executor_params: (defaultExecutorTemplate &&
                    getDefaultFormValue(defaultExecutorTemplate)) as Record<
                    string,
                    any
                >,
                feature_params: {},
            };
            return (
                <div className="AdminQueryEngine">
                    <div className="AdminForm">
                        <GenericCRUD
                            item={newQueryEngine}
                            createItem={createQueryEngine}
                            renderItem={renderQueryEngineItem}
                            renderActions={renderQueryEngineItemActions}
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
                        Deleted query engines can be recovered.
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
        if (querybookLanguages && executorByLanguage && executorTemplate) {
            return (
                <div className="AdminQueryEngine">
                    <div className="AdminForm">
                        <GenericCRUD
                            item={queryEngineItem}
                            deleteItem={deleteQueryEngine}
                            updateItem={saveQueryEngine}
                            validate={itemValidator}
                            renderItem={renderQueryEngineItem}
                            onItemCUD={loadQueryEngines}
                            renderActions={renderQueryEngineItemActions}
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
        const getCardDOM = () =>
            clone(queryEngines)
                .filter((eng) => eng.deleted_at == null)
                .sort((e1, e2) => e2.updated_at - e1.updated_at)
                .slice(0, 5)
                .map((e) => (
                    <Card
                        key={e.id}
                        title={e.name}
                        onClick={() =>
                            history.push(`/admin/query_engine/${e.id}/`)
                        }
                        height="160px"
                        width="240px"
                    >
                        <div className="AdminLanding-card-content">
                            <div className="AdminLanding-card-content-top">
                                Last Updated
                            </div>
                            <div className="AdminLanding-card-content-date">
                                {generateFormattedDate(e.updated_at)}
                            </div>
                        </div>
                    </Card>
                ));
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
                                onClick={() =>
                                    history.push('/admin/query_engine/new/')
                                }
                                height="160px"
                                width="240px"
                            >
                                create a new query engine
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
};
