import { clone } from 'lodash';
import React from 'react';
import { useParams } from 'react-router-dom';
import * as Yup from 'yup';

import { AdminAuditLogButton } from 'components/AdminAuditLog/AdminAuditLogButton';
import { QueryEngineSelect } from 'components/QueryEngineSelect/QueryEngineSelect';
import { UserEnvironmentEditor } from 'components/UserEnvironmentEditor/UserEnvironmentEditor';
import { IAdminEnvironment, IAdminQueryEngine } from 'const/admin';
import { useResource } from 'hooks/useResource';
import history from 'lib/router-history';
import { AdminEnvironmentResource } from 'resource/admin';
import { IconButton } from 'ui/Button/IconButton';
import { Card } from 'ui/Card/Card';
import { DraggableList } from 'ui/DraggableList/DraggableList';
import { SimpleField } from 'ui/FormikField/SimpleField';
import { GenericCRUD } from 'ui/GenericCRUD/GenericCRUD';
import { Level } from 'ui/Level/Level';

import { AdminDeletedList } from './AdminDeletedList';

import './AdminEnvironment.scss';

const environmentSchema = Yup.object().shape({
    name: Yup.string()
        .min(1)
        .max(255)
        .matches(/^[a-z_0-9]+$/)
        .required(),
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
    const createEnvironment = React.useCallback(
        async (environment: IAdminEnvironment) => {
            const { data } = await AdminEnvironmentResource.create(
                environment.name,
                environment.description,
                environment.image,
                environment.public,
                environment.hidden,
                environment.shareable
            );

            await loadEnvironments();
            history.push(`/admin/environment/${data.id}/`);

            return data;
        },
        []
    );

    const saveEnvironment = React.useCallback(
        async (environment: Partial<IAdminEnvironment>) => {
            const { data } = await AdminEnvironmentResource.update(
                environmentId,
                environment
            );

            return data as IAdminEnvironment;
        },
        [environmentId]
    );

    const deleteEnvironment = React.useCallback(
        (environment: IAdminEnvironment) =>
            AdminEnvironmentResource.delete(environment.id),
        []
    );

    const recoverEnvironment = React.useCallback(async (envId: number) => {
        const { data } = await AdminEnvironmentResource.recover(envId);

        await loadEnvironments();
        history.push(`/admin/environment/${envId}/`);

        return data;
    }, []);

    const renderEnvironmentItem = (item: IAdminEnvironment) => {
        const logDOM = item.id != null && (
            <div className="right-align">
                <AdminAuditLogButton itemType="environment" itemId={item.id} />
            </div>
        );
        return (
            <>
                <div className="AdminForm-top">
                    {logDOM}
                    <SimpleField
                        stacked
                        name="name"
                        label="Key"
                        type="input"
                        help="Lower case alphanumeric and underscore only"
                        required
                    />
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
                                <AdminEnvironmentQueryEngine
                                    queryEngines={queryEngines}
                                    environmentId={environmentId}
                                    loadQueryEngines={loadQueryEngines}
                                />
                                <div className="AdminForm-section">
                                    <div className="AdminForm-section-top flex-row">
                                        <div className="AdminForm-section-title">
                                            Access Control
                                        </div>
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
                            help="If public, all users on Querybook can access this environment."
                        />
                        <SimpleField
                            name="hidden"
                            type="toggle"
                            help="Hidden environments will not be shown to unauthorized users in their environment picker."
                        />
                        <SimpleField
                            name="shareable"
                            type="toggle"
                            help={
                                "If true, all docs and query executions in the environment are readable to users even if they don't have access. " +
                                'If false, users would need to be explicitly invited to view docs/queries'
                            }
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
                    <GenericCRUD
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
                    <GenericCRUD
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
        const getCardDOM = () =>
            clone(environments)
                .filter((env) => env.deleted_at == null)
                .sort((env1, env2) => env1.id - env2.id)
                .slice(0, 5)
                .map((env) => (
                    <Card
                        key={env.id}
                        title={env.name}
                        onClick={() =>
                            history.push(`/admin/environment/${env.id}/`)
                        }
                        height="160px"
                        width="240px"
                    >
                        <div className="AdminLanding-card-content">
                            {env.description}
                        </div>
                    </Card>
                ));
        return (
            <div className="AdminEnvironment">
                <div className="AdminLanding">
                    <div className="AdminLanding-top">
                        <Level>
                            <div className="AdminLanding-title">
                                Environment
                            </div>
                            <AdminAuditLogButton itemType={'environment'} />
                        </Level>
                        <div className="AdminLanding-desc">
                            Querybook provides environments for access control
                            and scoped workspaces.
                        </div>
                    </div>
                    <div className="AdminLanding-content">
                        <div className="AdminLanding-cards flex-row">
                            {environments && getCardDOM()}
                            <Card
                                title="+"
                                onClick={() =>
                                    history.push('/admin/environment/new/')
                                }
                                height="160px"
                                width="240px"
                            >
                                create a new environment
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
};

const AdminEnvironmentQueryEngine: React.FC<{
    queryEngines: IAdminQueryEngine[];
    loadQueryEngines: () => Promise<any>;
    environmentId: number;
}> = ({ queryEngines, loadQueryEngines, environmentId }) => {
    React.useEffect(() => {
        if (queryEngines === null) {
            loadQueryEngines();
        }
    }, []);

    const { data: environmentEngines, forceFetch: fetchEnvironmentEngines } =
        useResource(
            React.useCallback(
                () => AdminEnvironmentResource.getQueryEngines(environmentId),
                [environmentId]
            )
        );

    const handleAddQueryEngine = React.useCallback(
        async (engineId: number) => {
            await AdminEnvironmentResource.addQueryEngine(
                environmentId,
                engineId
            );
            await fetchEnvironmentEngines();
        },
        [environmentId]
    );

    const handleDeleteQueryEngine = React.useCallback(
        async (engineId: number) => {
            await AdminEnvironmentResource.removeQueryEngine(
                environmentId,
                engineId
            );
            await fetchEnvironmentEngines();
        },
        [environmentId]
    );

    const handleSwapQueryEngine = React.useCallback(
        async (fromIndex: number, toIndex: number) => {
            await AdminEnvironmentResource.swapQueryEngines(
                environmentId,
                fromIndex,
                toIndex
            );
            await fetchEnvironmentEngines();
        },
        [environmentId]
    );

    const queryEnginesNotInDisplayEnv = React.useMemo(
        () =>
            (queryEngines || []).filter(
                (engine) =>
                    !environmentEngines?.some(
                        (envEngine) => envEngine.id === engine.id
                    )
            ),

        [queryEngines, environmentEngines]
    );

    const getQueryEngineListDOM = () => (
        <DraggableList
            items={environmentEngines ?? []}
            renderItem={(index, engine) => (
                <div className="AdminEnvironment-engine horizontal-space-between">
                    <div
                        className="AdminEnvironment-engine-name"
                        onClick={() =>
                            history.push(`/admin/query_engine/${engine.id}`)
                        }
                    >
                        {engine.name}
                    </div>
                    <IconButton
                        className="delete-query-engine-button"
                        noPadding
                        icon="X"
                        onClick={() => handleDeleteQueryEngine(engine.id)}
                    />
                </div>
            )}
            onMove={handleSwapQueryEngine}
        />
    );

    return (
        <div className="AdminForm-section">
            <div className="AdminForm-section-top flex-row">
                <div className="AdminForm-section-title">Query Engines</div>
            </div>
            <div className="AdminForm-section-content">
                <div className="AdminForm-section-top">
                    {queryEnginesNotInDisplayEnv.length ? (
                        <QueryEngineSelect
                            queryEngines={queryEnginesNotInDisplayEnv}
                            handleAddQueryEngine={handleAddQueryEngine}
                        />
                    ) : null}
                </div>

                <div className="AdminForm-section-list">
                    <div className="AdminEnvironment-engine-label">
                        Current Query Engines
                    </div>
                    <div className="AdminEnvironment-engine-list">
                        {environmentEngines?.length
                            ? getQueryEngineListDOM()
                            : 'No Query Engines'}
                    </div>
                </div>
            </div>
        </div>
    );
};
