from flask import Flask, render_template, request, redirect, url_for
from models import db, Country, Category
from crud import get_all_countries, add_country, update_country, delete_country, get_all_categories, add_category, update_category, delete_category
from flask import jsonify
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///countrymusic.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Home route with the globe
@app.route('/')
def index():
    return render_template('index.html')

# Manage Countries route
@app.route('/countries')
def manage_countries():
    countries = get_all_countries()
    return render_template('manage_countries.html', countries=countries)

# Add Country
@app.route('/countries/add', methods=['POST'])
def add_country_view():
    country_name = request.form['country_name']
    mp3_link = request.form['mp3_link']
    add_country(country_name, mp3_link)
    return redirect(url_for('manage_countries'))

# Update Country
@app.route('/countries/update/<int:id>', methods=['POST'])
def update_country_view(id):
    country_name = request.form['country_name']
    mp3_link = request.form['mp3_link']
    update_country(id, country_name, mp3_link)
    return redirect(url_for('manage_countries'))

# Delete Country
@app.route('/countries/delete/<int:id>', methods=['POST'])
def delete_country_view(id):
    delete_country(id)
    return redirect(url_for('manage_countries'))

# Manage Categories route
@app.route('/categories')
def manage_categories():
    categories = get_all_categories()
    return render_template('manage_categories.html', categories=categories)

# Add Category
@app.route('/categories/add', methods=['POST'])
def add_category_view():
    category_name = request.form['category_name']
    add_category(category_name)
    return redirect(url_for('manage_categories'))

# Update Category
@app.route('/categories/update/<int:id>', methods=['POST'])
def update_category_view(id):
    category_name = request.form['category_name']
    update_category(id, category_name)
    return redirect(url_for('manage_categories'))

# Delete Category
@app.route('/categories/delete/<int:id>', methods=['POST'])
def delete_category_view(id):
    delete_category(id)
    return redirect(url_for('manage_categories'))

@app.route('/api/mp3/<country>')
def get_mp3(country):
    country_data = Country.query.filter_by(country_name=country).first()
    print("clicked")
    print(country_data)
    if country_data:
        return jsonify({'mp3_link': country_data.mp3_link})
    return jsonify({'error': 'Country not found'}), 404

@app.route('/api/countries_with_mp3')
def countries_with_mp3():
    countries = Country.query.all()
    countries_with_mp3 = [country.country_name for country in countries if country.mp3_link]
    return jsonify(countries_with_mp3)

if __name__ == '__main__':
    with app.app_context():
        # Ensure the database is created if it doesn't exist
        if not os.path.exists('countrymusic.db'):
            db.create_all()
    app.run(debug=True)
