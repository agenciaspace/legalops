import Base

# Pure access decision. Parsing statuses/dates and RLS remain host responsibilities.
def allowed(status_enabled: Bool, expiry_valid: Bool) -> Bool:
  match status_enabled:
    case False{}:
      False{}
    case True{}:
      expiry_valid
