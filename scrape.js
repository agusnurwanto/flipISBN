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