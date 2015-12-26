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
						price : buyPrice,
						link : urlBook,
						status : "saved"
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
				var options = {
					key: "dataBook",
					value: allData
				};
				saveData(options);
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

function saveData(data){
	if(!data['key'])
		return;
	if(!data["value"])
		localStorage.removeItem(data["key"]);
	return localStorage.setItem(data["key"], JSON.stringify(data["value"]));
}

function getData(data){
	if(!data["key"])
		return;
	return localStorage.getItem(data["key"]);
}