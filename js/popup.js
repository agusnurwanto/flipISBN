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

$('#scrape-all-data-book').on("click", function(e){
	scrapeAll(e);
});

$('#bookbyte').on("click", function(e){
	chrome.tabs.create({'url': 'https://www.bookbyte.com/buyback2.aspx' }, function(tab) {
	  // Tab opened.
	});
});

$('#newTab').on("click", function(e){
	chrome.tabs.create({ url: window.location.href });
});

function scrapeAll(event){
	event.preventDefault();
	setLoading();
	var promises = [];
	var data = $('table.data-table tbody tr');
	data.each(function(i,b){
		(function(i){
			promises[i] = new Promise(function(resolve, reject){
				var tr = $('table.data-table tbody #tr'+i);
				var link = $('.current-link', tr).text();
				var bookbyteLink = $('.bookbyte-link', tr).text();
				var options = {
					url : link,
					bookbyteLink : bookbyteLink,
					tr: tr,
					i: i,
					resolve: resolve
				}
				return scrapingPrice(options);
			})
			.catch(function(err){
				console.log(err);
				return Promise.reject();
			})
		})(i);
	});
	Promise.all(promises)
	.then(function(res){
		alert("FINISH check all data!");
	})
	.catch(function(err){
		console.log(err);
		alert("FINISH check all data! with ERROR.");
	})
}

function afterScrape(options){
	if(options && options["resolve"]){
		return options.resolve();
	}
	remLoading();
}

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
	    				+'<a href="'+data[i].link+'" target="blank" title="Open link in new tab!">'
	    					+'<span class="current-link">'+data[i].link+'</span>'
	    				+'</a><br>'
	    				+'<b>Bookbyte Link</b>: <a href="'+data[i].bookbyteLink+'" target="blank" title="Open link in new tab!">'
	    					+'<span class="bookbyte-link">'+data[i].bookbyteLink+'</span>'
	    				+'</a>'
	    			+'</td>'
	    			+'<td class="action" colspan="2">'
	    				+'<b>ISBN 13</b>: <span class="isbn">'+data[i].isbn+'</span><br>'
	    				+'<b>Price</b>: <span class="price">'+data[i].price+'</span><br>'
	    				+'<b>Bookbyte Price</b>: <span class="bookbytePrice">'+data[i].bookbytePrice+'</span><br>'
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
	var i = data["i"];
	var site = link.match(/\w+\.com/g);
	data["site"] = site;
	var dataOptions = { key: "dataBook" };
	data["dataOptions"] = dataOptions;
	var dataBook = getData(dataOptions);
	dataBook = JSON.parse(dataBook);
	data["dataBook"] = dataBook;
	var options = {
		url: link,
		type: "GET"
	}
	ajaxSend(options)
	.then(function(res){
		var price = 0;
		var html = $.parseHTML(res
  			.replace(/<img[^>]*>/g,"")
  			.replace(/<link[^>]*>/g,"")
  			.replace(/<script[^>]*>/g,""));
		if(link.indexOf("ebay.com") != "-1"){
			var seller = $(".red", html).eq(0).parent().parent().next().next().next().text();
			var prices = $(".red", html);
			if(prices.eq(1).text()){
				var currentPrice = prices.eq(0).text().match(/\d|\./g).join("");
				var shippingPrice = prices.eq(1).text().match(/\d|\./g).join("");
				price = (+currentPrice) + (+shippingPrice);
			}else{
				var err = "ERROR: " + $("table td b", html).text();
				$(".price", tr).text(err);
				dataBook[i]["price"] = err;
				dataOptions["value"] = dataBook;
				$("#tr"+i).attr("class", "error");
				saveData(dataOptions);
				afterScrape(data);
				return alert(err);
			}
		}else if(link.indexOf("amazon.com") != "-1"){
			var seller = $('.accordion-row-content .a-spacing-mini .a-link-normal', html).eq(0).text();
			var price = $(".olp-padding-right .a-color-price", html).eq(1).text().match(/\d|\./g).join("");
		}else if(link.indexOf("cggtrx.com") != "-1"){
			return scrapeChegg(data);
		}else{
			afterScrape(data);
			return alert("Code scrape for "+site+" scrape not supported! Please contact developer.");
		}
		data.price = price;
		data.seller = seller;
		return checkPriceSeller(data);
	})
	.catch(function(err){
		remLoading();
		console.log(err);
	})
}

// seller validation
function checkPriceSeller(options){
	var data = options;
	var price = generatePrice(options["price"]);
	var seller = options["seller"];
	var tr = options["tr"];
	var dataBook = options["dataBook"];
	var i = options["i"]
	var dataOptions = options["dataOptions"];
	var settings = getSetting();
	if(settings.blackList.indexOf(seller) != "-1"){
		afterScrape(data);
		$("#tr"+i).attr("class", "error");
		return alert("seller: "+seller+" in blackList!");
	}
	if(settings.blackListRecycle=="1"){
		if(seller.indexOf("recycle") != "-1"){
			afterScrape(data);
			$("#tr"+i).attr("class", "error");
			return alert("seller: "+seller+" in blackList! contain recycle.");
		}
	}
	$(".price", tr).text('$'+price);
	$(".seller", tr).text(seller);
	dataBook[i]["price"] = '$'+price;
	dataBook[i]["seller"] = seller;
	dataOptions["value"] = dataBook;
	saveData(dataOptions);
	return getDataFromBookbyte(data);
}

/*
you can test with
scrapeChegg({
	"isbn": 9780072433937,
	i:0,
	dataOptions: {key: "dataBook"},
	dataBook: JSON.parse(getData({key: "dataBook"})),
	bookbyteLink: "https://www.bookbyte.com/buyback2.aspx?isbns=9780072433937"
})
*/
function scrapeChegg(options){
	var data = {
		url: 'http://www.chegg.com/search/'+options["isbn"],
		type: "GET"
	}
	ajaxSend(data)
	.then(function(res){
		var token = false;
		try{
			token = res.split("C.global.csrfToken = '")[1].split("'")[0];
		}catch(err){
			afterScrape(options);
			console.log(err);
		}
		if(!token){
			afterScrape(options);
			$("#tr"+i).attr("class", "error");
			return alert("Token chegg not found!");
		}
		var getInfo = 'http://www.chegg.com/_ajax/federated/search?'
			+'query='+options["isbn"]
			+'&search_data=%7B%22chgsec%22%3A%22searchsection%22%2C%22chgsubcomp%22%3A%22serp%22%2C%22profile%22%3A%22textbooks-srp%22%2C%22page-number%22%3A%221%22%7D'
			+'&token='+token;
		ajaxSend({
			url: getInfo,
			type: "GET"
		})
		.then(function(res){
			try{
				var urlCheeg = res.textbooks.responseContent.docs[0].url;
			}catch(err){
				console.log(err);
				afterScrape(options);
				$("#tr"+i).attr("class", "error");
				return alert("ISBN number not found in chegg.com!");
			}
			ajaxSend({
				url: urlCheeg,
				type: "GET"
			})
			.then(function(res){
				var html = $.parseHTML(res
		  			.replace(/<img[^>]*>/g,"")
		  			.replace(/<link[^>]*>/g,"")
		  			.replace(/<script[^>]*>/g,""));
				var seller = $('.author-container a', html).text();
				try{
					var dataPrice = JSON.parse(res.split('"Buy","used":')[1].split(',"isbn"')[0]);
				}catch(err){
					console.log(err);
					afterScrape(options);
					$("#tr"+i).attr("class", "error");
					return alert("Price not found!");
				}
				var price = dataPrice.price;
				options.price = price;
				options.seller = seller;
				options.site = "chegg.com";
				return checkPriceSeller(options);
			})
		})
	})
	.catch(function(err){
		afterScrape(options);
		console.log(err);
	})
}

function generatePrice(price){
	var settings = getSetting();
	var shippingCost = settings.shippingCost;
	var finalPrice = (+price)+(+shippingCost);
	console.log("generatePrice "+price+" + "+shippingCost+" = "+finalPrice);
	return finalPrice;
}

function getDataFromBookbyte(options){
	var settings = getSetting();
	var bookbyteLink = options["bookbyteLink"];
	var dataBook = options["dataBook"];
	var dataOptions = options["dataOptions"];
	var i = options["i"];
	var site = options["site"];
	var price = options["price"];
	var seller = options["seller"];
	var tr = options["tr"];
	var url = bookbyteLink;
	if(settings.thirdPartyServer!="1"){
		url = "https://isbntool-agusnurwanto.rhcloud.com/ajaxFlipLink.php?getPrice=true&url="
		+encodeURIComponent(bookbyteLink);
	}
	var options = {
		url: url,
		type: "GET"
	}
	ajaxSend(options)
	.then(function(res){
		var idTable = false;
		var html = $.parseHTML(res
  			.replace(/<img[^>]*>/g,"")
  			.replace(/<link[^>]*>/g,"")
  			.replace(/<script[^>]*>/g,""));
		var optionsCheck = {
			res : res,
			html : html,
			isbn : dataBook[i]["isbn"]
		};
        var err = $("#ctl00_ContentPlaceHolder1_trSpecialMessage", html).text().trim();
        if(err){
			remLoading();
			alert("("+site+") $"+price+" | seller: "+seller+" | (bookbyte.com) ERROR:"+err);
			var priceBookbyte = "ERROR:"+err;
        }else{
        	var note = $("table.gvItemsBuyback table", html).eq(0)
                .find("td div span").text()
                .split("$")[0];
            if(note){
				remLoading();
				alert("("+site+") $"+price+" | seller: "+seller+" | (bookbyte.com) "+note);
				var priceBookbyte = note;
				// idTable = true;
            }else{
	            var priceBookbyte = $("table.gvItemsBuyback table", html).eq(0)
	                .find("td div span").text()
	                .split("$")[1];
				remLoading();
				var descriptionPrice = "("+site+") $"+price+" | (bookbyte.com) $"+priceBookbyte;
				if(price < (+priceBookbyte)){
					var options = {
						url: bookbyteLink,
						type: "GET"
					}
					ajaxSend(options)
						.then(function(res){
							$("#tr"+i).attr("class", "success");
							alert(descriptionPrice+" | the price is lowest then bookbyte! | SUCCESS: the book add to cart");
						});
				}else{
					alert(descriptionPrice+" | the price is more expensive then bookbyte!");
					optionsCheck["more_expensive"] = true;
					$("#tr"+i).attr("class", "error");
					if(settings.thirdPartyServer=="1"){
						idTable == true;
					}
				}
			}
		}
		if(!err && !note){
			priceBookbyte = "$"+priceBookbyte;
		}
		$(".bookbytePrice", tr).text(priceBookbyte);
		dataBook[i]["bookbytePrice"] = priceBookbyte;
		dataOptions["value"] = dataBook;
		saveData(dataOptions);
		afterScrape(options);
		if(idTable){
			// remBook(optionsCheck);
			chrome.tabs.create({
				'url': 'https://www.bookbyte.com/buyback2.aspx?removeBook=0'
				+'&isbnRemove='+dataBook[i]["isbn"] }, 
				function(tab) {
			  // Tab opened.
			});
		}
	})
	.catch(function(err){
		remLoading();
		console.log(err);
	})
}

function remBook(options){
	var html = options["html"];
	var param = {};
	$("input", html).each(function(i, b){
		var input = $(b);
		param[encodeURIComponent(input.attr("name"))] = encodeURIComponent(input.val());
	});
	$("select", html).each(function(i, b){
		var select = $(b);
		param[encodeURIComponent(select.attr("name"))] = select.val();
	});
	param["__EVENTTARGET"] = encodeURIComponent($("table.gvItemsBuyback>tbody>tr>td>table", html).eq(0)
		.find(".buybackRemoveWrapper a").attr("href")
		.split("'")[1]);
	var combineScript = options["res"]
		.match(/CombineScripts.axd[^"]*/g)[0];
	$.ajax({
		type: "GET",
		url: "https://www.bookbyte.com/"+combineScript,
	});
	param["ctl00_ScriptManager1_HiddenField"] = combineScript
		.match(/_TSM_CombinedScripts_=[^"]*/g)[0]
		.split("=")[1];
	delete param["undefined"];
	// delete param["__EVENTVALIDATION"];
	// delete param["__EVENTTARGET"];
	// delete param["__VIEWSTATE"];
	param["hiddenInputToUpdateATBuffer_CommonToolkitScripts"] = "1";
	param[encodeURIComponent("ctl00$Header1$rblType")] = "0";
	param = decodeURIComponent($.param(param)).replace(/\+/g,"%2B");
	$.ajax({
	    type: "POST",
	    url: "https://www.bookbyte.com/buyback2.aspx",
	    data: param,
	    headers: { 
	    	'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
	    	'Accept-Encoding': 'gzip, deflate',
	    	'Accept-Language': 'en-US,en;q=0.8',
	    	'Cache-Control': 'max-age=0',
	    	'Connection': 'keep-alive',
	    	'Content-Type': 'application/x-www-form-urlencoded',
	    	'Host': 'www.bookbyte.com',
	    	'HTTPS': '1',
	    	'Origin': 'https://www.bookbyte.com',
	    	'Referer': 'https://www.bookbyte.com/buyback2.aspx',
	    	'User-Agent': 'Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.89 Safari/537.36'
	    },
	    success: function(data) {
	        // console.log(data);
	    }
	});
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
	$("#shipping-cost").val(data.shippingCost);
	if(data["thirdPartyServer"]=="1"){
		$("#third-party-server").prop("checked",true);
	}else{
		$("#third-party-server").prop("checked",false);
	}
	return;
}

function resetSetting(event){
	event.preventDefault();
	data = {
		listSite: [
			"ebay.com", 
			"amazon.com", 
			"cggtrx.com"
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
		blackListRecycle: 1,
		thirdPartyServer: 1,
		shippingCost: "3.99"

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

	var thirdPartyServer = 0;
	if($('#third-party-server').is(':checked')==true){
		thirdPartyServer = 1;
	}

	var shippingCost = $('#shipping-cost').val();
	var data = {
		listSite: listSite,
		blackList: blackList,
		blackListRecycle: blackListRecycle,
		shippingCost: shippingCost,
		thirdPartyServer: thirdPartyServer
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
			blackListRecycle: $("#black-list-recycle").val(),
			shippingCost: $("#shipping-cost").val(),
			thirdPartyServer: $("#third-party-server").val()
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
	        timeout: (600 * 1000),
	        success: function(res){
	        	console.log("success send ajax to "+options["url"]);
	        	resolve(res);
	        },
	        error: function (jqXHR, textStatus, errorThrown){
	        	remLoading();
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