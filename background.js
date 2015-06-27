var counter = 0;
var shouldUpdate = true;

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (!shouldUpdate) {
        shouldUpdate = true;
        return;
    }
    console.log("tab.favIconUrl : " + tab.favIconUrl);
    var favIconUrl = "";
    if (tab.favIconUrl) favIconUrl = tab.favIconUrl;
    else if (changeInfo.favIconUrl) favIconUrl = changeInfo.favIconUrl;


    var current = 0;
    if(changeInfo && changeInfo.url) {
        console.log('tabId: ' + tab.id);
        if(sessionStorage.getItem('root' + tab.id)) {
            current = sessionStorage.getItem('current' + tab.id);
            console.log('first current ' + current);
            var oldNode = JSON.parse(sessionStorage.getItem(current.toString()));
            var parentNode = JSON.parse(sessionStorage.getItem((oldNode.parent).toString()));
            console.log(changeInfo.url);
            console.log(tab.url);
            if (parentNode)
            console.log(parentNode.href);
            if (parentNode && parentNode.href == tab.url) {
                current = oldNode.parent;
                console.log('second current ' + current);
                sessionStorage.setItem('current' + tab.id, current);
                return;
            } else {
                for (var i=0; i < oldNode.children.length; i++) {
                    var childNode = JSON.parse(sessionStorage.getItem(oldNode.children[i].toString()));
                    if (childNode.href == tab.url) {
                        current = oldNode.children[i];
                        console.log('second current ' + current);
                        sessionStorage.setItem('current' + tab.id, current);
                        return;
                    }
                }
            }

            oldNode.children.push(counter.toString());
            var newNode = {icon : favIconUrl, nodeId: counter, name: "williamChops", href: tab.url, parent: (current).toString(), children: []};
            sessionStorage.setItem((current).toString(), JSON.stringify(oldNode));
            sessionStorage.setItem(counter.toString(), JSON.stringify(newNode));
         //   console.log(sessionStorage.getItem(counter.toString()));
            console.log('old node:');
            console.log(oldNode);
            current = counter;
            counter++;
        } else {
            var root = {icon : favIconUrl, nodeId: counter, name: "williamChops", href: tab.url, parent: -1, children: []};
            sessionStorage.setItem('root' + tab.id, counter);
            sessionStorage.setItem(counter.toString(), JSON.stringify(root));
        //    console.log(sessionStorage.getItem(counter.toString()));
            current = counter;
            counter++;
        }
        console.log('second current ' + current);
        sessionStorage.setItem('current' + tab.id, current);
    }
});

function getTree(tabId) {
    var root = JSON.parse(sessionStorage.getItem(sessionStorage.getItem('root' + tabId)));
    var currentKey = sessionStorage.getItem('current' + tabId);
    return replaceHash(root, currentKey);
}

function replaceHash(tree, currentKey) {
    if (tree.nodeId == currentKey)
        tree.active = true;
    delete tree["parent"];
    var children = tree['children'];
    for (var i=0; i < tree.children.length; i++) {
        var childNum = children[i];
        children[i] = JSON.parse(sessionStorage.getItem(children[i].toString()));
        replaceHash(children[i], currentKey);
    }
    return tree;
}

function navigatePage(tabId, id) {
    sessionStorage.setItem('current' + tabId, id);
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