from flask import abort, g
from models import Country, Category
from supabase_catalog import rows, write, CatalogUnavailable

COUNTRIES = 'driftr_country_audio'
CATEGORIES = 'driftr_categories'


def get_country(country_name):
    result = rows(COUNTRIES, {'select': '*', 'country_name': 'eq.' + country_name, 'limit': '1'})
    if result is None:
        return Country.query.filter_by(country_name=country_name).first()
    return result[0] if result else None


def get_all_countries():
    result = rows(COUNTRIES)
    g.catalog_persistent = result is not None
    return Country.query.all() if result is None else result


def validate_country(country_name, mp3_link):
    from urllib.parse import urlsplit
    country_name, mp3_link = country_name.strip(), mp3_link.strip()
    parsed = urlsplit(mp3_link)
    if not country_name or len(country_name) > 100 or parsed.scheme != 'https' or not parsed.netloc:
        abort(400, 'Enter a country name and a valid HTTPS audio URL.')
    return {'country_name': country_name, 'mp3_link': mp3_link}


def add_country(country_name, mp3_link):
    write(COUNTRIES, 'POST', validate_country(country_name, mp3_link))


def update_country(id, country_name, mp3_link):
    write(COUNTRIES, 'PATCH', validate_country(country_name, mp3_link), id)


def delete_country(id):
    write(COUNTRIES, 'DELETE', row_id=id)


def get_all_categories():
    result = rows(CATEGORIES)
    g.catalog_persistent = result is not None
    return Category.query.all() if result is None else result


def category_values(name):
    name = name.strip()
    if not name or len(name) > 100:
        abort(400, 'Enter a category name between 1 and 100 characters.')
    return {'name': name}


def add_category(name):
    write(CATEGORIES, 'POST', category_values(name))


def update_category(id, name):
    write(CATEGORIES, 'PATCH', category_values(name), id)


def delete_category(id):
    write(CATEGORIES, 'DELETE', row_id=id)
