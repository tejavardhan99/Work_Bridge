import re
from datetime import datetime, timezone

import jwt
from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from rest_framework.exceptions import AuthenticationFailed, ValidationError

from apps.accounts.documents import User
from apps.common.documents import utcnow
from apps.common.firebase_config import create_data, get_document, query_collection, set_document
from apps.employers.documents import EmployerProfile
from apps.workers.documents import WorkerProfile


def hash_password(raw_password):
    return make_password(raw_password)


def verify_password(raw_password, password_hash):
    return check_password(raw_password, password_hash)


def create_tokens(user):
    now = datetime.now(timezone.utc)
    base = {"sub": str(user.id), "role": user.role, "iat": now}
    access = jwt.encode({**base, "type": "access", "exp": now + settings.JWT_ACCESS_TOKEN_LIFETIME}, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    refresh = jwt.encode({**base, "type": "refresh", "exp": now + settings.JWT_REFRESH_TOKEN_LIFETIME}, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return {"access": access, "refresh": refresh}


def _normalize_identifier(value):
    return value.strip().lower() if isinstance(value, str) else value


def _normalize_phone_values(value):
    if not isinstance(value, str):
        return [value]
    digits = re.sub(r"\D", "", value)
    if not digits:
        return [value.strip()]

    variants = []
    if len(digits) == 10:
        variants.append(digits)
        variants.append(f"+91{digits}")
    elif len(digits) == 11 and digits.startswith("0"):
        normalized = digits[1:]
        variants.append(normalized)
        variants.append(f"+91{normalized}")
    elif len(digits) == 12 and digits.startswith("91"):
        variants.append(digits)
        variants.append(f"+{digits}")
    else:
        variants.append(value.strip())

    return list(dict.fromkeys(variants))


def _ensure_unique_contact(phone=None, email=None):
    phone = _normalize_identifier(phone)
    email = _normalize_identifier(email)

    if not phone and not email:
        return

    duplicates = []
    if phone:
        for phone_variant in _normalize_phone_values(phone):
            duplicates.extend(query_collection("users", {"phone": phone_variant}))
            duplicates.extend(query_collection("workers", {"phone": phone_variant}))
            duplicates.extend(query_collection("employers", {"phone": phone_variant}))
    if email:
        duplicates.extend(query_collection("users", {"email": email}))
        duplicates.extend(query_collection("workers", {"email": email}))
        duplicates.extend(query_collection("employers", {"email": email}))

    if duplicates:
        return duplicates[0]
    return None


def _build_user_payload(name, phone, email, password, role):
    payload = {
        "name": name,
        "phone": phone or "",
        "email": email or "",
        "password_hash": hash_password(password),
        "role": role,
        "is_active": True,
        "is_blocked": False,
        "otp_hash": "",
        "otp_channel": "",
        "otp_expires_at": None,
        "created_at": utcnow().isoformat(),
        "updated_at": utcnow().isoformat(),
    }
    return payload


def _build_worker_profile_payload(user_payload):
    return {
        **user_payload,
        "user": None,
        "location": None,
        "skills": [],
        "completed_jobs_count": 0,
        "ratings": [],
        "trust_score": 20,
        "languages": [],
        "availability": True,
        "experience": "",
        "profile_image": "",
        "certificates": [],
        "skill_verification_score": 0,
        "consistency_score": 50,
        "need_work_today": False,
        "verified": False,
        "experience_level": "beginner",
    }


def _build_employer_profile_payload(user_payload):
    return {
        **user_payload,
        "user": None,
        "organization_name": "",
        "business_type": "",
        "location": None,
    }


def register_user(*, name, phone=None, email=None, password, role):
    if role not in User.ROLES:
        raise ValidationError({"role": "Invalid role."})
    if not phone and not email:
        raise ValidationError({"contact": "Phone or email is required."})

    existing = _ensure_unique_contact(phone=phone, email=email)
    if existing:
        if existing.get("phone") == _normalize_identifier(phone):
            raise ValidationError({"phone": "Phone already registered."})
        if existing.get("email") == _normalize_identifier(email):
            raise ValidationError({"email": "Email already registered."})

    payload = _build_user_payload(name, phone, email, password, role)
    user_ref = create_data("users", payload)
    user_id = user_ref.key
    set_document("users", user_id, {**payload, "id": user_id})
    return User.from_dict(payload, id=user_id)


def _resolve_user_record(identifier, role=None):
    identifier = _normalize_identifier(identifier)
    print("Resolving login identifier:", identifier, "role:", role)

    # Try resolving from 'users' collection first so login returns a User model and User ID.
    for field in ("phone", "email"):
        if field == "phone":
            variants = _normalize_phone_values(identifier)
        else:
            variants = [identifier]

        print("Searching users collection by", field, "variants:", variants)
        for variant in variants:
            matches = query_collection("users", {field: variant})
            print("Query users", field, variant, "->", len(matches), "match(es)")
            if matches:
                for doc in matches:
                    print("Found user doc:", {"id": doc.get("id"), "role": doc.get("role"), "phone": doc.get("phone"), "email": doc.get("email")})
                    if not role or doc.get("role") == role:
                        return User.from_dict(doc, id=doc["id"])
                    
    # Fallback to workers/employers collections for backward compatibility
    collection_order = []
    if role == User.ROLE_WORKER:
        collection_order = ["workers"]
    elif role == User.ROLE_EMPLOYER:
        collection_order = ["employers"]
    else:
        collection_order = ["workers", "employers"]

    for collection in collection_order:
        for field in ("phone", "email"):
            if field == "phone":
                variants = _normalize_phone_values(identifier)
            else:
                variants = [identifier]

            print(f"Searching {collection} collection by {field} variants: {variants}")
            for variant in variants:
                matches = query_collection(collection, {field: variant})
                print(f"Query {collection}", field, variant, "->", len(matches), "match(es)")
                if matches:
                    doc = matches[0]
                    print("Found fallback doc:", {"id": doc.get("id"), "role": doc.get("role"), "phone": doc.get("phone"), "email": doc.get("email")})
                    if collection == "workers":
                        return WorkerProfile.from_dict(doc, id=doc["id"])
                    if collection == "employers":
                        return EmployerProfile.from_dict(doc, id=doc["id"])
    return None


def authenticate_user(*, identifier, password, role=None):
    user = _resolve_user_record(identifier, role=role)
    print("Admin user found:", user)
    print("User role:", user.role if user else None)

    if not user:
        reason = "Admin account not found"
        print("Password valid:", False)
        print("Failure reason:", reason)
        raise AuthenticationFailed(reason)

    password_valid = verify_password(password, user.password_hash)
    print("Password valid:", password_valid)

    if not password_valid:
        reason = "Invalid password"
        print("Failure reason:", reason)
        raise AuthenticationFailed(reason)

    if role and user.role != role:
        reason = "User is not admin"
        print("Failure reason:", reason)
        raise AuthenticationFailed(reason)

    if user.is_blocked or not user.is_active:
        reason = "Account disabled"
        print("Failure reason:", reason)
        raise AuthenticationFailed(reason)

    return user


def _resolve_user_by_id(user_id):
    # Try finding in users first to ensure we resolve to a User instance
    raw = get_document("users", user_id)
    if raw:
        raw["id"] = user_id
        return User.from_dict(raw, id=user_id)
        
    # Fallback to workers/employers for backward compatibility
    for collection in ("workers", "employers"):
        raw = get_document(collection, user_id)
        if raw:
            raw["id"] = user_id
            if collection == "workers":
                return WorkerProfile.from_dict(raw, id=user_id)
            if collection == "employers":
                return EmployerProfile.from_dict(raw, id=user_id)
    return None


def refresh_access_token(refresh_token):
    try:
        payload = jwt.decode(refresh_token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except jwt.InvalidTokenError as exc:
        raise AuthenticationFailed("Invalid refresh token.") from exc
    if payload.get("type") != "refresh":
        raise AuthenticationFailed("Refresh token required.")
    user = _resolve_user_by_id(payload.get("sub"))
    if not user or user.is_blocked:
        raise AuthenticationFailed("User is inactive or blocked.")
    return create_tokens(user)
