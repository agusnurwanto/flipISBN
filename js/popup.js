chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	chrome.tabs.sendMessage(tabs[0].id, {task: "getDataLink"}, function(response) {
	    console.log('task sent', response); return;
	})
})

chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
    console.log("received message REQUEST TYPE:"+request.message.type+" messagecontent:"+request.message.content);
    if (request.message.type=='dataLink') {
	    var trBody = "";
	    var res = request.message.content;
	    if(res){
	    	for(var i in res){
	    		trBody += '<tr id="tr'+i+'">'
	    			+'<td class="link">'+res[i].link+'</td>'
	    			+'<td class="status">'+res[i].status+'</td>'
	    			+'<td class="action">'
		    			+'<button type="button" class="btn btn-primary btn-xs" data-id="'+i+'">Check</button>'
		    			+'<button type="button" class="btn btn-danger btn-xs" data-id="'+i+'">Remove</button>'
		    		+'</td>'
	    			+'</tr>';
	    	}
    		$('table.data-table tbody').html(trBody);
    		for(var i in res){
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
	sendResponse({})
})

// setting value on setting tab
settingTab();

$('#save-setting').on("click", function(e){
	saveSetting(e);
});

$('#reset-setting').on("click", function(e){
	resetSetting(e);
});

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