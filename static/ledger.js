$(document).ready(function(){
	var categories;
	var places;
	var records;
	var selected_record;
	var selected_place;

	$("#selected-year").val((new Date()).getFullYear());

	update_categories(); // will also update places, records and year
	places_clear_form();
	records_clear_form();

	$('#history-ok').click(update_year);

	$('#cat-del').click(function(){
		$.ajax({ url: '/delCategory',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({id: $("#sel-cat").val()}),
			success: update_categories
		});
	});

	$('#cat-create').click(function(){
		$.ajax({ url: '/createCategory',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({name: $("#cat-new-name").val()}),
			success: update_categories
		});
	});

	$('#cat-rename').click(function(){
		$.ajax({ url: '/renameCategory',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({id: $("#sel-cat").val(), name: $("#cat-new-name").val()}),
			success: update_categories
		});
	});

	$('#places-del').click(function(){
		alert(selected_place);
		if(!selected_place) return;
		$.ajax({ url: '/delPlace',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({id: selected_place}),
			success: [update_places, places_clear_form]
		});
	});

	$('#places-clear').click(places_clear_form);

	$('#rec-period-ok').click(function() {
		selected_record = false;
		update_records();
	});

	$('#rec-upload-ok').click(function(){
		$.ajax({
			type : 'POST',
			url : '/upload',
			data: new FormData($('#rec-upload')[0]),
			processData: false,
			contentType: false,
			success: update_records
		});
	});

	$('#rec-del').click(function(){
		if(!selected_record) return;
		$.ajax({ url: '/delRec',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({
				id: selected_record
			}),
			success: [records_clear_form, update_records]
		});
	});

	$('#rec-clear').click(records_clear_form);

	function edit_place() {
		$.ajax({ url: '/editPlace',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({
				id: selected_place,
				name: $("#new-place-name").val(),
				category: $('#set-place-cat').val(),
				pattern: $('#new-place-pattern').val()
			}),
			success: update_places
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
			success: update_places
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
		$('#new-place').unbind("click").click(edit_place);
	}

	function places_clear_form() {
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

	function edit_record() {
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
			success: update_records
		});		
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
			success: update_records
		});		
	}

	function recordsRowSelected() {
		$('#table-records>tbody>tr').removeClass('checked-table-row');
		$(`[data-record-id=${selected_record}]`).addClass('checked-table-row');
		
		$("#rec-del").prop('disabled', false);
		$("#rec-clear").prop('disabled', false);		
	
		r = records[selected_record];
		$('#rec-date').val(r[0]);
		$('#rec-description').val(r[2]);
		$('#rec-notes').val(r[4]);
		$('#rec-cats').val(r[5]);
		$('#rec-places').val(r[6]);
		$('#rec-amount').val(r[3]);

		$('#rec-save-create').html('Modifica');
		$('#rec-save-create').unbind("click").click(edit_record);
	}

	function records_clear_form() {
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

	function update_categories() {
		$.getJSON('/getCategories', function(data){
			categories = data;

			var cat = $("#sel-cat");
			var place_select = $("#set-place-cat");
			var rec_cats = $("#rec-cats");
			cat.empty();
			place_select.empty();
			$.each(categories, function(id, name) {
				cat.append(new Option(name, id));
				place_select.append(new Option(name, id));
			});

			update_places(); // will also update records and year
		});
	}

	// cats must be up to date
	function update_places() {
		$.getJSON('/getPlaces', function(data){
			places = data;

			content = '';
			$.each(places, function(id, place) {
				content += '<tr data-place-id="'+id+'">';
				content += '<td>'+place[0]+'</td>';
				if(place[2]) {content += '<td>'+categories[place[2]]+'</td>';}
				else {content += '<td>-</td>';}
				content += '<td>'+place[1]+'</td>';
				content += '</tr>';
			});
			$('#table-places tbody').html(content);
			
			if (selected_place) { placesRowSelected();}
			$('#table-places tbody tr').unbind("click").click( function () {
				selected_place = $(this).attr('data-place-id');
				placesRowSelected();
			});

			rec_places = $("#rec-places");
			rec_places.empty();
			$.each(places, function(id, place) {
				rec_places.append(new Option(place[0], id));
			});

			update_records(); // will also update year
		});
	}

	// places and cats must be up to date
	function update_records() {
		if(!$("#rec-period").val()) {
			d = new Date();
			m = d.getMonth()+1;
			if(m<10) {m='0'+m;}		
			$("#rec-period").val(d.getFullYear()+'-'+m);
		}

		to_post = {period: $("#rec-period").val()};
		$.ajax({ url: '/getRecords',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify(to_post),
			success: function(data) {
				records = JSON.parse(data);

				content = '';
				$.each(records, function(id, record) {
					content += '<tr data-record-id="'+id+'">';
					content += '<td>'+record[0]+'</td>'; 
					content += '<td>'+record[1]+'</td>';
					if(record[6]) {content += '<td>'+places[record[6]][0]+'</td>';}
					else {content += '<td>-</td>';}
					if(record[5]) {content += '<td>'+categories[record[5]]+'</td>';}
					else {content += '<td>-</td>';}
					content += '<td>'+record[3]+'</td>';				
					content += '</tr>';
				});
				$('#table-records tbody').html(content);

				if (selected_record) {recordsRowSelected();}
				$('#table-records tbody tr').unbind("click").click( function () {
					selected_record = $(this).attr('data-record-id');
					recordsRowSelected();
				});				
			}
		});

		rec_cats = $("#rec-cats");
		rec_cats.empty();
		$.each(categories, function(id, name) {
			rec_cats.append(new Option(name, id));
		});
		rec_places = $("#rec-places");
		rec_places.empty();
		$.each(places, function(id, place) {
			rec_places.append(new Option(place[0], id));
		});

		update_year();	
	}

	function update_year() {
		to_post = {year: $("#selected-year").val()};
		$.ajax({
			type : 'POST',
			url : '/getYear',
			data: JSON.stringify(to_post),
			success: function(data) {
				year_history = JSON.parse(data);
				content = '';
				$.each(year_history, function(i, cat) {
					content += '<tr>';
					content += '<td>'+cat["cat_name"]+'</td>';
					$.each(cat["report"], function(j, mon) {
						content += '<td>'+mon+'</td>';
					});
					content += '</tr>';
				});
				$('#table-history tbody').html(content);
			}
		});	
	}

});