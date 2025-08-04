# Snowflake Native App Helper Functions
# This package contains utilities for working with Snowflake Native Apps and SPCS

from .connection import session
from .references import get_reference_ids, get_reference_details

__all__ = [
    'session', 
    'get_reference_ids',
    'get_reference_details'
] 