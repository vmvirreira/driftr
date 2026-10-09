"""Public catalog reads and user-authenticated writes, enforced by Supabase RLS."""
import json
import urllib.error
import urllib.parse
import urllib.request
from types import SimpleNamespace
from flask import g
from admin_auth import SUPABASE_URL, SUPABASE_KEY

class CatalogUnavailable(RuntimeError):
    pass


def request_table(table, method='GET', query=None, payload=None):
    url = SUPABASE_URL + '/rest/v1/' + table
    if query:
        url += '?' + urllib.parse.urlencode(query)
    headers = {'apikey': SUPABASE_KEY, 'Accept': 'application/json'}
    token = getattr(g, 'admin_token', None)
    if method != 'GET':
        if not token:
            raise CatalogUnavailable('Admin access is required.')
        headers['Authorization'] = 'Bearer ' + token
        headers['Prefer'] = 'return=representation'
    if payload is not None:
        headers['Content-Type'] = 'application/json'
    req = urllib.request.Request(url, data=json.dumps(payload).encode() if payload is not None else None,
                                 method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            body = response.read()
            return json.loads(body) if body else []
    except urllib.error.HTTPError as error:
        try:
            code = json.loads(error.read()).get('code')
        except (ValueError, AttributeError):
            code = None
        if error.code == 404 and code == 'PGRST205':
            return None  # Schema migration has not been installed yet.
        raise CatalogUnavailable('The music catalog is unavailable. Please try again.') from error
    except (urllib.error.URLError, TimeoutError, ValueError) as error:
        raise CatalogUnavailable('The music catalog is unavailable. Please try again.') from error


def rows(table, query=None):
    result = request_table(table, query=query or {'select': '*', 'order': 'id'})
    return None if result is None else [SimpleNamespace(**row) for row in result]


def write(table, method, payload=None, row_id=None):
    result = request_table(table, method, {'id': 'eq.' + str(row_id)} if row_id is not None else None, payload)
    if result is None:
        raise CatalogUnavailable('Run the Supabase catalog migration before editing.')
    return result
