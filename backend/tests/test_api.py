"""Integration tests for all five API endpoints.

The ``client`` fixture (defined in conftest.py) patches ``get_dataframe`` with
the 5-row SAMPLE_DF so these tests never touch the real CSV file.
"""


# ---------------------------------------------------------------------------
# GET /api/meta
# ---------------------------------------------------------------------------


class TestMeta:
    def test_status_ok(self, client):
        assert client.get("/api/meta").status_code == 200

    def test_response_has_required_keys(self, client):
        data = client.get("/api/meta").json()
        assert "neighborhoods" in data
        assert "types" in data
        assert "dateRange" in data

    def test_neighborhoods_sorted_and_correct(self, client):
        neighborhoods = client.get("/api/meta").json()["neighborhoods"]
        assert neighborhoods == sorted(["Back Bay", "Dorchester", "South End"])

    def test_types_sorted_and_correct(self, client):
        types = client.get("/api/meta").json()["types"]
        expected = sorted(["Graffiti", "Noise Complaint", "Pothole", "Street Light", "Trash"])
        assert types == expected

    def test_date_range_min_max(self, client):
        date_range = client.get("/api/meta").json()["dateRange"]
        assert date_range["min"] == "2026-01-01"
        assert date_range["max"] == "2026-01-04"


# ---------------------------------------------------------------------------
# GET /api/requests
# ---------------------------------------------------------------------------


class TestRequests:
    def test_status_ok(self, client):
        assert client.get("/api/requests").status_code == 200

    def test_returns_list(self, client):
        data = client.get("/api/requests").json()
        assert isinstance(data, list)

    def test_unfiltered_returns_all_rows(self, client):
        data = client.get("/api/requests").json()
        assert len(data) == 5

    def test_record_has_expected_fields(self, client):
        record = client.get("/api/requests").json()[0]
        expected_fields = {
            "id", "caseId", "openDate", "closedDate", "status",
            "onTime", "title", "type", "reason", "department",
            "neighborhood", "source", "location", "latitude", "longitude",
        }
        assert expected_fields.issubset(record.keys())

    def test_ids_are_strings(self, client):
        for record in client.get("/api/requests").json():
            assert isinstance(record["id"], str)
            assert isinstance(record["caseId"], str)

    def test_filter_by_status_open(self, client):
        data = client.get("/api/requests?status=Open").json()
        assert len(data) == 2
        assert all(r["status"] == "Open" for r in data)

    def test_filter_by_status_closed(self, client):
        data = client.get("/api/requests?status=Closed").json()
        assert len(data) == 3
        assert all(r["status"] == "Closed" for r in data)

    def test_filter_by_neighborhood(self, client):
        data = client.get("/api/requests?neighborhood=Dorchester").json()
        assert len(data) == 2
        assert all(r["neighborhood"] == "Dorchester" for r in data)

    def test_filter_by_type(self, client):
        data = client.get("/api/requests?type=Pothole").json()
        assert len(data) == 1
        assert data[0]["type"] == "Pothole"

    def test_filter_by_start_date(self, client):
        data = client.get("/api/requests?start_date=2026-01-03").json()
        # Rows with open_dt on/after 2026-01-03 plus the NaT row = 3
        assert len(data) == 3

    def test_filter_by_end_date(self, client):
        data = client.get("/api/requests?end_date=2026-01-02").json()
        # Rows with open_dt on/before 2026-01-02 plus the NaT row = 3
        assert len(data) == 3

    def test_combined_filters(self, client):
        data = client.get(
            "/api/requests?neighborhood=Back+Bay&status=Closed"
        ).json()
        assert len(data) == 1
        assert data[0]["neighborhood"] == "Back Bay"
        assert data[0]["status"] == "Closed"

    def test_no_matching_rows_returns_empty_list(self, client):
        data = client.get("/api/requests?neighborhood=NoWhere").json()
        assert data == []

    def test_nan_coordinates_serialise_as_null(self, client):
        # The last row has no lat/lon
        data = client.get("/api/requests").json()
        null_coord_rows = [r for r in data if r["latitude"] is None]
        assert len(null_coord_rows) == 1


# ---------------------------------------------------------------------------
# GET /api/stats
# ---------------------------------------------------------------------------


class TestStats:
    def test_status_ok(self, client):
        assert client.get("/api/stats").status_code == 200

    def test_response_has_required_keys(self, client):
        data = client.get("/api/stats").json()
        assert set(data.keys()) == {
            "total", "open", "closed", "onTimeRate", "avgResponseTimeHours"
        }

    def test_total_is_correct(self, client):
        assert client.get("/api/stats").json()["total"] == 5

    def test_open_closed_counts(self, client):
        data = client.get("/api/stats").json()
        assert data["open"] == 2
        assert data["closed"] == 3

    def test_on_time_rate_range(self, client):
        rate = client.get("/api/stats").json()["onTimeRate"]
        assert 0 <= rate <= 100

    def test_on_time_rate_value(self, client):
        # 3 out of 5 rows have on_time == "ONTIME"
        rate = client.get("/api/stats").json()["onTimeRate"]
        assert rate == 60.0

    def test_avg_response_hours_positive(self, client):
        hours = client.get("/api/stats").json()["avgResponseTimeHours"]
        assert hours > 0

    def test_filtered_stats(self, client):
        data = client.get("/api/stats?status=Open").json()
        assert data["total"] == 2
        assert data["open"] == 2
        assert data["closed"] == 0

    def test_empty_filter_stats(self, client):
        data = client.get("/api/stats?neighborhood=NoWhere").json()
        assert data["total"] == 0
        assert data["onTimeRate"] == 0.0
        assert data["avgResponseTimeHours"] == 0.0


# ---------------------------------------------------------------------------
# GET /api/time-series
# ---------------------------------------------------------------------------


class TestTimeSeries:
    def test_status_ok(self, client):
        assert client.get("/api/time-series").status_code == 200

    def test_returns_list(self, client):
        assert isinstance(client.get("/api/time-series").json(), list)

    def test_record_has_date_and_count(self, client):
        for item in client.get("/api/time-series").json():
            assert "date" in item
            assert "count" in item

    def test_dates_are_strings(self, client):
        for item in client.get("/api/time-series").json():
            assert isinstance(item["date"], str)

    def test_counts_are_positive(self, client):
        for item in client.get("/api/time-series").json():
            assert item["count"] > 0

    def test_four_dated_rows_produce_four_entries(self, client):
        # 4 rows have a real open_dt; each is on a distinct date → 4 entries
        data = client.get("/api/time-series").json()
        assert len(data) == 4

    def test_filtered_time_series(self, client):
        data = client.get("/api/time-series?start_date=2026-01-03").json()
        assert len(data) == 2

    def test_empty_result_when_no_rows_match(self, client):
        data = client.get("/api/time-series?neighborhood=NoWhere").json()
        assert data == []


# ---------------------------------------------------------------------------
# GET /api/categories
# ---------------------------------------------------------------------------


class TestCategories:
    def test_status_ok(self, client):
        assert client.get("/api/categories").status_code == 200

    def test_response_has_required_keys(self, client):
        data = client.get("/api/categories").json()
        assert set(data.keys()) == {"byType", "byNeighborhood", "bySource"}

    def test_by_type_items_have_name_and_count(self, client):
        for item in client.get("/api/categories").json()["byType"]:
            assert "name" in item and "count" in item

    def test_by_type_counts_correct(self, client):
        by_type = {
            item["name"]: item["count"]
            for item in client.get("/api/categories").json()["byType"]
        }
        assert by_type["Pothole"] == 1
        assert by_type["Graffiti"] == 1

    def test_by_neighborhood_dorchester_count(self, client):
        by_nbhd = {
            item["name"]: item["count"]
            for item in client.get("/api/categories").json()["byNeighborhood"]
        }
        assert by_nbhd["Dorchester"] == 2
        assert by_nbhd["Back Bay"] == 2
        assert by_nbhd["South End"] == 1

    def test_by_source_counts(self, client):
        by_source = {
            item["name"]: item["count"]
            for item in client.get("/api/categories").json()["bySource"]
        }
        assert by_source["Citizens Connect App"] == 2
        assert by_source["Constituent Call"] == 2

    def test_filtered_categories(self, client):
        data = client.get("/api/categories?neighborhood=Dorchester").json()
        names = [item["name"] for item in data["byNeighborhood"]]
        assert names == ["Dorchester"]

    def test_empty_categories_when_no_rows(self, client):
        data = client.get("/api/categories?neighborhood=NoWhere").json()
        assert data["byType"] == []
        assert data["byNeighborhood"] == []
        assert data["bySource"] == []
