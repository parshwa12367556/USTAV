from pathlib import Path

from flask import Blueprint, current_app, request, send_from_directory
from flask_jwt_extended import jwt_required
from werkzeug.datastructures import FileStorage

from app.core.exceptions import ApiError
from app.utils.file_handler import save_upload

upload_bp = Blueprint("uploads", __name__)


@upload_bp.get("/images/<filename>")
def get_uploaded_image(filename: str):
    return send_from_directory(
        Path(current_app.config["UPLOAD_FOLDER"]) / "images",
        filename,
    )


@upload_bp.post("/images")
@jwt_required()
def upload_image():
    uploaded: FileStorage | None = request.files.get("file")
    if uploaded is None or not uploaded.filename:
        raise ApiError("An image file is required.")
    extension = Path(uploaded.filename).suffix.lower()
    if extension not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise ApiError("Only JPEG, PNG, and WebP images are accepted.")
    header = uploaded.stream.read(12)
    uploaded.stream.seek(0)
    valid_image = (
        extension in {".jpg", ".jpeg"} and header.startswith(b"\xff\xd8\xff")
    ) or (
        extension == ".png" and header.startswith(b"\x89PNG\r\n\x1a\n")
    ) or (
        extension == ".webp" and header.startswith(b"RIFF") and header[8:12] == b"WEBP"
    )
    if not valid_image:
        raise ApiError("The uploaded file does not match its image type.")
    try:
        filename = save_upload(uploaded, Path(current_app.config["UPLOAD_FOLDER"]) / "images")
    except ValueError as error:
        raise ApiError(str(error)) from error
    return {"filename": filename, "path": f"/api/v1/upload/images/{filename}"}, 201
