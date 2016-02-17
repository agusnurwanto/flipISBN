var apiUrl = "//isbntool-agusnurwanto.rhcloud.com/ajaxFlipLink.php";

chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
	console.log("request", request);
	sendResponse({});
    if (request.task=='getDataLink') {
		getList(0, function(res){
			var data = { 
				message:{
					type: "dataLink",
					content: res
				}
			}
			chrome.runtime.sendMessage(data, function(response) {
			  	// console.log(response);
			});
		});
    }
});

var get = queryString();
if(get["removeBook"]){
	var options = {
		id: get["removeBook"],
		isbnRemove: get["isbnRemove"]
	};
	remBookbyte(options);
}

var theForm = document.forms['aspnetForm'];
if (!theForm) {
    theForm = document.aspnetForm;
}

function __doPostBack(eventTarget, eventArgument) {
    if (!theForm.onsubmit || (theForm.onsubmit() != false)) {
        theForm.__EVENTTARGET.value = eventTarget;
        theForm.__EVENTARGUMENT.value = eventArgument;
        theForm.submit();
    }
}

// remove book from buyback2.aspx
function remBookbyte(options){
	jQuery(document).ready(function($){
		var id = options["id"];
		$('#aspnetForm').attr("action", "buyback2.aspx?isbnRemove="+options["isbnRemove"]);
		var link = $("table.gvItemsBuyback>tbody>tr>td>table").eq(id).find(".buybackRemoveWrapper a").attr("href");
		console.log(link);
		if(link){
			setTimeout(function(){
				eval(link);
			}, 1000);
		}
	});
}

// http://stackoverflow.com/questions/979975/how-to-get-the-value-from-the-url-parameter
function queryString(){
  	var query_string = {};
  	var query = window.location.search.substring(1);
  	var vars = query.split("&");
  	for (var i=0;i<vars.length;i++) {
    	var pair = vars[i].split("=");
    	if (typeof query_string[pair[0]] === "undefined") {
      		query_string[pair[0]] = decodeURIComponent(pair[1]);
    	} else if (typeof query_string[pair[0]] === "string") {
	      	var arr = [ query_string[pair[0]],decodeURIComponent(pair[1]) ];
	      	query_string[pair[0]] = arr;
    	} else {
	      	query_string[pair[0]].push(decodeURIComponent(pair[1]));
	    }
  	} 
    return query_string;
};

function getList(i, cb){
	jQuery(document).ready(function($){
		var list = $('.new-table-row');
		if(i==10)
			return;
		if(!list){
			return setTimeout(function(){
				getList(i++, cb);
			}, 1000);
		}
		var promisses = [];
		var j = 0;
		list.each(function(i, b){ 
			var href = $(b).find('.small-4.text-center a').attr('href');
			if(href && href.indexOf('.php') == "-1"){
				promisses[j] = new Promise(function(resolve, reject){
					var buyPrice = $(b).find('.small-4.text-center span').text();
					var urlBook = decodeURIComponent($(b).find('.small-4.text-center a').attr('data-url'));
					var isbn = $(b).find('.small-4').eq(2).find('a').attr("data-isbn");
					var bookbyteLink = "https://www.bookbyte.com/buyback2.aspx?isbns="+isbn;
					// send data to could server
					$.ajax({
		                url : apiUrl+"?saveFlippiness=true",
		                type: "POST",
		                data: serialize(data),
		                dataType: "JSON",
		                success: function(keys){
		                	console.log("success send ajax to "+apiUrl);
		                },
		                error: function (jqXHR, textStatus, errorThrown){
		                    alert('Error adding / update data');
		                }
		            });
					var data = {
						isbn : isbn,
						flipPrice : buyPrice,
						link : urlBook,
						bookbyteLink : bookbyteLink,
						status : "new_scrape",
						price : "-",
						bookbytePrice : "-",
						seller : "-"
					};
					resolve(data);
				})
				.catch(function(err){
					console.log(err);
				})
				j++;
			}
		});

		// save data
		Promise.all(promisses)
			.then(function(allData){
				cb(allData);
			})
			.catch(function(err){
				console.log(err);
			})
	});
}

// change object to string url
function serialize(obj){
	var str = "";
	for (var key in obj) {
	    if (str != "") {
	        str += "&";
	    }
	    str += key + "=" + encodeURIComponent(obj[key]);
	}
	return str;
}

function cs_getPage(arg){
	var ids = arg.ids;
    var isbn_number = ids["isbn"].toString().match(/\d/g);
  	isbn_number = isbn_number.join("");
  	isbn_number = changeFormat(isbn_number);
  	var cekEmpty = arg.cekEmpty;
  	var cekSucces = arg.cekSucces;
  	var ret = {
  		cekSucces: false,
  		cekEmpty: false,
  		success: 0
  	};
  	return new Promise(function(resolve, reject){
	    var action_type = $("input[name='scrape-type']:checked").val();
	    $.ajax({
	      	url : url = "https://bookscouter.com/prices.php?isbn="+isbn_number,
	      	type: "GET",
	      	success: function(res){
        		var html = $.parseHTML(res
	                .replace(/<img[^>]*>/g,"")
	                .replace(/<link[^>]*>/g,"")
	                .replace(/<script[^>]*>/g,""));
	    		var text = $("#offer2 div.book-price-normal", html).text();
	    		if(text){
		        	try{
		        		priceBookbyte = text.trim().split("$")[1];
			            var real_price = $("table.gvItemsBuyback table", html).eq(0)
			              .find("td div span").text()
			              .split("$")[1];
			          	var id = $("#lastID").val();
			          	var options = {
				            id: (+id)+1,
				            isbn_number: isbn_number,
				            custom_price: ids["buy"] || 0,
				            real_price: real_price
			          	}
			            cekSucces += "<br>"+isbn_number+" is available. Sell Price: $"+real_price;
			            ret.cekSucces = cekSucces;
			            ret.options = options;
			            ret.success = 1;
			            return resolve(ret);
		        	}catch(err){
		              	cekEmpty += "<br>"+err;
		              	ret.cekEmpty = cekEmpty;
		              	return resolve(ret);
		        	}
	    		}
    			var uri = res.split("AjaxRetrieve('")[2].split("',")[0];
    			var data = {
    				url: "https://bookscouter.com"+uri+"&ts="+ new Date().getTime()
    			}
    			$.ajax({
			      	url : data.url,
			      	type: "GET",
			      	success: function(res){
		        		var html = res
			                .replace(/<img[^>]*>/g,"")
			                .replace(/<link[^>]*>/g,"")
			                .replace(/<script[^>]*>/g,"");
	    				var text = $("#offer2 div.book-price-normal", "<div>"+html+"</div>").text();
			        	//console.log(text, html)
			        	try{
			        		var real_price = text.trim().split("$")[1];
				          	var id = $("#lastID").val();
				          	var options = {
					            id: (+id)+1,
					            isbn_number: isbn_number,
					            custom_price: ids["buy"] || 0,
					            real_price: real_price
				          	}
				            cekSucces += "<br>"+isbn_number+" is available. Sell Price: $"+real_price
				            ret.cekSucces = cekSucces;
				            ret.options = options;
				            ret.success = 1;
				            return resolve(ret);
			        	}catch(err){
			              	cekEmpty += "<br>"+err;
			              	ret.cekEmpty = cekEmpty;
			              	return resolve(ret);
			        	}
	    			},
				  	error: function (jqXHR, textStatus, errorThrown){
				  		console.log("errorThrown", errorThrown);
			          	cekEmpty += "<br>"+'Error adding / update data';
		              	ret.cekEmpty = cekEmpty;
		              	return resolve(ret);
				  	}
	    		});
		  	},
		  	error: function (jqXHR, textStatus, errorThrown){
		  		console.log("errorThrown", errorThrown);
	          	cekEmpty += "<br>"+'Error adding / update data';
              	ret.cekEmpty = cekEmpty;
              	return resolve(ret);
		  	}
	    });
	})
  	.catch(function(err){
	    console.log(err.stack);
		ret.cekEmpty = cekEmpty + err.stack;
	    return Promise.resolve(ret);
  	});
}


function changeFormat(id){
  	if(id.length<10){
    	id = "0"+id;
    	return changeFormat(id);
  	}else{
    	return id;
  	}
}

window.addEventListener("message", function(event) {
  	// We only accept messages from ourselves
  	if (event.source != window)
    	return;

  	if (event.data.arg) {
	    cs_getPage(event.data.arg)
	    .then(function(res){
	    	console.log("res", res);
    		window.postMessage({ nav: "afterScrape", res: res }, "*");
    	});
  	}
}, false);