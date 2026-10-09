"""Use Dayboard's Supabase identity and server-controlled admin group."""
import hashlib
import hmac
import json
import secrets
import urllib.error
import urllib.request
from flask import g, request

SUPABASE_URL = 'https://tfxgzairleefuhstleeo.supabase.co'
# This publishable key is the same public client key used by Dayboard.
SUPABASE_KEY = 'sb_publishable_ToVy_fBE3vcmF6Q_mM98Ew_Jnc1tP0d'
COOKIE_NAME = 'driftr_admin'


def verify_admin(token):
    if not token or len(token) > 8192:
        return None
    req = urllib.request.Request(SUPABASE_URL + '/auth/v1/user', headers={
        'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + token,
    })
    try:
        with urllib.request.urlopen(req, timeout=8) as response:
            user = json.load(response)
    except (urllib.error.URLError, ValueError, TimeoutError):
        return None
    groups = user.get('app_metadata', {}).get('dayboard_groups', [])
    return user if isinstance(groups, list) and 'admin' in groups else None


def load_admin():
    token = request.cookies.get(COOKIE_NAME)
    g.admin_user = verify_admin(token)
    g.admin_token = token if g.admin_user else None


def csrf_token():
    if not getattr(g, 'admin_token', None):
        return ''
    return hmac.new(g.admin_token.encode(), b'driftr-management-csrf', hashlib.sha256).hexdigest()


def valid_csrf():
    return bool(csrf_token()) and secrets.compare_digest(request.form.get('csrf_token', ''), csrf_token())
