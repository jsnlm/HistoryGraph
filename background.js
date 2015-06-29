var shouldUpdate = true;

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (!shouldUpdate) {
        shouldUpdate = true;
        return;
    }

    if(changeInfo && changeInfo.url) {
        var current = tab.id + ';' + tab.url;

        if (sessionStorage.getItem(current)) { //case existing node
            //do nothing
        } else if(sessionStorage.getItem('root' + tab.id)) { //case new child
            var prevCurr = sessionStorage.getItem('current' + tab.id);
            var oldNode = JSON.parse(sessionStorage.getItem(prevCurr));

            oldNode.children.push(current);
            var newNode = {href: tab.url, parent: prevCurr, children: [], icon : "http://www.google.com/s2/favicons?domain="+tab.url};
            sessionStorage.setItem(prevCurr, JSON.stringify(oldNode));
            sessionStorage.setItem(current, JSON.stringify(newNode));
        } else { //case new root
            var root = {href: tab.url, parent: -1, children: [], icon : "http://www.google.com/s2/favicons?domain="+tab.url};
            sessionStorage.setItem('root' + tab.id, current);
            sessionStorage.setItem(current, JSON.stringify(root));
        }
        sessionStorage.setItem('current' + tab.id, current);
    }
});

function getTree(tabId) {
    var root = JSON.parse(sessionStorage.getItem(sessionStorage.getItem('root' + tabId)));
    var currentKey = sessionStorage.getItem('current' + tabId);
    console.log(currentKey);
    console.log(currentKey.replace(tabId + ';', ''));
    return replaceHash(root, currentKey.replace(tabId + ';', ''));
}

function replaceHash(tree, currentKey) {
    if (tree.href == currentKey)
        tree.active = true;
    delete tree["parent"];
    var children = tree['children'];
    for (var i=0; i < tree.children.length; i++) {
        children[i] = JSON.parse(sessionStorage.getItem(children[i].toString()));
        replaceHash(children[i], currentKey);
    }
    return tree;
}

function navigatePage(tabId, id) {
    sessionStorage.setItem('current' + tabId, tabId + ';' + id);
    shouldUpdate = false;
}

//// Todo: Need to change to graph when user moves back or forward
//chrome.webNavigation.onCommitted.addListener(function(details) {
//        console.log(details);
//    if(details.transitionQualifiers[0] == "forward_back") {
//    //    var oldNode = JSON.parse(sessionStorage.getItem(current.toString()));
//    //    if (JSON.parse(sessionStorage.getItem(oldNode.parent.toString())).href == details.href) {
//    //        current--;
//    //    }
//    }
//    lock = false;
//});

/* Todo: concurrency problem with forward/back button and regular page clicks
            modify history to conform with our graph navigation
 */