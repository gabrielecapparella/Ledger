#!/usr/bin/python3

import re
import mysql.connector
import mysql.connector.pooling
import datetime

class Ledger:

	def __init__(self):
		with open('config.json', 'r') as cfg_file:
				self.cfg = json.loads(cfg_file.read())
		self.pool = mysql.connector.pooling.MySQLConnectionPool(
			pool_name = 'ledger_pool',
			pool_size = 5,
			pool_reset_session=True,
			**self.cfg)

		self.setup()

	def clean_up(self):
		self.cursor.close()
		self.connection.close()

	def query(self, model, data=""):
		conn = self.pool.get_connection()
		cursor = conn.cursor()
		if type(data) is list:
			cursor.executemany(model, data)
		else:
			cursor.execute(model, data)
		last = cursor.lastrowid
		cursor.close()
		conn.close()
		return last

	def select(self, model, data=""): #returns a list of tuples
		conn = self.pool.get_connection()
		cursor = conn.cursor()
		cursor.execute(model, data)
		rows = cursor.fetchall()
		cursor.close()
		conn.close()

		return rows

	def read_xls(self, file):
		with open(file, 'r') as f:
			text = f.read()

		rows = re.findall('<tr>'+
			'<td border="1">\d{2}/\d{2}/\d{4}</td>'+
			'<td border="1">(\d{2}/\d{2}/\d{4})</td>'+
			'<td border="1">(.*?)</td>'+
			'<td border="1">(.*?)</td>'+
			'<td class="excelCurrency" border="1">&euro; (.*?)</td>'+
			'</tr>', text)
		return rows # data, tipo, descr, cifra

	def insert_from_file(self, file):
		query = 'INSERT IGNORE INTO records (date,type,descr,amount,notes,id_category,id_place) VALUES (%s,%s,%s,%s,%s,%s,%s)'
		records = self.read_xls(file)
		matched = self.match_records(records)
		self.query(query, matched)

	def match_records(self, records):
		matched = []
		places = self.select('SELECT * FROM places')
		for record in records:
			record = self.format_record(record)
			for place in places:
				if re.search(place[2], record[2]):
					record = record[:5] + (place[3], place[0])
			matched += [record]
		return matched

	def get_cat_by_name(self, name):
		query = "SELECT ID FROM categories WHERE name=%s"
		r = self.select(query, (name,))
		return r[0][0]

	def get_categories(self):
		return self.select("SELECT * FROM categories")

	def delete_category(self, id_cat):
		self.query("DELETE FROM categories WHERE ID=%s", (id_cat,))

		recs = self.select("SELECT * FROM records WHERE id_category=%s", (id_cat,))
		for rec in recs:
			self.edit_rec_cat(rec[0], None)

		places = self.select("SELECT * FROM places WHERE id_category=%s", (id_cat,))
		for place in places:
			self.edit_place(place[0], (place[1], place[2], None))

	def create_category(self, name_cat):
		self.query("INSERT INTO categories (name) VALUES (%s)", (name_cat,))

	def rename_category(self, id_cat, new_name):
		self.query("UPDATE categories SET name=%s WHERE ID=%s", (new_name, id_cat))

	def get_places(self):
		return self.select("SELECT * FROM places")

	def delete_place(self, id_place):
		self.query("DELETE FROM places WHERE ID=%s", (id_place,))
		recs = self.select("SELECT * FROM records WHERE id_place=%s", (id_place,))
		for rec in recs:
			self.edit_rec_place(rec[0], None)
			self.edit_rec_cat(rec[0], None)

	def create_place(self, data): #(name, pattern, id_cat)
		p_id = self.query("INSERT INTO places (name, pattern, id_category) VALUES (%s, %s, %s)", data)
		recs = self.select("SELECT * FROM records WHERE id_place IS NULL")
		for rec in recs:
			if re.search(data[1], rec[3]):
				self.edit_rec_place(rec[0], p_id)
				if rec[6]==None: self.edit_rec_cat(rec[0], data[2])

	def edit_rec_place(self, r_id, place):
		self.query("UPDATE records SET id_place=%s WHERE ID=%s", (place, r_id))

	def edit_rec_cat(self, r_id, cat):
		self.query("UPDATE records SET id_category=%s WHERE ID=%s", (cat, r_id))

	def edit_place(self, id_place, new_data):
		params = new_data+(id_place,)
		self.query("UPDATE places SET name=%s, pattern=%s, id_category=%s WHERE ID=%s", params)
		recs = self.select("SELECT * FROM records WHERE id_place=%s OR id_place IS NULL", (id_place,))
		for rec in recs:
			if re.search(new_data[1], rec[3]):
				self.edit_rec_place(rec[0], id_place)
				#if rec[6]==None:
				self.edit_rec_cat(rec[0], new_data[2])
			elif rec[7]!=None:
				self.edit_rec_place(rec[0], None)
				self.edit_rec_cat(rec[0], None)

	def get_records(self, year, month):
		return self.select("SELECT * FROM records WHERE YEAR(date)=%s AND MONTH(date)=%s", (year, month))

	def create_record(self, data):
		query = 'INSERT IGNORE INTO records (date,type,descr,amount,notes,id_category,id_place) VALUES (%s,%s,%s,%s,%s,%s,%s)'
		self.query(query, data)

	def edit_record(self, id_rec, new_data):
		query = "UPDATE records SET date=%s, descr=%s, amount=%s, notes=%s, id_category=%s, id_place=%s WHERE ID=%s"
		params = new_data+(id_rec,)
		self.query(query, params)

	def delete_record(self, id_rec):
		self.query("DELETE FROM records WHERE ID=%s", (id_rec,))

	def get_cat_sum(self, id_cat, year):
		now = datetime.datetime.now()
		query = "SELECT sum(amount) FROM records WHERE YEAR(date)=%s AND MONTH(date)=%s AND id_category=%s"
		v = [0.0]*14
		v[0] = id_cat
		avg, months = 0.0, 12
		if str(now.year)==year: months = now.month
		for m in range(1,13):
			s = self.select(query, (year, m, id_cat))[0][0]
			if not s: s = 0.0
			v[m] = float(s)
			avg += float(s)
		v[13]= avg//months
		return v

	def get_year_cats(self, year):
		y = []
		for cat in self.get_categories():
			y.append(self.get_cat_sum(cat[0], year))
		vc = self.vec_sum(y)
		vc[0] = -1
		y.append(vc)

		return y

	def vec_sum(self, lists):
		return [round(sum(z),1) for z in zip(*lists)]

	def str2date(self, date_str):
		datetime_obj = datetime.datetime.strptime(date_str, '%d/%m/%Y')
		return datetime_obj.date()

	def format_record(self, record):
		date = self.str2date(record[0])
		amount = float(record[3].replace('.', '').replace(',', '.'))
		descr = record[2].lower()
		return (date, record[1], descr, amount, None, None, None)

	def setup(self):
		places = (
			"CREATE TABLE IF NOT EXISTS `places` ("
			"  `ID` INT NOT NULL AUTO_INCREMENT,"
			"  `name` TINYTEXT,"
			"  `pattern` TINYTEXT,"
			"  `id_category` INT REFERENCES categories(ID),"
			"  PRIMARY KEY (`ID`)"
			") ENGINE=InnoDB")

		records = (
			"CREATE TABLE IF NOT EXISTS `records` ("
			"  `ID` INT NOT NULL AUTO_INCREMENT,"
			"  `date` DATE,"
			"  `type` TINYTEXT,"
			"  `descr` TEXT,"
			"  `amount` DECIMAL(16, 2),"
			"  `notes` TEXT,"
			"  `id_category` INT REFERENCES categories(ID),"
			"  `id_place` INT REFERENCES places(ID),"
			"  UNIQUE KEY unique_record (date,type(255),descr(500),amount),"
			"  PRIMARY KEY (`ID`)"
			") ENGINE=InnoDB")

		categories = (
			"CREATE TABLE IF NOT EXISTS `categories` ("
			"  `ID` INT NOT NULL AUTO_INCREMENT,"
			"  `name` TINYTEXT,"
			"  PRIMARY KEY (`ID`)"
			") ENGINE=InnoDB")

		self.query(places)
		self.query(records)
		self.query(categories)

	def populate(self):
		cat_q = 'INSERT INTO categories (name) VALUES (%s)'
		cat_d = [('Alimentari',), ('Benzina',), ('Bollette',), ('Lavori',), ('Salute',), ('Casa',)]
		self.query(cat_q, cat_d)

		c = self.get_cat_by_name

		places_q = 'INSERT INTO places (name, pattern, id_category) VALUES (%s, %s, %s)'

		places_d = [('Lidl', 'lidl', c('Alimentari')),
			('Farmacia', 'farmacia', c('Salute')),
			('Maurys', 'maury s', c('Casa')),
			('Mutuo', 'mutuo', c('Bollette'))]

		self.query(places_q, places_d)
