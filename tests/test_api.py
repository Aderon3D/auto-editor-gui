import pytest
from fastapi.testclient import TestClient
from auto_editor.api import app

client = TestClient(app)

def test_get_job_status_not_found():
    response = client.get("/jobs/nonexistent-id")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_get_job_status_success():
    # Create a job first
    job_data = {"input_file": "test.mp4", "options": {"silent_threshold": 0.03}}
    create_response = client.post("/jobs", json=job_data)
    assert create_response.status_code == 201
    
    job_id = create_response.json()["job_id"]
    
    # Get the job status
    response = client.get(f"/jobs/{job_id}")
    assert response.status_code == 200
    assert "status" in response.json()