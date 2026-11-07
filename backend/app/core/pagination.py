from app.constants import MAX_PAGE_SIZE


def page_args() -> tuple[int, int]:
    from flask import request

    try:
        page = max(1, int(request.args.get("page", 1)))
        per_page = min(MAX_PAGE_SIZE, max(1, int(request.args.get("per_page", 20))))
    except ValueError as error:
        raise ValueError("page and per_page must be integers") from error
    return page, per_page