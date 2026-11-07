from pathlib import Path
from uuid import uuid4

from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "csv", "pdf"}


def save_upload(file: FileStorage, directory: str | Path) -> str:
    filename = secure_filename(file.filename or "")
    extension = filename.rpartition(".")[2].lower()
    if not filename or extension not in ALLOWED_EXTENSIONS:
        raise ValueError("This file type is not allowed.")
    target_directory = Path(directory).resolve()
    target_directory.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid4().hex}.{extension}"
    target = (target_directory / stored_name).resolve()
    if target.parent != target_directory:
        raise ValueError("Invalid upload path.")
    file.save(target)
    return stored_name