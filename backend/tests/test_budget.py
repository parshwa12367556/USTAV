def test_budget_categories_and_expenses_are_event_scoped(client, auth_headers):
    event = client.post(
        "/api/v1/events",
        json={
            "name": "Budget Wedding",
            "type": "Wedding",
            "date": "2027-10-10",
            "budget": 100000,
        },
        headers=auth_headers,
    ).json

    category = client.post(
        f"/api/v1/budget/events/{event['id']}/budget/categories",
        json={"name": "Venue", "allocated": 50000, "color": "rose"},
        headers=auth_headers,
    )
    assert category.status_code == 201

    expense = client.post(
        f"/api/v1/budget/events/{event['id']}/expenses",
        json={
            "categoryId": category.json["id"],
            "description": "Venue deposit",
            "amount": 12500,
            "date": "2027-04-01",
            "paid": True,
        },
        headers=auth_headers,
    )
    assert expense.status_code == 201

    budget = client.get(
        f"/api/v1/budget/events/{event['id']}/budget",
        headers=auth_headers,
    )
    assert budget.status_code == 200
    assert budget.json["budget"] == 100000
    assert budget.json["spent"] == 12500
    assert budget.json["categories"][0]["spent"] == 12500
