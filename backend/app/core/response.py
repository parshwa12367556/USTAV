from typing import Any

from flask import jsonify


def json_response(data: Any, status: int = 200):
    return jsonify(data), status