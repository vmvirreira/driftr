from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Country(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    country_name = db.Column(db.String(100), nullable=False, unique=True)
    mp3_link = db.Column(db.String(200), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=True)

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)

# To create tables, use:
# db.create_all()
