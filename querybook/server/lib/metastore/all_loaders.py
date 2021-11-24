from lib.utils.import_helper import import_module_with_default, import_modules

PROVIDED_METASTORE_LOADERS = import_modules(
    [
        ("lib.metastore.loaders.hive_metastore_loader", "HMSMetastoreLoader"),
        ("lib.metastore.loaders.mysql_metastore_loader", "MysqlMetastoreLoader"),
        (
            "lib.metastore.loaders.thrifthive_metastore_loader",
            "HMSThriftMetastoreLoader",
        ),
        (
            "lib.metastore.loaders.sqlalchemy_metastore_loader",
            "SqlAlchemyMetastoreLoader",
        ),
        ("lib.metastore.loaders.glue_data_catalog_loader", "GlueDataCatalogLoader"),
    ]
)

ALL_PLUGIN_METASTORE_LOADERS = import_module_with_default(
    "metastore_plugin", "ALL_PLUGIN_METASTORE_LOADERS", default=[]
)


ALL_METASTORE_LOADERS = PROVIDED_METASTORE_LOADERS + ALL_PLUGIN_METASTORE_LOADERS
