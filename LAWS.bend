import Base
import ./bend/access.bend as Access

# A disabled entitlement never grants access, whatever its expiry.
law disabled_denied:
  for expiry_valid: Bool
  {Access.allowed(False{}, expiry_valid) == False{} : Bool}

# Expired or invalid dates never grant access, whatever the status.
law expired_denied:
  for status_enabled: Bool
  {Access.allowed(status_enabled, False{}) == False{} : Bool}

# Enabled, unexpired entitlements continue to grant access.
law enabled_valid_allowed:
  {Access.allowed(True{}, True{}) == True{} : Bool}
