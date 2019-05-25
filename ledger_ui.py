#!/usr/bin/python3

from flask import Flask, render_template, request
import ledger_db
import json


master = Flask(__name__)

@master.route('/')
def index():
	return render_template('index.html')

@master.route('/getYear', methods=['POST'])
def get_year():
	year = request.get_json(force=True).get('year')
	return json.dumps(master.db.get_year_cats(year))

@master.route('/getCategories')
def get_categories():
	cats = master.db.get_categories()
	c_dict = {}
	for cat in cats:
		c_dict[cat[0]] =cat[1]
	return json.dumps(c_dict)

@master.route('/delCategory', methods=['POST'])
def del_category():
	data = request.get_json(force=True)
	master.db.delete_category(data.get('toDel'))
	return 'ok'

@master.route('/createCategory', methods=['POST'])
def create_category():
	data = request.get_json(force=True)
	master.db.create_category(data.get('name'))
	return 'ok'

@master.route('/renameCategory', methods=['POST'])
def rename_category():
	data = request.get_json(force=True)
	master.db.rename_category(data.get('id'), data.get('name'))
	return 'ok'

@master.route('/getPlaces')
def get_places():
	places = master.db.get_places()
	p_dict = {}
	for place in places:
		p_dict[place[0]] = place[1:]

	return json.dumps(p_dict)

@master.route('/delPlace', methods=['POST'])
def del_place():
	data = request.get_json(force=True)
	master.db.delete_place(data.get('toDel'))
	return 'ok'

@master.route('/createPlace', methods=['POST'])
def create_place():
	data = request.get_json(force=True)
	param = (data.get('name'), data.get('pattern'), data.get('category'))
	master.db.create_place(param)
	return 'ok'

@master.route('/editPlace', methods=['POST'])
def edit_place():
	data = request.get_json(force=True)
	param = (data.get('name'), data.get('pattern'), data.get('category'))
	master.db.edit_place(data.get('id'), param)
	return 'ok'

@master.route('/getRecords', methods=['POST'])
def get_records():
	period = request.get_json(force=True)['period']
	year, month = period.split('-')
	records = master.db.get_records(year, month)
	r_dict = {}
	for record in records:
		r_dict[record[0]] = [
			record[1].strftime("%Y-%m-%d"),
			record[2].capitalize(),
			record[3],
			str(record[4]),
			record[5],
			record[6],
			record[7]
		]

	return json.dumps(r_dict)

@master.route('/createRecord', methods=['POST'])
def create_record():
	data = request.get_json(force=True)
	param = (
		data.get('date'),
		"Altro",
		data.get('descr'),
		data.get('amount'),
		data.get('notes'),
		data.get('cat'),
		data.get('place'),
		)
	master.db.create_record(param)
	return 'ok'

@master.route('/editRecord', methods=['POST'])
def edit_record():
	data = request.get_json(force=True)
	param = (
		data.get('date'),
		data.get('descr'),
		data.get('amount'),
		data.get('notes'),
		data.get('cat'),
		data.get('place'),
		)
	master.db.edit_record(data.get('id'), param)
	return 'ok'

@master.route('/delRec', methods=['POST'])
def del_rec():
	data = request.get_json(force=True)
	master.db.delete_record(data.get('toDel'))
	return 'ok'

@master.route('/upload', methods = ['POST'])
def upload_file():
	print(request.files)
	f = request.files['file']
	dest = './records/'+f.filename
	f.save(dest)
	master.db.insert_from_file(dest)
	return 'ok'

if __name__ == '__main__':
	master.db = ledger_db.Ledger()
	master.run('0.0.0.0', 4242)
