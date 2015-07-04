var tabs = {};

chrome.tabs.onReplaced.addListener(function (newId, removedId) {
  //  console.log('newId: ' + newId);
 //   console.log('oldId: ' + removedId);
    tabs[newId] = tabs[removedId];
    delete tabs[removedId];
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo && changeInfo.url) {
        var currTab = tabs[tab.id];
    //    console.log('currTab:');
    //    console.log(currTab);
    //    console.log('tab');
    //    console.log(tab);
        var newNode = {
            href: tab.url,
            children: [],
            icon: "http://www.google.com/s2/favicons?domain=" + tab.url,
            active: true
        };
        if (!currTab) { //case no root
            currTab = {};
            currTab['root'] = newNode;
            currTab['current'] = newNode;
            currTab[tab.url] = newNode;
            tabs[tab.id] = currTab;
        } else {
            var prevCurr = currTab['current'];
            prevCurr.active = false;
            var existingNode = currTab[tab.url];
            if (existingNode) { //case existing node
                existingNode.active = true;
                currTab['current'] = existingNode;
            } else { //otherwise add new node
                prevCurr.children.push(newNode);
                currTab[tab.url] = newNode;
                currTab['current'] = newNode;
            }
        }
    }
});

function getTree(tabId) {
    var currTab = tabs[tabId];
    return currTab ? $.extend(true, {}, currTab['root']):null;
}
//function getTree(tabId) {
//    var root = JSON.parse(sessionStorage.getItem(sessionStorage.getItem('root' + tabId)));
//    var currentKey = sessionStorage.getItem('current' + tabId);
//    console.log(currentKey);
//    console.log(currentKey.replace(tabId + ';', ''));
//    return replaceHash(root, currentKey.replace(tabId + ';', ''));
//}
//
//function replaceHash(tree, currentKey) {
//    if (tree.href == currentKey)
//        tree.active = true;
//    delete tree["parent"];
//    var children = tree['children'];
//    for (var i=0; i < tree.children.length; i++) {
//        children[i] = JSON.parse(sessionStorage.getItem(children[i].toString()));
//        replaceHash(children[i], currentKey);
//    }
//    return tree;
//}

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