var counter = 0;

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
//    console.log(changeInfo);
  //  console.log(tab);
    var current = 0;
    if(changeInfo && changeInfo.url) {
        if(sessionStorage.getItem('root')) {
            current = sessionStorage.getItem('current');
            var oldNode = JSON.parse(sessionStorage.getItem(current.toString()));
            var parentNode = JSON.parse(sessionStorage.getItem((oldNode.parent).toString()));
            console.log(changeInfo.url);
            console.log(tab.url);
            if (parentNode)
            console.log(parentNode.href);
            if (parentNode && parentNode.href == tab.url) {
                current = oldNode.parent;
                console.log(current);
                sessionStorage.setItem('current', current);
                return;
            } else {
                for (var i=0; i < oldNode.children.length; i++) {
                    var childNode = JSON.parse(sessionStorage.getItem(oldNode.children[i].toString()));
                    if (childNode.href == tab.url) {
                        current = oldNode.children[i];
                        console.log(current);
                        sessionStorage.setItem('current', current);
                        return;
                    }
                }
            }

            oldNode.children.push(counter.toString());
            var newNode = {name: "williamChops", href: tab.url, parent: (current).toString(), children: []};
            sessionStorage.setItem((current).toString(), JSON.stringify(oldNode));
            sessionStorage.setItem(counter.toString(), JSON.stringify(newNode));
         //   console.log(sessionStorage.getItem(counter.toString()));
            current = counter;
            counter++;
        } else {
            var root = {name: "williamChops", href: tab.url, parent: -1, children: []};
            sessionStorage.setItem('root', JSON.stringify(root));
            sessionStorage.setItem(counter.toString(), JSON.stringify(root));
        //    console.log(sessionStorage.getItem(counter.toString()));
            current = counter;
            counter++;
        }
        console.log(current);
        sessionStorage.setItem('current', current);
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
            session storage is persisting thru multiple tabs (or my code is bad)
            modify history to conform with our graph navigation
 */