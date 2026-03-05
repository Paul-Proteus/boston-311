"""Data loading and caching for the Boston 311 dataset."""

import functools
from pathlib import Path

import numpy as np
import pandas as pd

CSV_PATH = Path(__file__).parent.parent / "2026-311-data.csv"

COLUMNS = [
    "_id",
    "case_enquiry_id",
    "open_dt",
    "closed_dt",
    "case_status",
    "on_time",
    "case_title",
    "type",
    "reason",
    "department",
    "neighborhood",
    "source",
    "location",
    "latitude",
    "longitude",
]


@functools.lru_cache(maxsize=1)
def get_dataframe() -> pd.DataFrame:
    """Load the CSV once and cache it in memory for the lifetime of the process."""
    df = pd.read_csv(CSV_PATH, usecols=COLUMNS, low_memory=False)
    df["open_dt"] = pd.to_datetime(df["open_dt"], errors="coerce")
    df["closed_dt"] = pd.to_datetime(df["closed_dt"], errors="coerce")
    df["latitude"] = pd.to_numeric(df["latitude"], errors="coerce")
    df["longitude"] = pd.to_numeric(df["longitude"], errors="coerce")
    return df


def filter_dataframe(
    df: pd.DataFrame,
    start_date: str | None,
    end_date: str | None,
    neighborhood: str | None,
    request_type: str | None,
    status: str | None,
) -> pd.DataFrame:
    """Apply filter parameters to the dataframe and return the filtered result."""
    if start_date:
        cutoff = pd.Timestamp(start_date)
        df = df[df["open_dt"].isna() | (df["open_dt"] >= cutoff)]
    if end_date:
        cutoff = pd.Timestamp(end_date + "T23:59:59")
        df = df[df["open_dt"].isna() | (df["open_dt"] <= cutoff)]
    if neighborhood:
        df = df[df["neighborhood"] == neighborhood]
    if request_type:
        df = df[df["type"] == request_type]
    if status:
        df = df[df["case_status"] == status]
    return df


def nan_to_none(value):
    """Convert NaN/NaT scalar values to None for JSON serialisation."""
    if value is None:
        return None
    try:
        if isinstance(value, float) and np.isnan(value):
            return None
    except TypeError:
        pass
    return value
