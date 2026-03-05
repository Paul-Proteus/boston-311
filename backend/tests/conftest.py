"""Shared fixtures for backend tests."""

from unittest.mock import patch

import numpy as np
import pandas as pd
import pytest
from fastapi.testclient import TestClient

# ---------------------------------------------------------------------------
# A small, self-contained dataset that covers every code path in the API.
# Deliberately kept tiny so tests run instantly without the real 37 MB CSV.
# ---------------------------------------------------------------------------

SAMPLE_DF = pd.DataFrame(
    {
        "_id": [1, 2, 3, 4, 5],
        "case_enquiry_id": [101, 102, 103, 104, 105],
        "open_dt": pd.to_datetime(
            ["2026-01-01", "2026-01-02", "2026-01-03", "2026-01-04", None]
        ),
        "closed_dt": pd.to_datetime(
            ["2026-01-05", "2026-01-06", None, "2026-01-08", None]
        ),
        "case_status": ["Closed", "Closed", "Open", "Closed", "Open"],
        "on_time": ["ONTIME", "OVERDUE", "ONTIME", "ONTIME", None],
        "case_title": ["Pothole Repair", "Graffiti", "Noise", "Trash", "Light Out"],
        "type": ["Pothole", "Graffiti", "Noise Complaint", "Trash", "Street Light"],
        "reason": ["Streets", "Sanitation", "Enforcement", "Sanitation", "Streets"],
        "department": ["PWD", "ISD", "BPD", "PWD", "PWD"],
        "neighborhood": [
            "Dorchester",
            "Back Bay",
            "Dorchester",
            "South End",
            "Back Bay",
        ],
        "source": [
            "Citizens Connect App",
            "Constituent Call",
            "Citizens Connect App",
            "Self Service",
            "Constituent Call",
        ],
        "location": [
            "123 Main St",
            "456 Elm St",
            "789 Oak Ave",
            "321 Pine Rd",
            "654 Maple Dr",
        ],
        "latitude": [42.3601, 42.3505, 42.3601, 42.3450, np.nan],
        "longitude": [-71.0589, -71.0710, -71.0589, -71.0623, np.nan],
    }
)


@pytest.fixture()
def sample_df():
    """Return a fresh copy of the sample DataFrame."""
    return SAMPLE_DF.copy()


@pytest.fixture()
def client():
    """
    Return a TestClient wired to the FastAPI app with get_dataframe patched
    so tests never touch the real 37 MB CSV on disk.
    """
    with (
        patch("backend.data.get_dataframe", return_value=SAMPLE_DF),
        patch("backend.routers.requests.get_dataframe", return_value=SAMPLE_DF),
    ):
        from backend.main import app

        with TestClient(app) as c:
            yield c
