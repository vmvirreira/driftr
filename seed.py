from models import db, Country, Category
from app import app

def seed_db():
    with app.app_context():
        db.create_all()
        countries = [
            ('United States', 'https://example.com/us.mp3'),
            ('Canada', 'https://example.com/canada.mp3'),
            # Add more countries...
        ]
        for country, mp3_link in countries:
            db.session.add(Country(country_name=country, mp3_link=mp3_link))
        db.session.commit()

if __name__ == '__main__':
    seed_db()
