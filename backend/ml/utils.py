def normalize_text_list(value):
    if not value:
        return []
    if isinstance(value, str):
        return [value.strip().lower()]
    try:
        return [str(v).strip().lower() for v in value]
    except Exception:
        return []


def location_to_string(location):
    # location may be dict-like or a Location object
    if not location:
        return ""
    if isinstance(location, str):
        return location.strip().lower()
    # dict
    try:
        parts = []
        for key in ("address", "village", "district", "state"):
            val = location.get(key) if hasattr(location, 'get') else getattr(location, key, None)
            if val:
                parts.append(str(val).strip())
        return ", ".join(parts).lower()
    except Exception:
        try:
            return str(location).lower()
        except Exception:
            return ""
