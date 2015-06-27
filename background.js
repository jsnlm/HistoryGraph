var counter = 0;

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if(changeInfo && changeInfo.url) {
        if(sessionStorage.getItem('root')) {
            var parentNode = JSON.parse(sessionStorage.getItem((counter-1).toString()));
            parentNode.children.push(counter.toString());
            var newNode = {name: "williamChops", href: tab.url, parent: (counter-1).toString(), children: []};
            sessionStorage.setItem((counter-1).toString(), JSON.stringify(parentNode));
            sessionStorage.setItem(counter.toString(), JSON.stringify(newNode));
            console.log(sessionStorage.getItem(counter.toString()));
            counter++;
        } else {
            var root = {name: "williamChops", href: tab.url, parent: -1, children: []};
            sessionStorage.setItem('root', JSON.stringify(root));
            sessionStorage.setItem(counter.toString(), JSON.stringify(root));
            console.log(sessionStorage.getItem(counter.toString()));
            counter++;
        }
    }
});

function getTree() {
    var root = JSON.parse(sessionStorage.getItem(0));

    return replaceHash(root);
}

function replaceHash(tree) {
    for(var key in tree) {
        if(tree.hasOwnProperty(key)) {
            if(key == "parent") {
                delete tree[key];
            } else if (key == "children") {
                var children = tree[key];
                for(var i = 0; i < children.length; i++) {
                    var childNum = children[i];
                    children[i] = JSON.parse(sessionStorage.getItem(children[i].toString()));
                    if(childNum == counter - 1) {
                        children[i].active = true;
                    }
                    replaceHash(children[i]);
                }
            }
        }
    }

    return tree;
}

// Todo: Need to change to graph when user moves back or forward
//chrome.webNavigation.onCommitted.addListener(function(details) {
//    if(details.transitionQualifiers[0] == "forward_back")
//        alert(details.url);
//    console.log(details.url);
//    window.state
//});