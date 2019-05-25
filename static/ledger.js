$(document).ready(function(){
	var categories;
	var places;
	var selected_place;
	var records;
	var report;
	var selected_record;
	var selected_month;
	var selected_year;

	$("#his-year").val((new Date()).getFullYear());
	updateHistory();

	$.getJSON('/getCategories', function(data){
		categories = data;
		appendCategories();
		updatePlaces();
	});
	
	places_clear();
	records_clear();

	$('#history-ok').click(function() {
		selected_year = $("#his-year").val();
		updateHistory();
	});

	$('#cat-del').click(function(){
		$.ajax({ url: '/delCategory',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({toDel: $("#sel-cat").val()}),
			success: updateCategories
		});
	});

	$('#cat-create').click(function(){
		$.ajax({ url: '/createCategory',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({name: $("#cat-new-name").val()}),
			success: updateCategories
		});
	});

	$('#cat-rename').click(function(){
		$.ajax({ url: '/renameCategory',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({id: $("#sel-cat").val(), name: $("#cat-new-name").val()}),
			success: updateCategories
		});
	});
	
	$('#new-place').click(create_place);
	
	$('#rec-upload-ok').click(function(){
		$.ajax({
			type : 'POST',
			url : '/upload',
			data: new FormData($('#rec-upload')[0]),
			processData: false,
			contentType: false
		})
	});	
	
	$('#rec-period-ok').click(select_month);

	function fillHistoryTable() {
		content = '';
		$.each(report, function(x, cat) {
			content += '<tr>';
			if(cat[0]==-1) {nome='Totale';}
			else {nome=categories[cat[0]];}
			content += '<td>'+nome+'</td>';
			for (var i = 1; i < cat.length; i++) {
				content += '<td>'+cat[i]+'</td>';
			}
			content += '</tr>';
		});
		$('#table-history tbody').html(content);
	}
	 
	function updateHistory() {
		if(!selected_year) {selected_year=$("#his-year").val();}
		$.ajax({
			type : 'POST',
			url : '/getYear',
			data: JSON.stringify({year: selected_year}),
			success: function(data) {
				report = JSON.parse(data);
				fillHistoryTable();
			}
		})	
	}

	function this_month() {
		d = new Date();
		m = d.getMonth()+1;
		if(m<10) {m='0'+m;}
		return d.getFullYear()+'-'+m;
	}
	
	function select_month() {
		selected_month = $("#rec-period").val();
		selected_record = false;
		updateRecords();	
	}

	function updateRecords() {
		$.ajax({ url: '/getRecords',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({period: selected_month}),
			success: function (data) {
				records = JSON.parse(data);
				fillRecordsTable();
				if(selected_record) {recordsRowSelected();}
			}
		});	
	}
	
	function fillRecordsTable() {
		content = '';
		$.each(records, function(key, record) {
			content += '<tr data-record-id="'+key+'">';
			content += '<td>'+record[0]+'</td>'; 
			content += '<td>'+record[1]+'</td>';
			if(record[6]) {place = places[record[6]][0];}
			else {place = '-';}
			content += '<td>'+place+'</td>';
			if(record[5]) {cat = categories[record[5]];}
			else {cat = '-';}
			content += '<td>'+cat+'</td>';			
			content += '<td>'+record[3]+'</td>';
			content += '</tr>';
		});
		$('#table-records tbody').html(content);
		
		if (selected_record) { recordsRowSelected();}
		
		$('#table-records tbody tr').unbind("click").click( function () {
			selected_record = $(this).attr('data-record-id')
			recordsRowSelected()
		});
	}	
	
	function recordsRowSelected() {
		$('#table-records>tbody>tr').removeClass('checked-table-row');
		$(`[data-record-id=${selected_record}]`).addClass('checked-table-row');
		
		$("#rec-del").prop('disabled', false);
		$("#rec-clear").prop('disabled', false);		
		$('#rec-save-create').html('Modifica');
	
		r = records[selected_record];
		$('#rec-date').val(r[0]);
		$('#rec-description').val(r[2]);
		$('#rec-notes').val(r[4]);
		$('#rec-cats').val(r[5]);
		$('#rec-places').val(r[6]);
		$('#rec-amount').val(r[3]);
		
		$('#rec-del').unbind("click").click(function() {
			$.ajax({ url: '/delRec',
				type: 'POST',
				contentType: 'application/json',
				data: JSON.stringify({
					toDel: selected_record
				}),
				success: function () {
					records_clear();
					updateRecords();
				}
			});		
		});
		
		$('#rec-clear').unbind("click").click(records_clear);				
		
		$('#rec-save-create').unbind("click").click(function() { //edit
			$.ajax({ url: '/editRecord',
				type: 'POST',
				contentType: 'application/json',
				data: JSON.stringify({
					id: selected_record,
					date: $('#rec-date').val(),
					descr: $('#rec-description').val(),
					notes: $("#rec-notes").val(),
					cat: $('#rec-cats').val(),
					place: $('#rec-places').val(),
					amount: $('#rec-amount').val()
				}),
				success: function () {
					records_clear();
					updateRecords();
				}
			});		
		});
	}
	
	function records_clear() {
		$('#table-records>tbody>tr').removeClass('checked-table-row');
		$("#rec-del").prop('disabled', true);
		$("#rec-clear").prop('disabled', true);
		
		$("#recs-del").unbind("click");
		$("#rec-clear").unbind("click");

		$('#rec-save-create').html('Crea');		
		$('#rec-save-create').unbind("click").click(create_record);

		$("#rec-date").val("");
		$('#rec-description').val("");
		$('#rec-notes').val("");
		$('#rec-cats').val("");
		$('#rec-places').val("");
		$('#rec-amount').val("0");
		
		selected_record = false;
	}
	
	function create_record() {
			$.ajax({ url: '/createRecord',
				type: 'POST',
				contentType: 'application/json',
				data: JSON.stringify({
					date: $('#rec-date').val(),
					descr: $('#rec-description').val(),
					notes: $("#rec-notes").val(),
					cat: $('#rec-cats').val(),
					place: $('#rec-places').val(),
					amount: $('#rec-amount').val()
				}),
				success: updateRecords
			});		
	}
	
	function updatePlaces() {
		$.getJSON('/getPlaces', function(data){
			places = data;
			fillPlacesTable();
			
			var rec_places = $("#rec-places");
			rec_places.empty();
			$.each(places, function(id, place) {
				rec_places.append(new Option(place[0], id))
			});
			if(selected_record) {$('#rec-places').val(r[6]);}
			var rp = $("#rec-period"); 
			if(!rp.val()) {
				rp.val(this_month());
				select_month();
			} else {
				updateRecords();
			}
		});
	}

	function fillPlacesTable() {
		content = '';
		$.each(places, function(key, place) {
			content += '<tr data-place-id="'+key+'">';
			content += '<td>'+place[0]+'</td>';
			if(place[2]) {cat = categories[place[2]];}
			else {cat = '-';}
			content += '<td>'+cat+'</td>';
			content += '<td>'+place[1]+'</td>';
			content += '</tr>';
		});
		$('#table-places tbody').html(content);
		if (selected_place) { placesRowSelected();}
		
		$('#table-places tbody tr').unbind("click").click( function () {
			selected_place = $(this).attr('data-place-id')
			placesRowSelected()
		});
	}
	
	function create_place() {
		$.ajax({ url: '/createPlace',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({
				name: $("#new-place-name").val(),
				category: $('#set-place-cat').val(),
				pattern: $('#new-place-pattern').val()
			}),
			success: updatePlaces
		});
	}
	
	function placesRowSelected() {
		$('#table-places>tbody>tr').removeClass('checked-table-row');
		$(`[data-place-id=${selected_place}]`).addClass('checked-table-row');
		
		$("#places-del").prop('disabled', false);
		$("#places-clear").prop('disabled', false);
	
		p = places[selected_place];
		$('#new-place-name').val(p[0]);
		$('#set-place-cat').val(p[2]);
		$('#new-place-pattern').val(p[1]);
		
		$('#new-place').html('Modifica');
		$('#new-place').unbind("click").click(function() {
			$.ajax({ url: '/editPlace',
				type: 'POST',
				contentType: 'application/json',
				data: JSON.stringify({
					id: selected_place,
					name: $("#new-place-name").val(),
					category: $('#set-place-cat').val(),
					pattern: $('#new-place-pattern').val()
				}),
				success: updatePlaces
			});		
		});		
		
		$('#places-del').unbind("click").click(function() {
			$.ajax({ url: '/delPlace',
				type: 'POST',
				contentType: 'application/json',
				data: JSON.stringify({toDel: selected_place}),
				success: [updatePlaces, places_clear]
			});		
		});
		
		$('#places-clear').unbind("click").click(places_clear);
	}
	
	function places_clear() {
		$('#table-places>tbody>tr').removeClass('checked-table-row');
		$("#places-del").prop('disabled', true);
		$("#places-clear").prop('disabled', true);
		
		$("#places-del").unbind("click");
		$("#places-clear").unbind("click");
		
		$('#new-place').unbind("click").click(create_place);
		$('#new-place').html('Crea');
		
		$("#new-place-name").val("");
		$('#new-place-pattern').val("");
		
		selected_place = false;
	}
	
	function updateCategories() {
		$.getJSON('/getCategories', function(data){
			categories = data;
			appendCategories();
			updatePlaces();
		});
	}

	function appendCategories() {
		var cat = $("#sel-cat");
		var place_select = $("#set-place-cat");
		var rec_cats = $("#rec-cats");
		cat.empty();
		place_select.empty();
		rec_cats.empty();
		$.each(categories, function(id, name) {
			cat.append(new Option(name, id));
			place_select.append(new Option(name, id));
			rec_cats.append(new Option(name, id));
		});
	}	
	
	
});
