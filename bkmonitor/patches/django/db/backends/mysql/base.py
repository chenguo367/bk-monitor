"""
MySQL database backend for Django.

Requires mysqlclient: https://pypi.org/project/mysqlclient/
"""
__implements__ = ["DatabaseWrapper"]

from django.db.backends.mysql.base import DatabaseWrapper as _DatabaseWrapper
from django.utils.functional import cached_property


class DatabaseWrapper(_DatabaseWrapper):
    @cached_property
    def mysql_server_data(self):
        return {
            'version': '5.7.20-tmysql-3.1.5-log',
            'sql_mode': '',
            'default_storage_engine': 'InnoDB',
            'sql_auto_is_null': False,
            'lower_case_table_names': False,
            'has_zoneinfo_database': False,
        }
