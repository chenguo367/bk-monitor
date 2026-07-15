"""
故障 TopN：incident_name/incident_reason 走 *.raw 聚合，并过滤幽灵字段。

部署验收（发版后）：
1. 等待 rollover_indices（约每 24 分钟）或手动执行 manage.py rollover_index，
   使 IncidentDocument 模板写入 Text.fields.raw，并在 mapping 变更时切新索引。
2. status=abnormal 的故障会被 REINDEX_QUERY 迁到新索引；已结束故障留在旧索引，
   对 incident_name.raw 聚合不再 400，但历史 doc 的 .raw 可能为空（桶可能偏少，可接受）。
3. bkop 复现 POST /rest/v2/incident/top_n/，fields 含 incident_name 应 200；
   trace 中 ES DSL 应为 terms/cardinality field=incident_name.raw。
"""

from unittest import mock

from bkmonitor.documents.incident import IncidentDocument
from fta_web.alert.handlers.base import _FIELD_MAP_CACHE
from fta_web.alert.handlers.incident import IncidentQueryHandler, IncidentQueryTransformer


class TestIncidentTopNAggField:
    def setup_method(self):
        _FIELD_MAP_CACHE.pop(IncidentQueryTransformer, None)

    def test_incident_name_agg_field_uses_raw(self):
        assert (
            IncidentQueryTransformer.transform_field_to_es_field("incident_name", for_agg=True)
            == "incident_name.raw"
        )
        assert (
            IncidentQueryTransformer.transform_field_to_es_field("incident_reason", for_agg=True)
            == "incident_reason.raw"
        )

    def test_incident_name_search_field_stays_text(self):
        assert IncidentQueryTransformer.transform_field_to_es_field("incident_name") == "incident_name"
        assert IncidentQueryTransformer.transform_field_to_es_field("incident_reason") == "incident_reason"

    def test_document_mapping_has_raw_multi_field(self):
        # Prefer index mapping dict; fall back to _doc_type for older elasticsearch-dsl
        try:
            mapping = IncidentDocument._index.to_dict()
            properties = mapping.get("mappings", mapping).get("properties", {})
        except Exception:
            properties = IncidentDocument._doc_type.mapping.to_dict()["properties"]
        assert properties["incident_name"]["type"] == "text"
        assert properties["incident_name"]["fields"]["raw"]["type"] == "keyword"
        assert properties["incident_reason"]["type"] == "text"
        assert properties["incident_reason"]["fields"]["raw"]["type"] == "keyword"


class TestIncidentTopNFieldFilter:
    def setup_method(self):
        self.handler = IncidentQueryHandler.__new__(IncidentQueryHandler)

    def test_filter_keeps_allowed_and_drops_ghost_fields(self):
        fields = [
            "incident_name",
            "status",
            "incident_type",
            "operator",
            "duration",
            "strategy_name",
            "operate_target_string",
            "-assignees",
        ]
        assert self.handler.filter_top_n_fields(fields) == ["incident_name", "status", "-assignees"]

    def test_top_n_passes_filtered_fields_to_super(self):
        with mock.patch.object(IncidentQueryHandler, "filter_top_n_fields", return_value=["status"]) as mock_filter:
            with mock.patch(
                "fta_web.alert.handlers.base.BaseQueryHandler.top_n",
                return_value={"doc_count": 0, "fields": []},
            ) as mock_super:
                result = self.handler.top_n(
                    ["incident_name", "incident_type", "strategy_name"],
                    size=10,
                    translators=None,
                )

        mock_filter.assert_called_once_with(["incident_name", "incident_type", "strategy_name"])
        mock_super.assert_called_once_with(["status"], 10, None)
        assert result == {"doc_count": 0, "fields": []}
