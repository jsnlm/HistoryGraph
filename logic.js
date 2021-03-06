// Get JSON data
//Hover shows link
//Click link, it'll page
//Click plus sign, it'll expand branches

var activeNode = null;

chrome.tabs.query({active:true,currentWindow:true},function(tabs){
    var treeData = chrome.extension.getBackgroundPage().getTree(tabs[0].id);
    activeNode = treeData;
    createGraph(treeData);
});

function createGraph(treeData) {
    if (!treeData) return;
    // Calculate total nodes, max label length
    var totalNodes = 0;
    var nodeDefaultWidth = 55;
    var maxLabelLength = 0;
    // panning variables
    var panSpeed = 200;
    // Misc. variables
    var i = 0;
    var duration = 750;
    var root;

    // size of the diagram
    var viewerWidth = $(document).width();
    var viewerHeight = $(document).height();

    var tree = d3.layout.tree()
        .size([viewerHeight, viewerWidth]);

    // define a d3 diagonal projection for use by the node paths later on.
    var diagonal = d3.svg.diagonal()
        .projection(function(d) {
            return [d.y, d.x];
        });

    // A recursive helper function for performing some setup by walking through all nodes

    function visit(parent, visitFn, childrenFn) {
        if (!parent) return;

        visitFn(parent);

        var children = childrenFn(parent);
        var count = children.length;
        for (var i = 0; i < count; i++) {
            visit(children[i], visitFn, childrenFn);
        }
    }

    // Call visit function to establish maxLabelLength
    visit(treeData, function(d) {
        totalNodes++;
        maxLabelLength = Math.max(d.href.length, maxLabelLength);

    }, function(d) {
        return d.children; //&& d.children.length > 0 ? d.children : null;
    });


    // TODO: Pan function, can be better implemented.

    function pan(domNode, direction) {
        var speed = panSpeed;
        if (panTimer) {
            clearTimeout(panTimer);
            var translateCoords = d3.transform(svgGroup.attr("transform"));
            var translateX = 0, translateY = 0;
            if (direction == 'left' || direction == 'right') {
                translateX = direction == 'left' ? translateCoords.translate[0] + speed : translateCoords.translate[0] - speed;
                translateY = translateCoords.translate[1];
            } else if (direction == 'up' || direction == 'down') {
                translateX = translateCoords.translate[0];
                translateY = direction == 'up' ? translateCoords.translate[1] + speed : translateCoords.translate[1] - speed;
            }
        //    scaleX = translateCoords.scale[0];
         //   scaleY = translateCoords.scale[1];
            var scale = zoomListener.scale();
            svgGroup.transition().attr("transform", "translate(" + translateX + "," + translateY + ")scale(" + scale + ")");
            d3.select(domNode).select('g.node').attr("transform", "translate(" + translateX + "," + translateY + ")");
            zoomListener.scale(zoomListener.scale());
            zoomListener.translate([translateX, translateY]);
            var panTimer = setTimeout(function() {
                pan(domNode, speed, direction);
            }, 50);
        }
    }

    // Define the zoom function for the zoomable tree

    function zoom() {
        svgGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }


    // define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
    var zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3]).on("zoom", zoom);

    // define the baseSvg, attaching a class for styling and the zoomListener
    var baseSvg = d3.select("#tree-container").append("svg")
        .attr("width", viewerWidth)
        .attr("height", viewerHeight)
        .attr("class", "overlay")
        .call(zoomListener);

    // Helper functions for collapsing and expanding nodes.

    function collapse(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }

    function expand(d) {
        if (d._children) {
            d.children = d._children;
            d.children.forEach(expand);
            d._children = null;
        }
    }

    function centerNode(source) {
        var scale = zoomListener.scale();
        var x = -source.y0;
        var y = -source.x0;
        x = x * scale + viewerWidth / 2;
        y = y * scale + viewerHeight / 2;
        d3.select('g').transition()
            .duration(duration)
            .attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");
        zoomListener.scale(scale);
        zoomListener.translate([x, y]);
    }

    // Toggle children function

    function toggleChildren(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else if (d._children) {
            d.children = d._children;
            d._children = null;
        }
        return d;
    }

    // Toggle children on click.

    function click(d) {

        if (d3.event.defaultPrevented) return; // click suppressed
        d = toggleChildren(d);
        update(d);
        centerNode(d);
    }

    function update(source) {
        // Compute the new height, function counts total children of root node and sets tree height accordingly.
        // This prevents the layout looking squashed when new nodes are made visible or looking sparse when nodes are removed
        // This makes the layout more consistent.
        var levelWidth = [1];
        var childCount = function(level, n) {

            if (n.children && n.children.length > 0) {
                if (levelWidth.length <= level + 1) levelWidth.push(0);

                levelWidth[level + 1] += n.children.length;
                n.children.forEach(function(d) {
                    childCount(level + 1, d);
                });
            }
        };
        childCount(0, root);
        var newHeight = d3.max(levelWidth) * 70; // 25 pixels per line
        tree = tree.size([newHeight, viewerWidth]);

        // Compute the new tree layout.
        var nodes = tree.nodes(root).reverse(),
            links = tree.links(nodes);

        // Set widths between levels based on maxLabelLength.
        nodes.forEach(function(d) {
            //     d.y = (d.depth * (maxLabelLength * 10)); //maxLabelLength * 10px
            // alternatively to keep a fixed scale one can set a fixed depth per level
            // Normalize for fixed-depth by commenting out below line
            d.y = (d.depth * 150); //500px per level.

            //set the current
            if (d.active) activeNode = d;
        });

        // Update the nodes…
        var node = svgGroup.selectAll("g.node")
            .data(nodes, function(d) {
                return d.id || (d.id = ++i);
            });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", "translate(" + source.y0 + "," + source.x0 + ")");


        // nodeEnter.append("circle")
        //     .attr('class', 'nodeCircle')
        //     .attr("r", 0)
        //     .style("fill", function(d) {
        //         return d._children ? "lightsteelblue" : "#fff";
        //     });
        nodeEnter.append("rect")
            .attr('class', 'nodeCircle')
            .attr("r", 0)
            .attr("rx", 4)
            .attr("ry", 4)
            .attr("aeuf", 248)
            .attr("width",nodeDefaultWidth)
            .attr("height",40)
            .attr("aeuf", 248)
            .style(
            {"stroke":function(d){return d.active ? "#A33" : "black";},
                "stroke-width":function(d){return d.active ? "4" : "2";},
                "fill":function(d){return d.active ? "rgb(255, 155, 155)" : "#fff";},
                "opacity":'1'}
        );



        nodeEnter.on("mouseenter", function(){
            $(this).find(".linkHyperlink").show();
            $(this).find(".linkPicture").hide();
            $(this).children('rect').attr("width", $(this).find(".linkHyperlink")[0].getComputedTextLength() + 40);
            $(this).css('z-index', '10');
        })
            .on ("mouseleave", function(){
            $(this).find(".linkHyperlink").hide();
            $(this).find(".linkPicture").show();
            $(this).children('rect').attr("width", nodeDefaultWidth + "px");
            $(this).css('z-index', '0');
        });

        var link = nodeEnter.append("a").attr("href", function (d) {
            return d.href;
        }).on('click', function(e) {
            chrome.tabs.query({active:true,currentWindow:true},function(tabs){
                var tab = tabs[0];
                chrome.tabs.update(tab.id, {url: e.href});
                window.close();
            });
        });

        link.append("text")
            .attr("x", function(d) {
                return d.children || d._children ? -10 : 10;
                //return 50;
            })
            //.attr("dy", ".35em")
            .attr("dx", ".50em")
            .attr("dy", ".550em")
            .attr('class', 'nodeText')
            .attr("text-anchor", function(d) {
                return d.children || d._children ? "end" : "start";
            })
            .text(function(d) {
                return d.href;
            })
            .style("fill-opacity", 0);



        // Update the text to reflect whether node has children or not.
        node.select('text')
            .attr("x", function(d) {
                return d.children || d._children ? 12 : 12;
                //return 50;
            })
            .attr("y", 15)
            .attr("class", "linkHyperlink")
            .attr("text-anchor", function(d) {
                //return d.children || d._children ? "end" : "start";
                return d.children || d._children ? "start" : "start";
            })
            .text(function(d) {
                return d.href;
            })
            .style({"display":'none'});

        link.append("image")
            .attr("xlink:href", function(d){ return d.icon; })
            .attr("x", 20)
            .attr("y", 8)
            .attr("height", "23px")
            .attr("width","23px")
            .attr("dx", ".50em")
            .attr("dy", ".500em")
            .attr('class', 'nodeText linkPicture')
            .attr("text-anchor", "start");

        nodeEnter.append("text")
            .attr("x", function(d) {
                return d.children || d._children ? 2 : 2;
            })
            .attr("y", 10)
            .attr("dx", "0em")
            .attr("dy", ".623em")
            .attr('class', 'nodeMinus')
            .attr("text-anchor", "start")
            .text("-")
            .style("fill-opacity", 1)
            .on( "click", function (d) {
                if (d.children) {
                    $(this).text('+');
                    $(this).css('fill','green');
                } else {
                    $(this).text('-');
                    $(this).removeAttr('style');
                }
                click(d);
            });


        // Change the circle fill depending on whether it has children and is collapsed
        node.select("rect.nodeCircle")
            .attr("r", 4.5)
             .style("fill", function(d) {
                 return d.active ? "rgb(255, 155, 155)" : d._children ? "lightblue":"#fff";
             })
        ;

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + d.y + "," + (d.x-20) + ")";
            });

        // Fade the text in
        nodeUpdate.select("text")
            .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", "translate(" + source.y + "," + source.x + ")")
            .remove();

        nodeExit.select("circle")
            .attr("r", 0);

        nodeExit.select("text")
            .style("fill-opacity", 0);

        // Update the links…
        var linkage = svgGroup.selectAll("path.link")
            .data(links, function(d) {
                return d.target.id;
            });

        // Enter any new links at the parent's previous position.
        linkage.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function() {
                var o = {
                    x: source.x0,
                    y: source.y0
                };
                return diagonal({
                    source: o,
                    target: o
                });
            });

        // Transition links to their new position.
        linkage.transition()
            .duration(duration)
            .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        linkage.exit().transition()
            .duration(duration)
            .attr("d", function() {
                var o = {
                    x: source.x,
                    y: source.y
                };
                return diagonal({
                    source: o,
                    target: o
                });
            })
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    // Append a group which holds all nodes and which the zoom Listener can act upon.
    var svgGroup = baseSvg.append("g");

    // Define the current
    root = treeData;
    root.x0 = viewerHeight / 2;
    root.y0 = 0;

    // Layout the tree initially and center on the root node.
    update(root);
    centerNode(activeNode);
}
