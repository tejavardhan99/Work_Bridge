# Package initializer for jobs.services
# Re-export the legacy module's functions from core to preserve imports
from .core import *  # noqa: F401,F403

# Also expose submodules (e.g., recommendation service)
from . import recommendation_service  # noqa: F401
