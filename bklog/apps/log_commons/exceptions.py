# -*- coding: utf-8 -*-
"""
Tencent is pleased to support the open source community by making BK-LOG 蓝鲸日志平台 available.
Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
BK-LOG 蓝鲸日志平台 is licensed under the MIT License.
License for BK-LOG 蓝鲸日志平台:
--------------------------------------------------------------------
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial
portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
We undertake not to change the open source license (MIT license) applicable to the current version of
the project delivered to anyone in the future.
"""
from django.utils.translation import gettext_lazy as _

from apps.exceptions import BaseException, ErrorCode


class BaseCommonsException(BaseException):
    MODULE_CODE = ErrorCode.BKLOG_COMMONS
    MESSAGE = _("日志通用模块异常")


class SearchHostException(BaseCommonsException):
    ErrorCode = "001"
    MESSAGE = _("根据bk_cloud_id:ip查找主机失败")


class CCMissingBkHostIDException(BaseCommonsException):
    ErrorCode = "002"
    MESSAGE = _("CC返回的主机信息中缺少bk_host_id")


class IllegalMaintainerException(BaseCommonsException):
    ErrorCode = "003"
    MESSAGE = _("非法的授权人")


class SearchLockedException(BaseCommonsException):
    """
    查询时间段权限异常
    """

    ErrorCode = "004"
    MESSAGE = _("查询该时间段数据的权限校验不通过")


class TokenValidatedException(BaseCommonsException):
    """
    token校验异常
    """

    ErrorCode = "005"
    MESSAGE = _("当前分享链接不存在")


class TokenExpiredException(BaseCommonsException):
    """
    token已过期
    """

    ErrorCode = "006"
    MESSAGE = _("当前分享链接已过期")


class TokenDeletedException(BaseCommonsException):
    """
    token已收回
    """

    ErrorCode = "007"
    MESSAGE = _("当前分享链接已收回")

