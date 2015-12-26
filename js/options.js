var exclude = localStorage.getItem('isbn_exclude_site');
if(!exclude){
    var defaultExclude = JSON.stringify([
        "*://www.bookbyte.com/*",
        "*://www.facebook.com/*"
    ]);
    localStorage.setItem('isbn_exclude_site', defaultExclude);
    exclude = defaultExclude;
}
var excludeObj = JSON.parse(exclude);
var valTexarea = "";
for(var i in excludeObj){
    valTexarea += excludeObj[i]+",";
}
$('#exsclude_site').val(valTexarea);

// https://developer.chrome.com/extensions/messaging
// get message from pop up
chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
    if(request.task == "get_exsclude_site"){
        var exclude = localStorage.getItem('isbn_exclude_site');
        return sendResponse(exclude);
    }
    sendResponse({})
});