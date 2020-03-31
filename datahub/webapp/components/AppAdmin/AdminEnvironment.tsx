import React from 'react';
import * as Yup from 'yup';
import { clone } from 'lodash';
import { useParams } from 'react-router-dom';

import ds from 'lib/datasource';
import history from 'lib/router-history';

import { IAdminQueryEngine } from './AdminQueryEngine';
import { AdminDeletedList } from './AdminDeletedList';

import { QueryEngineSelect } from 'components/QueryEngineSelect/QueryEngineSelect';
import { UserEnvironmentEditor } from 'components/UserEnvironmentEditor/UserEnvironmentEditor';

import { Card } from 'ui/Card/Card';
import { SingleCRUD } from 'ui/GenericCRUD/SingleCRUD';

import './AdminEnvironment.scss';
import { SimpleField } from 'ui/FormikField/SimpleField';

export interface IAdminEnvironment {
    id: number;
    name: string;
    description: string;
    image: string;
    public: boolean;
    hidden: boolean;
    shareable: boolean;
    deleted_at: number;
}

const environmentSchema = Yup.object().shape({
    name: Yup.string()
        .matches(/^[a-z_0-9]+$/)
        .min(1)
        .max(255),
    description: Yup.string().max(5000),
    image: Yup.string().max(2083),
    public: Yup.boolean(),
    hidden: Yup.boolean().nullable(),
    id: Yup.number().nullable(),
});

interface IProps {
    environments: IAdminEnvironment[];
    queryEngines: IAdminQueryEngine[];
    loadEnvironments: () => Promise<any>;
    loadQueryEngines: () => Promise<any>;
}

export const AdminEnvironment: React.FunctionComponent<IProps> = ({
    environments,
    queryEngines,
    loadEnvironments,
    loadQueryEngines,
}) => {
    const { id: environmentId } = useParams();

    React.useEffect(() => {
        if (queryEngines === null) {
            loadQueryEngines();
        }
    }, []);

    const createEnvironment = React.useCallback(
        async (environment: IAdminEnvironment) => {
            const { data } = await ds.save(`/admin/environment/`, {
                name: environment.name,
                description: environment.description,
                image: environment.image,
                public: environment.public,
                hidden: environment.hidden,
                shareable: environment.shareable,
            });

            await loadEnvironments();
            history.push(`/admin/environment/${data.id}/`);

            return data as IAdminEnvironment;
        },
        []
    );

    const saveEnvironment = React.useCallback(
        async (environment: IAdminEnvironment) => {
            const { data } = await ds.update(
                `/admin/environment/${environment.id}/`,
                {
                    name: environment.name,
                    description: environment.description,
                    image: environment.image,
                    public: environment.public,
                    hidden: environment.hidden,
                    shareable: environment.shareable,
                }
            );

            return data as IAdminEnvironment;
        },
        []
    );

    const deleteEnvironment = React.useCallback(
        (environment: IAdminEnvironment) => {
            return ds.delete(`/admin/environment/${environment.id}/`);
        },
        []
    );

    const recoverEnvironment = React.useCallback(async (envId: number) => {
        const { data } = await ds.update(
            `/admin/environment/${envId}/recover/`
        );

        await loadEnvironments();
        history.push(`/admin/environment/${envId}/`);

        return data as IAdminEnvironment;
    }, []);

    const handleAddQueryEngine = React.useCallback(
        async (engineId: number) => {
            await ds.update(`/admin/query_engine/${engineId}/`, {
                environment_id: Number(environmentId),
            });
            await loadQueryEngines();
        },
        [environmentId]
    );

    // FIXME: engine.environment_id should be nullable
    // const handleDeleteQueryEngine = async (engineId: number) => {
    //     const QueryEngine = queryEngines.find(
    //         engine => engine.id === engineId
    //     );

    //     await ds.update(`/admin/query_engine/${QueryEngine.id}/`, {
    //         environment_id: null,
    //     });
    //     loadQueryEngines();
    // };

    const queryEnginesInDisplayEnv = React.useMemo(() => {
        return (queryEngines || []).filter(
            (engine) => engine.environment_id === Number(environmentId)
        );
    }, [queryEngines, environmentId]);

    const getQueryEngineListDOM = () => {
        return queryEnginesInDisplayEnv.map((engine) => {
            return (
                <div
                    key={engine.id}
                    className="AdminEnvironment-engine flex-row"
                >
                    {/* <IconButton
                            icon="x"
                            onClick={() => handleDeleteQueryEngine(engine.id)}
                        /> */}
                    <div
                        className="AdminEnvironment-engine-name"
                        onClick={() =>
                            history.push(`/admin/query_engine/${engine.id}`)
                        }
                    >
                        {engine.name}
                    </div>
                </div>
            );
        });
    };

    const renderEnvironmentItem = (
        item: IAdminEnvironment,
        onChange: (fieldName: string, fieldValue: any) => void
    ) => {
        return (
            <>
                <div className="AdminForm-top">
                    <SimpleField stacked name="name" type="input" />
                </div>
                <div className="AdminForm-main">
                    <div className="AdminForm-left">
                        <SimpleField
                            stacked
                            name="description"
                            type="textarea"
                            placeholder="Describe your environment here."
                            rows={3}
                        />
                        <SimpleField
                            stacked
                            name="image"
                            type="input"
                            label="Logo Url"
                        />

                        {environmentId !== 'new' && (
                            <>
                                <div className="AdminForm-section">
                                    <div className="AdminForm-section-top flex-row">
                                        <div className="AdminForm-section-title">
                                            Query Engines
                                        </div>
                                        <div className="dh-hr" />
                                    </div>
                                    <div className="AdminForm-section-content">
                                        <div className="AdminForm-section-top">
                                            <div className="AdminEnvironment-engine-info">
                                                Currently query engines can only
                                                be used in one environment.
                                                Adding a query engine may remove
                                                it from its current environment
                                            </div>
                                            <QueryEngineSelect
                                                queryEngines={(
                                                    queryEngines || []
                                                ).filter(
                                                    (engine) =>
                                                        engine.environment_id !==
                                                        Number(environmentId)
                                                )}
                                                handleAddQueryEngine={
                                                    handleAddQueryEngine
                                                }
                                            />
                                        </div>
                                        <div className="AdminForm-section-list">
                                            <div className="AdminEnvironment-engine-label">
                                                Current Query Engines
                                            </div>
                                            <div className="AdminEnvironment-engine-list">
                                                {queryEnginesInDisplayEnv.length
                                                    ? getQueryEngineListDOM()
                                                    : 'No Query Engines'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="AdminForm-section">
                                    <div className="AdminForm-section-top flex-row">
                                        <div className="AdminForm-section-title">
                                            Access Control
                                        </div>
                                        <div className="dh-hr" />
                                    </div>
                                    <div className="AdminForm-section-content">
                                        <UserEnvironmentEditor
                                            environmentId={item.id}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="AdminForm-right">
                        <SimpleField
                            name="public"
                            type="toggle"
                            help="Public environment are open to all users"
                        />
                        <SimpleField
                            name="hidden"
                            type="toggle"
                            help="Hidden environments will not be shown to unauthorized users"
                        />
                        <SimpleField
                            name="shareable"
                            type="toggle"
                            help="If true, Docs/Queries are readable by default"
                        />
                    </div>
                </div>
            </>
        );
    };

    if (environmentId === 'new') {
        const newEnvironment: IAdminEnvironment = {
            id: null,
            name: '',
            description: '',
            image: '',
            public: true,
            hidden: false,
            shareable: true,
            deleted_at: null,
        };
        return (
            <div className="AdminEnvironment">
                <div className="AdminForm">
                    <SingleCRUD
                        item={newEnvironment}
                        createItem={createEnvironment}
                        renderItem={renderEnvironmentItem}
                        validationSchema={environmentSchema}
                    />
                </div>
            </div>
        );
    }

    const environmentItem = environments?.find(
        (engine) => Number(environmentId) === engine.id
    );

    if (
        environmentId === 'deleted' ||
        (environmentItem && environmentItem.deleted_at !== null)
    ) {
        const deletedEnvironments = environmentItem?.deleted_at
            ? [environmentItem]
            : environments?.filter((env) => env.deleted_at);
        return (
            <div className="AdminEnvironment">
                <div className="AdminLanding-top">
                    <div className="AdminLanding-desc">
                        Deleted environments can be recovered.
                    </div>
                </div>
                <div className="AdminLanding-content">
                    <AdminDeletedList
                        items={deletedEnvironments}
                        onRecover={recoverEnvironment}
                        keysToShow={[
                            'deleted_at',
                            'description',
                            'hidden',
                            'public',
                        ]}
                    />
                </div>
            </div>
        );
    }

    if (environmentItem) {
        return (
            <div className="AdminEnvironment">
                <div className="AdminForm">
                    <SingleCRUD
                        item={environmentItem}
                        deleteItem={deleteEnvironment}
                        updateItem={saveEnvironment}
                        validationSchema={environmentSchema}
                        renderItem={renderEnvironmentItem}
                        onItemCUD={loadEnvironments}
                        onDelete={() => history.push('/admin/environment/')}
                    />
                </div>
            </div>
        );
    } else {
        const getCardDOM = () => {
            return clone(environments)
                .filter((env) => env.deleted_at == null)
                .sort((env1, env2) => env1.id - env2.id)
                .slice(0, 5)
                .map((env) => {
                    return (
                        <Card
                            key={env.id}
                            title={env.name}
                            children={
                                <div className="AdminLanding-card-content">
                                    {env.description}
                                </div>
                            }
                            onClick={() =>
                                history.push(`/admin/environment/${env.id}/`)
                            }
                            height="160px"
                            width="240px"
                        />
                    );
                });
        };
        return (
            <div className="AdminEnvironment">
                <div className="AdminLanding">
                    <div className="AdminLanding-top">
                        <div className="AdminLanding-title">Environment</div>
                        <div className="AdminLanding-desc">
                            DataHub provides environments for access control and
                            scoped workspaces.
                        </div>
                    </div>
                    <div className="AdminLanding-content">
                        <div className="AdminLanding-cards flex-row">
                            {environments && getCardDOM()}
                            <Card
                                title="+"
                                children="create a new environment"
                                onClick={() =>
                                    history.push('/admin/environment/new/')
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
