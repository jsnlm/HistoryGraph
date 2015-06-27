var counter = 0;
var current = 0;

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    console.log(changeInfo);
    console.log(tab);
    if(changeInfo && changeInfo.url) {
        if(sessionStorage.getItem('root')) {
            var parentNode = JSON.parse(sessionStorage.getItem((counter-1).toString()));
            parentNode.children.push(counter.toString());
            var newNode = {name: "williamChops", href: tab.url, parent: (counter-1).toString(), children: []};
            sessionStorage.setItem((counter-1).toString(), JSON.stringify(parentNode));
            sessionStorage.setItem(counter.toString(), JSON.stringify(newNode));
            console.log(sessionStorage.getItem(counter.toString()));
            counter++;
            current++;
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

    console.log(replaceHash(root));
    return replaceHash(root);
}

function replaceHash(tree) {
    for(var key in tree) {
        if(tree.hasOwnProperty(key)) {
            if(key == "parent" && tree[key] != -1) {
                tree[key] = JSON.parse(sessionStorage.getItem(tree[key].toString()));
            } else if (key == "children") {
                var childrens = tree[key];
                for(var i = 0; i < childrens.length; i++) {
                    childrens[i] = JSON.parse(sessionStorage.getItem(childrens[i].toString()));
                    replaceHash(childrens[i]);
                }
            }
        }
    }

    return tree;
}

// Todo: Need to change to graph when user moves back or forward
chrome.webNavigation.onCommitted.addListener(function(details) {
        console.log(details);
    if(details.transitionQualifiers[0] == "forward_back") {
    //    var oldNode = JSON.parse(sessionStorage.getItem(current.toString()));
    //    if (JSON.parse(sessionStorage.getItem(oldNode.parent.toString())).href == details.href) {
    //        current--;
    //    }
    }
    lock = false;
});