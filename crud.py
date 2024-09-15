from models import db, Country, Category

# Country CRUD functions
def get_country(country_name):
    return Country.query.filter_by(country_name=country_name).first()

def get_all_countries():
    return Country.query.all()

def add_country(country_name, mp3_link):
    new_country = Country(country_name=country_name, mp3_link=mp3_link)
    db.session.add(new_country)
    db.session.commit()

def update_country(id, country_name, mp3_link):
    country = Country.query.get(id)
    if country:
        country.country_name = country_name
        country.mp3_link = mp3_link
        db.session.commit()

def delete_country(id):
    country = Country.query.get(id)
    if country:
        db.session.delete(country)
        db.session.commit()

# Category CRUD functions
def get_all_categories():
    return Category.query.all()

def add_category(category_name):
    new_category = Category(name=category_name)
    db.session.add(new_category)
    db.session.commit()

def update_category(id, category_name):
    category = Category.query.get(id)
    if category:
        category.name = category_name
        db.session.commit()

def delete_category(id):
    category = Category.query.get(id)
    if category:
        db.session.delete(category)
        db.session.commit()
