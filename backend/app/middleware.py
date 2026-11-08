from flask import Flask, current_app, jsonify, request
from flask_limiter.errors import RateLimitExceeded
from marshmallow import ValidationError
from sqlalchemy.exc import SQLAlchemyError
from werkzeug.exceptions import HTTPException

from app.core.exceptions import ApiError
from app.extensions import db


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(RateLimitExceeded)
    def handle_rate_limit_error(_error: RateLimitExceeded):
        try:
            from app.services.security_event_service import record_security_event

            record_security_event(
                "security.rate_limited",
                "blocked",
                metadata={"path": request.path, "method": request.method},
            )
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()
            current_app.logger.exception("Could not record rate-limit security event.")
        return jsonify({"message": "Too many requests. Please try again later."}), 429

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