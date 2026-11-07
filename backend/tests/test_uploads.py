from io import BytesIO


def test_authenticated_png_upload_returns_retrievable_path(client, auth_headers, app, tmp_path):
    app.config["UPLOAD_FOLDER"] = str(tmp_path)
    response = client.post(
        "/api/v1/upload/images",
        data={"file": (BytesIO(b"\x89PNG\r\n\x1a\nimage-content"), "photo.png")},
        headers=auth_headers,
        content_type="multipart/form-data",
    )
    assert response.status_code == 201
    assert response.json["path"].startswith("/api/v1/upload/images/")

    image = client.get(response.json["path"])
    assert image.status_code == 200
    assert image.data.startswith(b"\x89PNG\r\n\x1a\n")


def test_upload_rejects_mismatched_image_content(client, auth_headers):
    response = client.post(
        "/api/v1/upload/images",
        data={"file": (BytesIO(b"not an image"), "photo.png")},
        headers=auth_headers,
        content_type="multipart/form-data",
    )
    assert response.status_code == 400
