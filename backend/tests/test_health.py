def test_api_health_check_confirms_database_is_ready(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json == {"status": "ok", "database": "ok"}
