import Base
import ./LAWS.bend as Laws

def Laws.disabled_denied(expiry_valid):
  {==}

def Laws.expired_denied(status_enabled):
  match status_enabled:
    case False{}:
      {==}
    case True{}:
      {==}

def Laws.enabled_valid_allowed():
  {==}
