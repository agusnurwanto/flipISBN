chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
    console.log("received message REQUEST TYPE:"+request.message.type+" messagecontent:"+request.message.content);
    if (request.message.type=='dataLink') {
	    var res = request.message.content;
	    generateTable(res);
		var options = {
			key: "dataBook",
			value: res
		};
		saveData(options);
    }
	sendResponse({})
})

// setting value on setting tab
settingTab();

// setting value data book
settingDataBook(0);

$('#save-setting').on("click", function(e){
	saveSetting(e);
});

$('#reset-setting').on("click", function(e){
	resetSetting(e);
});

function settingDataBook(i){
	var data = getData({ key: "dataBook" });
	if(!data){
		sendDataLink();
		console.log(i);
		if(i>=5)
			return alert("Please go to https://flippiness.com/dashboard.php and reopen the popup extension!"); setTimeout(function(){
			i+=1;
			settingDataBook(i);
		}, 1000);
	}else{
		generateTable(JSON.parse(data));
	}
}

function generateTable(data){
	var trBody = "";
    if(data){
    	for(var i in data){
    		trBody += '<tr id="tr'+i+'">'
    			+'<td class="link">'+data[i].link+'</td>'
    			+'<td class="status">'+data[i].status+'</td>'
    			+'<td class="action">'
	    			+'<button type="button" class="btn btn-primary btn-xs" data-id="'+i+'">Check</button>'
	    			+'<button type="button" class="btn btn-danger btn-xs" data-id="'+i+'">Remove</button>'
	    		+'</td>'
    			+'</tr>';
    	}
		$('table.data-table tbody').html(trBody);
		for(var i in data){
			var tr = $('table.data-table tbody #tr'+i);
			var link = $('.link', tr).text();
			$('button.btn-primary', tr).on("click", function(){
				var options = {
					url: link,
					type: "GET"
				}
				alert(link+' send');
				ajaxSend(options)
				.then(function(res){

				})
				.catch(function(err){
					console.log(err);
				})
			});
			$('button.btn-danger', tr).on("click", function(){
				alert(link+' remove');
			});
		}
    }else{
    	trBody = '<tr><td colspan="3" class="status">Data is empty!</td></tr>';
		$('table.data-table tbody').html(trBody);
    }
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

function sendDataLink(){
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		if(tabs[0].url.indexOf("https://flippiness.com/dashboard.php") != "-1"){
			chrome.tabs.sendMessage(tabs[0].id, {task: "getDataLink"}, function(response) {
			    console.log('task sent', response); return;
			})
		}
	})
}

function settingTab(){
	var data = getSetting();
	console.log(data);
	listSite = "";
	blackList = "";
	if(data.listSite)
		listSite = data.listSite.join(", ");
	if(data.blackList)
		blackList = data.blackList.join(", ");
	$("#list-site").val(listSite);
	$("#list-seller").val(blackList);
	return;
}

function resetSetting(event){
	event.preventDefault();
	data = {
		listSite: ["ebay.com","amazon.com","chegg.com"],
		blackList: []
	};
	alert("Reset setting success!");
	return localStorage.setItem("settingOptions", JSON.stringify(data));
}

function saveSetting(event){
	event.preventDefault();
	var listSite = $("#list-site").val();
	listSite = (listSite && listSite.split(",")) || [];
	for(var i in listSite){
		listSite[i] = listSite[i].trim();
	}

	var blackList = $("#list-seller").val();
	blackList = (blackList && blackList.split(",")) || [];
	for(var i in blackList){
		blackList[i] = blackList[i].trim();
	}

	data = {
		listSite: listSite,
		blackList: blackList
	};
	alert("Save success!");
	return localStorage.setItem("settingOptions", JSON.stringify(data));
}

function getSetting(){
	var data = localStorage.getItem("settingOptions");
	if(!data){
		var listSite = $("#list-site").val();
		listSite = (listSite && listSite.split(",")) || [];
		var blackList = $("#list-seller").val();
		blackList = (blackList && blackList.split(",")) || [];
		data = {
			listSite: listSite,
			blackList: blackList
		};
	}else{
		data = JSON.parse(data);
	}
	return data;
}

function ajaxSend(options){
	return new Promise(function(resolve, reject){
		var data = {
	        url : options["url"],
	        success: function(res){
	        	console.log("success send ajax to "+options["url"]);
	        	resolve(res);
	        },
	        error: function (jqXHR, textStatus, errorThrown){
	            alert('Error adding / update data');
	        }
	    };
	    if(options["type"])
	    	data.type = options["type"].toUpperCase();
	    if(options["data"])
	    	data.data = options["data"];
	    if(options["dataType"])
	    	data.dataType = options["dataType"];
		$.ajax(data);
	})
	.catch(function(err){
		return Promise.reject(err);
	})
}