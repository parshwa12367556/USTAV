class ApiError(Exception):
    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class ServiceUnavailable(ApiError):
    def __init__(self, message: str) -> None:
        super().__init__(message, 503)