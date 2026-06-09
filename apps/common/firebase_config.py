import os
from copy import deepcopy
from datetime import datetime
from functools import lru_cache

import firebase_admin
from firebase_admin import credentials, db, exceptions as firebase_exceptions
from django.conf import settings
from apps.common.documents import Location


def initialize_firebase():
    service_account_file = getattr(settings, "FIREBASE_SERVICE_ACCOUNT_FILE", "")
    database_url = getattr(settings, "FIREBASE_DATABASE_URL", "")

    if not service_account_file:
        raise RuntimeError("FIREBASE_SERVICE_ACCOUNT_FILE is required in settings.")
    if not database_url:
        raise RuntimeError("FIREBASE_DATABASE_URL is required in settings.")

    if not os.path.isabs(service_account_file):
        service_account_file = os.path.join(settings.BASE_DIR, service_account_file)

    if not os.path.exists(service_account_file):
        raise RuntimeError(f"Firebase service account file not found: {service_account_file}")

    try:
        app = firebase_admin.get_app()
    except ValueError:
        cred = credentials.Certificate(service_account_file)
        app = firebase_admin.initialize_app(cred, {"databaseURL": database_url})

    return app


def get_reference(path):
    initialize_firebase()
    normalized_path = path.strip("/")
    return db.reference(normalized_path)


def get_data(path):
    reference = get_reference(path)
    data = reference.get()
    return data if data is not None else {}


def push_data(path, data):
    reference = get_reference(path)
    return reference.push(data)


def set_document(path, doc_id, data):
    reference = get_reference(f"{path.strip('/')}/{doc_id}")
    reference.set(data)
    return reference


def get_document(path, doc_id):
    reference = get_reference(f"{path.strip('/')}/{doc_id}")
    return reference.get()


def query_collection(path, filters=None):
    raw = get_data(path)
    results = []
    for key, value in raw.items():
        if not isinstance(value, dict):
            continue
        if not filters:
            results.append({"id": key, **value})
            continue

        match = True
        for field, expected in filters.items():
            if value.get(field) != expected:
                match = False
                break
        if match:
            results.append({"id": key, **value})
    return results


def create_data(path, data):
    reference = get_reference(path)
    normalized_path = path.strip("/")

    if "/" not in normalized_path:
        return reference.push(data)

    reference.set(data)
    return reference


def update_data(path, data):
    reference = get_reference(path)
    reference.update(data)
    return get_data(path)


def delete_data(path):
    reference = get_reference(path)
    reference.delete()
    return True


def ping_firebase():
    try:
        get_reference("/").get()
        return {
            "connected": True,
            "provider": "firebase_realtime_database",
        }
    except firebase_exceptions.FirebaseError as exc:
        return {
            "connected": False,
            "provider": "firebase_realtime_database",
            "error": str(exc),
        }


def get_configured_target():
    if getattr(settings, "FIREBASE_DATABASE_URL", "") and getattr(settings, "FIREBASE_SERVICE_ACCOUNT_FILE", ""):
        return "firebase_realtime_database"
    return "unconfigured"


class FirebaseModel:
    collection = None
    REFERENCE_FIELDS = {}
    EMBEDDED_FIELDS = {}
    DEFAULTS = {}

    def __init__(self, id=None, **kwargs):
        self.id = str(id) if id is not None else None

        for name, value in kwargs.items():
            setattr(self, name, value)

        for name, default in self.DEFAULTS.items():
            if not hasattr(self, name):
                setattr(self, name, self._default_value(default))

        if not hasattr(self, "created_at") and "created_at" in self.DEFAULTS:
            self.created_at = self._default_value(self.DEFAULTS["created_at"])
        if not hasattr(self, "updated_at") and "updated_at" in self.DEFAULTS:
            self.updated_at = self._default_value(self.DEFAULTS["updated_at"])

    @classmethod
    def _collection_ref(cls):
        if not cls.collection:
            raise ValueError("FirebaseModel subclass must define a collection name.")
        return get_reference(cls.collection)

    @classmethod
    def objects(cls, **kwargs):
        """Return a `FirebaseQuerySet` or a filtered queryset when kwargs provided.

        Allows calling `Model.objects(field=value)` like MongoEngine for compatibility.
        """
        qs = FirebaseQuerySet(cls)
        if kwargs:
            return qs.filter(**kwargs)
        return qs

    @classmethod
    def from_dict(cls, raw, id=None):
        if raw is None:
            return None

        kwargs = {}
        for key, value in raw.items():
            if key == "id":
                continue
            if key in cls.REFERENCE_FIELDS:
                ref_class = cls.REFERENCE_FIELDS[key]
                kwargs[key] = ref_class.objects().filter(id=value).first() if value else None
            elif key in cls.EMBEDDED_FIELDS:
                embedded_cls = cls.EMBEDDED_FIELDS[key]
                kwargs[key] = embedded_cls.from_dict(value) if value else None
            else:
                kwargs[key] = cls._deserialize_value(key, value)

        return cls(id=id, **kwargs)

    @classmethod
    def _deserialize_value(cls, key, value):
        if isinstance(value, dict):
            return value
        if isinstance(value, str) and key.endswith("_at"):
            try:
                return datetime.fromisoformat(value)
            except ValueError:
                return value
        return value

    @classmethod
    def _default_value(cls, default):
        if callable(default):
            return default()
        if isinstance(default, list):
            return list(default)
        if isinstance(default, dict):
            return dict(default)
        return deepcopy(default)

    @classmethod
    def _serialize_value(cls, value):
        if isinstance(value, FirebaseModel):
            return value.id
        if isinstance(value, Location):
            return value.to_dict()
        if isinstance(value, dict):
            return {k: cls._serialize_value(v) for k, v in value.items()}
        if isinstance(value, list):
            return [cls._serialize_value(item) for item in value]
        if isinstance(value, datetime):
            return value.isoformat()
        return value

    def to_dict(self):
        data = {}
        for key, value in self.__dict__.items():
            if key == "id":
                continue
            data[key] = self.__class__._serialize_value(value)
        return data

    def save(self):
        if not self.id:
            self.id = self._collection_ref().push().key
        self._collection_ref().child(self.id).set(self.to_dict())
        return self

    def delete(self):
        if not self.id:
            return
        self._collection_ref().child(self.id).delete()


class FirebaseQuerySet:
    def __init__(self, model, items=None):
        self.model = model
        self.items = items

    def _load_items(self):
        if self.items is None:
            raw_data = self.model._collection_ref().get() or {}
            self.items = ["dummy"]
            self.items = [
                {"id": key, **value}
                for key, value in raw_data.items()
                if isinstance(value, dict)
            ]
        return self.items

    def _normalize(self, value):
        if isinstance(value, FirebaseModel):
            return value.id
        return value

    def _get_field_value(self, item, field_path):
        keys = field_path.replace("__", ".").split(".")
        value = item
        for key in keys:
            if not isinstance(value, dict) or key not in value:
                return None
            value = value[key]
        return value

    def _matches(self, item, field_name, operator, expected):
        actual = self._get_field_value(item, field_name)
        if operator == "exact":
            return actual == expected
        if operator == "ne":
            return actual != expected
        if operator == "lt":
            return actual is not None and actual < expected
        if operator == "lte":
            return actual is not None and actual <= expected
        if operator == "gt":
            return actual is not None and actual > expected
        if operator == "gte":
            return actual is not None and actual >= expected
        if operator == "icontains":
            if isinstance(actual, str) and isinstance(expected, str):
                return expected.lower() in actual.lower()
            return False
        if operator == "iexact":
            if isinstance(actual, str) and isinstance(expected, str):
                return actual.lower() == expected.lower()
            if isinstance(actual, list):
                return any(isinstance(item, str) and item.lower() == expected.lower() for item in actual)
            return False
        if operator == "in":
            return actual in expected if isinstance(expected, (list, tuple, set)) else False
        if operator == "nin":
            return actual not in expected if isinstance(expected, (list, tuple, set)) else False
        return False

    def filter(self, **kwargs):
        items = self._load_items()
        for raw_name, raw_value in kwargs.items():
            parts = raw_name.rsplit("__", 1)
            if len(parts) == 2 and parts[1] in {"ne", "lt", "lte", "gt", "gte", "icontains", "iexact", "in", "nin"}:
                field_name, operator = parts
            else:
                field_name, operator = raw_name, "exact"

            items = [
                item
                for item in items
                if self._matches(item, field_name, operator, self._normalize(raw_value))
            ]
        return self.__class__(self.model, list(items))

    def order_by(self, field_name):
        items = self._load_items()
        reverse = field_name.startswith("-")
        key_name = field_name[1:] if reverse else field_name
        items = sorted(
            items,
            key=lambda item: self._get_field_value(item, key_name) or "",
            reverse=reverse,
        )
        return self.__class__(self.model, items)

    def first(self):
        items = self._load_items()
        if not items:
            return None
        return self.model.from_dict(items[0], id=items[0]["id"])

    def count(self):
        return len(self._load_items())

    def all(self):
        return [self.model.from_dict(item, id=item["id"]) for item in self._load_items()]

    def update(self, **kwargs):
        serialized = {
            key: self.model._serialize_value(value)
            for key, value in kwargs.items()
        }
        for item in self._load_items():
            self.model._collection_ref().child(item["id"]).update(serialized)
        return self

    def skip(self, count):
        items = self._load_items()
        return self.__class__(self.model, items[count:])

    def limit(self, count):
        items = self._load_items()
        return self.__class__(self.model, items[:count])

    def delete(self):
        for item in self._load_items():
            self.model._collection_ref().child(item["id"]).delete()
        return self

    def __iter__(self):
        return iter(self.all())

    def __len__(self):
        return self.count()
