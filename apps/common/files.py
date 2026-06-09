from pathlib import PurePosixPath
from uuid import uuid4

from django.core.files.storage import default_storage
from django.utils.text import get_valid_filename


def save_uploaded_file(uploaded_file, folder):
    original_name = get_valid_filename(uploaded_file.name)
    path = PurePosixPath(folder) / f"{uuid4().hex}_{original_name}"
    return default_storage.save(str(path), uploaded_file)
