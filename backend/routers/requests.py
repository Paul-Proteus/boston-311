"""API routes for Boston 311 service request data."""

from typing import Annotated, Any

import numpy as np
import pandas as pd
from fastapi import APIRouter, Query

from ..data import filter_dataframe, get_dataframe, nan_to_none

router = APIRouter()

# ---------------------------------------------------------------------------
# Shared filter params (injected via Annotated + Query)
# ---------------------------------------------------------------------------

StartDate = Annotated[str | None, Query(description="Filter open_dt >= YYYY-MM-DD")]
EndDate = Annotated[str | None, Query(description="Filter open_dt <= YYYY-MM-DD")]
Neighborhood = Annotated[str | None, Query(description="Exact neighborhood name")]
RequestType = Annotated[str | None, Query(alias="type", description="Exact request type")]
Status = Annotated[str | None, Query(description="Open or Closed")]


def _filtered(start_date, end_date, neighborhood, request_type, status) -> pd.DataFrame:
    return filter_dataframe(
        get_dataframe(), start_date, end_date, neighborhood, request_type, status
    )


# ---------------------------------------------------------------------------
# GET /api/meta
# ---------------------------------------------------------------------------

@router.get("/meta")
def get_meta() -> dict[str, Any]:
    """Return available filter options and the overall date range."""
    df = get_dataframe()
    min_date = df["open_dt"].min()
    max_date = df["open_dt"].max()
    return {
        "neighborhoods": sorted(df["neighborhood"].dropna().unique().tolist()),
        "types": sorted(df["type"].dropna().unique().tolist()),
        "dateRange": {
            "min": min_date.strftime("%Y-%m-%d") if pd.notna(min_date) else None,
            "max": max_date.strftime("%Y-%m-%d") if pd.notna(max_date) else None,
        },
    }


# ---------------------------------------------------------------------------
# GET /api/requests
# ---------------------------------------------------------------------------

@router.get("/requests")
def get_requests(
    start_date: StartDate = None,
    end_date: EndDate = None,
    neighborhood: Neighborhood = None,
    request_type: RequestType = None,
    status: Status = None,
) -> list[dict[str, Any]]:
    """
    Return filtered service request records.

    Each record includes all fields required by the frontend components:
    map markers, stats cards, time chart, and category charts.
    """
    df = _filtered(start_date, end_date, neighborhood, request_type, status)

    rename = {
        "_id": "id",
        "case_enquiry_id": "caseId",
        "open_dt": "openDate",
        "closed_dt": "closedDate",
        "case_status": "status",
        "on_time": "onTime",
        "case_title": "title",
        "type": "type",
        "reason": "reason",
        "department": "department",
        "neighborhood": "neighborhood",
        "source": "source",
        "location": "location",
        "latitude": "latitude",
        "longitude": "longitude",
    }

    out = df.rename(columns=rename).copy()

    # Stringify IDs so JSON doesn't render large ints as floats
    out["id"] = out["id"].astype(str)
    out["caseId"] = out["caseId"].astype(str)

    # Serialise Timestamps to ISO strings; keep None for NaT
    out["openDate"] = out["openDate"].apply(
        lambda x: x.isoformat() if pd.notna(x) else None
    )
    out["closedDate"] = out["closedDate"].apply(
        lambda x: x.isoformat() if pd.notna(x) else None
    )

    # Replace remaining NaN (floats, object columns) with None
    out = out.where(pd.notna(out), other=None)

    return out.to_dict(orient="records")


# ---------------------------------------------------------------------------
# GET /api/stats
# ---------------------------------------------------------------------------

@router.get("/stats")
def get_stats(
    start_date: StartDate = None,
    end_date: EndDate = None,
    neighborhood: Neighborhood = None,
    request_type: RequestType = None,
    status: Status = None,
) -> dict[str, Any]:
    """Return aggregate statistics for the filtered dataset."""
    df = _filtered(start_date, end_date, neighborhood, request_type, status)

    total = len(df)
    open_count = int((df["case_status"] == "Open").sum())
    closed_count = int((df["case_status"] == "Closed").sum())

    on_time_mask = df["on_time"] == "ONTIME"
    on_time_rate = float(on_time_mask.mean()) if total > 0 else 0.0

    closed = df.dropna(subset=["open_dt", "closed_dt"])
    if len(closed) > 0:
        delta_hours = (
            (closed["closed_dt"] - closed["open_dt"]).dt.total_seconds() / 3600
        )
        avg_response_hours = float(delta_hours.mean())
    else:
        avg_response_hours = 0.0

    return {
        "total": total,
        "open": open_count,
        "closed": closed_count,
        "onTimeRate": round(on_time_rate * 100, 1),
        "avgResponseTimeHours": round(avg_response_hours, 1),
    }


# ---------------------------------------------------------------------------
# GET /api/time-series
# ---------------------------------------------------------------------------

@router.get("/time-series")
def get_time_series(
    start_date: StartDate = None,
    end_date: EndDate = None,
    neighborhood: Neighborhood = None,
    request_type: RequestType = None,
    status: Status = None,
) -> list[dict[str, Any]]:
    """Return daily request counts for the filtered dataset."""
    df = _filtered(start_date, end_date, neighborhood, request_type, status)

    with_dates = df.dropna(subset=["open_dt"])
    if with_dates.empty:
        return []

    counts = (
        with_dates.groupby(with_dates["open_dt"].dt.date)
        .size()
        .reset_index(name="count")
    )
    counts.columns = ["date", "count"]
    counts["date"] = counts["date"].astype(str)
    return counts.to_dict(orient="records")


# ---------------------------------------------------------------------------
# GET /api/categories
# ---------------------------------------------------------------------------

@router.get("/categories")
def get_categories(
    start_date: StartDate = None,
    end_date: EndDate = None,
    neighborhood: Neighborhood = None,
    request_type: RequestType = None,
    status: Status = None,
) -> dict[str, Any]:
    """Return top-10 breakdowns by type, neighborhood, and source."""
    df = _filtered(start_date, end_date, neighborhood, request_type, status)

    def top10(series: pd.Series) -> list[dict]:
        counts = series.dropna().value_counts().head(10)
        return [{"name": k, "count": int(v)} for k, v in counts.items()]

    return {
        "byType": top10(df["type"]),
        "byNeighborhood": top10(df["neighborhood"]),
        "bySource": top10(df["source"]),
    }
