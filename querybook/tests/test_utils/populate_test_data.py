# from app.db import DBSession
# from logic.environment import (
#     create_environment,
#     add_user_to_environment,
# )
# from logic.admin import (
#     # create_announcement,
#     create_query_engine,
#     create_query_metastore,
#     # create_api_access_token,

# )
# # from logic.datadoc import (
# #     create_data_doc,
# #     create_data_cell,
# #     insert_data_doc_cell
# # )
# from logic.user import (
#     create_user
# )
# from logic.metastore import (
#     create_schema,
#     create_table,
#     create_column
# )


# def main():
#     with DBSession() as session:
#         environment = create_environment(
#             'test',
#             description='Environment for testing',
#             session=session,
#         )
#         user = create_user(
#             'test_user',
#             password='hunter2',
#             fullname='Test User',
#             profile_img=None,
#             email='test@test.com',
#             session=session
#         )
#         add_user_to_environment(
#             environment.id,
#             user.id,
#             session=session
#         )

#         metastore = create_query_metastore(
#             'test_db',
#             {
#                 "connection_string":
#                     "mysql+pymysql://test:passw0rd@mysql:3306/querybook2_test?charset=utf8mb4"
#             },
#             'MysqlMetastoreLoader',
#             acl_control={},
#             session=session
#         )
#         create_query_engine(
#             'Mysql Test',
#             'Test engine that connects to mysql',
#             'mysql',
#             'sqlalchemy',
#             {
#                 "connection_string":
#                     "mysql+pymysql://test:passw0rd@mysql:3306/querybook2_test?charset=utf8mb4"
#             },
#             environment.id,
#             metastore.id,
#             session=session
#         )

#         schema = create_schema(
#             name='default',
#             table_count=1,
#             description=None,
#             metastore_id=metastore.id,
#             session=session
#         )
#         table = create_table(
#             name='test_table',
#             type='BASE TABLE',
#             owner='someone',
#             column_count=2,
#             schema_id=schema.id,
#             session=session
#         )
#         create_column(
#             name='id',
#             type='int',
#             table_id=table.id,
#             session=session
#         )
#         create_column(
#             name=None,
#             type=None,

#             comment=None,

#             table_id=None,
#             commit=True,
#             session=None
#         )


# if __name__ == "__main__":
#     main()
