from flask import Flask, jsonify
from marshmallow import ValidationError
from werkzeug.exceptions import HTTPException

from app.core.exceptions import ApiError


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(ValidationError)
    def handle_validation_error(error: ValidationError):
        return jsonify({"message": "Request validation failed.", "errors": error.messages}), 400

    @app.errorhandler(ApiError)
    def handle_api_error(error: ApiError):
        return jsonify({"message": error.message}), error.status_code

    @app.errorhandler(HTTPException)
    def handle_http_error(error: HTTPException):
        return jsonify({"message": error.description, "error": error.name}), error.code

    @app.errorhandler(Exception)
    def handle_unexpected_error(error: Exception):
        app.logger.exception("Unhandled request error", exc_info=error)
        return jsonify({"message": "An unexpected server error occurred."}), 500