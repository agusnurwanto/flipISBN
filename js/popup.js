chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
    console.log("received message REQUEST TYPE:"+request.message.type+" messagecontent:"+request.message.content);
    if (request.message.type=='dataLink') {
	    var res = request.message.content;
	   	res = validateLink(res);
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
settingDataBook();

$('#save-setting').on("click", function(e){
	saveSetting(e);
});

$('#reset-setting').on("click", function(e){
	resetSetting(e);
});

$('#refresh-data-book').on("click", function(e){
	refreshSetting(e);
});

function htmlLoading(){
	var loading = '<div id="block"></div>'
        +'<span class="glyphicon glyphicon-refresh glyphicon-refresh-animate btn-loading"></span>';
    return loading;
}

function setLoading(){
	if($('.btn-loading').length>0)
		return;
	var loading = htmlLoading();
	$("body").append(loading);
    $(".btn-loading").on("click", function(e){
    	e.preventDefault();
    })
}

function remLoading(){
	$('.btn-loading').remove();
	$('#block').remove();
}

function validateLink(data){
	var settings = getSetting();
	var newData = [];
	var k = 0;
	for(var j in data){
		var check = false;
		for(var i in settings.listSite){
			if(data[j]["link"].indexOf(settings.listSite[i]) != "-1"){
				check = true;
			}
		}
		if(check){
			newData[k] = data[j];
			k++;
		}
	}
	return newData;
}

function refreshSetting(event){
	event.preventDefault();
	sendDataLink();
	setTimeout(function(){
		settingDataBook();
	}, 1000);
}

function settingDataBook(check){
	var data = getData({ key: "dataBook" });
	if(!data){
		if(!check){
			check = 0;
			sendDataLink();
		}else{
			if(check >=5)
				return;
		}
		setTimeout(function(){
			check++;
			settingDataBook(check);
		}, 1000);
	}else{
		generateTable(JSON.parse(data));
	}
}

function generateTable(data){
	var trBody = "";
    if(data){
    	for(var i in data){
    		trBody += ''
    			+'<tr id="tr'+i+'">'
	    			+'<td class="link">'
	    				+'<span class="current-link">'+data[i].link+'</span><br>'
	    				+'<b>Bookbyte Link</b>: <span class="bookbyte-link">'+data[i].bookbyteLink+'</span>'
	    			+'</td>'
	    			+'<td class="action" colspan="2">'
	    				+'<b>ISBN 13</b>: <span class="isbn">'+data[i].isbn+'</span><br>'
	    				+'<b>Price</b>: <span class="price">'+data[i].price+'</span><br>'
	    				+'<b>Seller</b>: <span class="seller">'+data[i].seller+'</span><br>'
		    			+'<button type="button" class="btn btn-primary btn-xs" data-id="'+i+'">Check</button><br>'
		    			+'<button type="button" class="btn btn-success btn-xs" data-id="'+i+'">Save to Server</button>'
		    		+'</td>'
    			+'</tr>';
    	}
		$('table.data-table tbody').html(trBody);
		for(var i in data){
			(function(i){
				var tr = $('table.data-table tbody #tr'+i);
				var link = $('.current-link', tr).text();
				var bookbyteLink = $('.bookbyte-link', tr).text();
				var options = {
					url : link,
					bookbyteLink : bookbyteLink,
					tr: tr,
					i: i
				}
				$('button.btn-primary', tr).on("click", function(){
					setLoading();
					scrapingPrice(options);
				});
				$('button.btn-danger', tr).on("click", function(){
					alert(link+' remove');
				});
			})(i);
		}
    }else{
    	trBody = '<tr><td colspan="3" class="status">Data is empty!</td></tr>';
		$('table.data-table tbody').html(trBody);
    }
}

function scrapingPrice(data){
	var link = data["url"];
	var bookbyteLink = data["bookbyteLink"];
	var tr = data["tr"];
	var settings = getSetting();
	var i = data["i"];
	var site = link.match(/\w+\.com/g);
	var options = {
		url: link,
		type: "GET"
	}
	ajaxSend(options)
	.then(function(res){
		var price = 0;
		if(link.indexOf("ebay.com") != "-1"){
			var html = $.parseHTML(res
	  			.replace(/<img[^>]*>/g,"")
	  			.replace(/<link[^>]*>/g,"")
	  			.replace(/<script[^>]*>/g,""));
			var seller = $(".red", html).eq(0).parent().parent().next().next().next().text();
			if(settings.blackList.indexOf(seller) != "-1"){
				remLoading();
				return alert("seller: "+seller+" in blackList!");
			}
			if(settings.blackListRecycle=="1"){
				if(seller.indexOf("recycle") != "-1"){
					remLoading();
					return alert("seller: "+seller+" in blackList! contain recycle.");
				}
			}
			var prices = $(".red", html);
			var currentPrice = prices.eq(0).text().match(/\d|\./g).join("");
			var shippingPrice = prices.eq(1).text().match(/\d|\./g).join("");
			price = (+currentPrice) + (+shippingPrice);
		}else{
			remLoading();
			return alert("Code scrape for "+site+" scrape not supported! Please contact developer.");
		}
		var options = {
			url: bookbyteLink,
			type: "GET"
		}
		ajaxSend(options)
		.then(function(res){
			var html = $.parseHTML(res
	  			.replace(/<img[^>]*>/g,"")
	  			.replace(/<link[^>]*>/g,"")
	  			.replace(/<script[^>]*>/g,""));
            var err = $("#ctl00_ContentPlaceHolder1_trSpecialMessage", html).text().trim();
            if(err){
				remLoading();
				alert("("+site+") $"+price+" | seller: "+seller+" | (bookbyte.com) ERROR:"+err);
				var priceBookbyte = "ERROR:"+err;
            }else{
	            var priceBookbyte = "$" + $("table.gvItemsBuyback table", html).eq(0)
	                .find("td div span").text()
	                .split("$")[1];
				remLoading();
				var descriptionPrice = "("+site+") $"+price+" | (bookbyte.com) "+priceBookbyte;
				if(price < (+priceBookbyte)){
					alert(descriptionPrice+" | the price is lowest then bookbyte!");
				}else{
					alert(descriptionPrice+" | the price is more expensive then bookbyte!");
				}
			}
			var allPrice = "("+site+") $"+price+" | (bookbyte.com) "+priceBookbyte;
			$(".price", tr).text(allPrice);
			$(".seller", tr).text(seller);
			var options = { key: "dataBook" };
			var data = getData(options);
			data = JSON.parse(data);
			data[i]["price"] = allPrice;
			data[i]["seller"] = seller;
			options["value"] = data;
			saveData(options);
			console.log(allPrice);
		})
		.catch(function(err){
			remLoading();
			console.log(err);
		})
	})
	.catch(function(err){
		remLoading();
		console.log(err);
	})
}

function saveData(data){
	if(!data['key'])
		return;
	if(!data["value"])
		localStorage.removeItem(data["key"]);
	console.log("saveData", data);
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
			});
		}else{
			alert("Please go to https://flippiness.com/dashboard.php and reopen the popup extension!");
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
	if(data["blackListRecycle"]=="1"){
		$("#black-list-recycle").prop("checked",true);
	}else{
		$("#black-list-recycle").prop("checked",false);
	}
	return;
}

function resetSetting(event){
	event.preventDefault();
	data = {
		listSite: [
			"ebay.com", 
			"amazon.com", 
			"chegg.com"
		],
		blackList: [
			"big4northeast", 
			"textbook_rebellion", 
			"texts_direct", 
			"cashmoneytexts", 
			"juggernautz11", 
			"textbooknook", 
			"west.street.books", 
			"westbks2010", 
			"textbookcharlie77", 
			"recycleabook", 
			"recycle-a-textbook859", 
			"campus_bookstore", 
			"gus4577"
		],
		blackListRecycle: 1

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

	var blackListRecycle = 0;
	if($('#black-list-recycle').is(':checked')==true){
		blackListRecycle = 1;
	}
	var data = {
		listSite: listSite,
		blackList: blackList,
		blackListRecycle: blackListRecycle
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
			blackList: blackList,
			blackListRecycle: $("#black-list-recycle").val()
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