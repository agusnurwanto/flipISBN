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
	    		trBody += '<tr>'
	    			+'<td class="link">'+res[i].link+'</td>'
	    			+'<td class="status">'+res[i].status+'</td>'
	    			+'<td class="action">'
		    			+'<button type="button" class="btn btn-primary btn-xs">Send</button>'
		    			+'<button type="button" class="btn btn-default btn-xs">Remove</button>'
		    		+'</td>'
	    			+'</tr>'
	    	}
	    }else{
	    	trBody = '<tr><td colspan="3" class="status">Data is empty!</td></tr>';
	    }
    	$('table.data-table tbody').html(trBody);
    }
	sendResponse({})
})