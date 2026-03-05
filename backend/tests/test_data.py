"""Unit tests for backend/data.py helper functions."""

import math

import numpy as np
import pandas as pd
import pytest

from backend.data import filter_dataframe, nan_to_none


# ---------------------------------------------------------------------------
# nan_to_none
# ---------------------------------------------------------------------------


class TestNanToNone:
    def test_none_passthrough(self):
        assert nan_to_none(None) is None

    def test_float_nan_becomes_none(self):
        assert nan_to_none(float("nan")) is None

    def test_numpy_nan_becomes_none(self):
        assert nan_to_none(np.nan) is None

    def test_regular_float_unchanged(self):
        assert nan_to_none(3.14) == 3.14

    def test_integer_unchanged(self):
        assert nan_to_none(42) == 42

    def test_string_unchanged(self):
        assert nan_to_none("hello") == "hello"

    def test_zero_unchanged(self):
        assert nan_to_none(0) == 0

    def test_empty_string_unchanged(self):
        assert nan_to_none("") == ""


# ---------------------------------------------------------------------------
# filter_dataframe
# ---------------------------------------------------------------------------


class TestFilterDataframe:
    def test_no_filters_returns_all_rows(self, sample_df):
        result = filter_dataframe(sample_df, None, None, None, None, None)
        assert len(result) == len(sample_df)

    def test_start_date_excludes_earlier_rows(self, sample_df):
        result = filter_dataframe(sample_df, "2026-01-03", None, None, None, None)
        # Row with open_dt 2026-01-01 and 2026-01-02 should be gone;
        # the row with NaT open_dt is kept (no date to exclude).
        dated = result.dropna(subset=["open_dt"])
        assert all(dated["open_dt"] >= pd.Timestamp("2026-01-03"))

    def test_end_date_excludes_later_rows(self, sample_df):
        result = filter_dataframe(sample_df, None, "2026-01-02", None, None, None)
        dated = result.dropna(subset=["open_dt"])
        assert all(dated["open_dt"] <= pd.Timestamp("2026-01-02T23:59:59"))

    def test_start_and_end_date_range(self, sample_df):
        result = filter_dataframe(
            sample_df, "2026-01-02", "2026-01-03", None, None, None
        )
        dated = result.dropna(subset=["open_dt"])
        assert len(dated) == 2
        assert set(dated["open_dt"].dt.strftime("%Y-%m-%d")) == {"2026-01-02", "2026-01-03"}

    def test_neighborhood_filter(self, sample_df):
        result = filter_dataframe(sample_df, None, None, "Dorchester", None, None)
        assert all(result["neighborhood"] == "Dorchester")
        assert len(result) == 2

    def test_request_type_filter(self, sample_df):
        result = filter_dataframe(sample_df, None, None, None, "Pothole", None)
        assert all(result["type"] == "Pothole")
        assert len(result) == 1

    def test_status_filter_open(self, sample_df):
        result = filter_dataframe(sample_df, None, None, None, None, "Open")
        assert all(result["case_status"] == "Open")
        assert len(result) == 2

    def test_status_filter_closed(self, sample_df):
        result = filter_dataframe(sample_df, None, None, None, None, "Closed")
        assert all(result["case_status"] == "Closed")
        assert len(result) == 3

    def test_combined_filters(self, sample_df):
        result = filter_dataframe(
            sample_df, None, None, "Back Bay", None, "Closed"
        )
        assert len(result) == 1
        assert result.iloc[0]["neighborhood"] == "Back Bay"
        assert result.iloc[0]["case_status"] == "Closed"

    def test_filter_with_no_matches_returns_empty(self, sample_df):
        result = filter_dataframe(
            sample_df, None, None, "Nonexistent Neighborhood", None, None
        )
        assert len(result) == 0

    def test_nat_rows_preserved_by_date_filters(self, sample_df):
        """Rows with NaT open_dt must not be dropped by date filters."""
        result = filter_dataframe(sample_df, "2026-01-01", "2026-01-04", None, None, None)
        nat_rows = result[result["open_dt"].isna()]
        assert len(nat_rows) == 1
