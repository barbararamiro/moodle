YUI.add('moodle-mod_lesson-pagemmove', function (Y, NAME) {

/**
 * A tool for moving and creating lessons.
 *
 * @module moodle-mod_lesson-pagemove
 */

/**
 * A tool for moving and creating lessons.
 *
 * @class M.mod_lesson-pagemmove.PagemMove
 * @extends Base
 * @constructor
 */
function PagemMove() {
    PagemMove.superclass.constructor.apply(this, arguments);
}

var SELECTORS = {
    MAINCONTAINER: '.mod_lesson_main',
    LESSONPAGES: '.mod_lesson_pages',
    PAGEMODULES: '.mod_lesson_page_element'
    },
    DEFAULTS = {
        PAGEWIDTH: 300,
        PAGEHEIGHT: 100,
        PATHFILL: {
            color: "#ff0000"
        },
        PAGEFILL: {
            color: "#ddddff"
        },
        PATHSTROKE: {
            weight: 2,
            color: "#ff0000"
        },
        PAGESTROKE: {
            weight: 2,
            color: "#000000"
        }
    };

var AJAXBASE = M.cfg.wwwroot + '/mod/lesson/ajax.php';

Y.namespace('M.mod_lesson').PagemMove = Y.extend(PagemMove, Y.Base, {

    // The Y.Graphic instance.
    graphic : null,

    drawJump: function(pagefrom, pageto) {
        var jumpShape = this.graphic.addShape({
            type: "path",
            stroke: DEFAULTS.PATHSTROKE,
            fill: DEFAULTS.PATHFILL
        });
        // jumpShape.moveTo(pagefrom.x + pagefrom.width, pagefrom.y + (pagefrom.height / 2));
        jumpShape.moveTo(pagefrom.x + (pagefrom.width / 2), pagefrom.y + pagefrom.height);
        jumpShape.lineTo(pageto.x + (pagefrom.width / 2), pageto.y);
        jumpShape.end();
        pagefrom.jumpShapes[pagefrom.jumpShapes.length] = jumpShape;
    },

    drawJumps: function(page, allpages) {
        var i = 0, j = 0;

        // console.log(page);
        var jumpname = "jumpto[" + j + "]";
        while (page.hasOwnProperty(jumpname)) {
            nextpageid = page[jumpname];
            if (nextpageid === "-1") {
                nextpageid = page.nextpageid;
            }

            for (i = 0; i < allpages.length; i++) {
                if (allpages[i].id === nextpageid) {
                    this.drawJump(page, allpages[i]);
                }
            }

            j += 1;
            jumpname = "jumpto[" + j + "]";
        }
    },

    redrawPage: function(page) {
        var canvas = Y.one(SELECTORS.LESSONPAGES);
        var jumpShape;
        // Move the title.
        page.titleNode.setXY([page.x + canvas.getX() + 10, page.y + canvas.getY() + 10]);

        // Move the shape.
        page.shapeNode.setXY([page.x + canvas.getX(), page.y + canvas.getY()]);

        jumpShape = page.jumpShapes.pop();
        while (typeof jumpShape !== "undefined") {
            this.graphic.removeShape(jumpShape);
            jumpShape = page.jumpShapes.pop();
        }
        var allpages = this.get('pages');
        this.drawJumps(page, allpages);
    },

    redrawAllPages: function() {
        var allpages = this.get('pages');
        var i = 0;
        var page;

        // First draw all the page containers
        for (i = 0; i < allpages.length; i++) {
            page = allpages[i];

            this.redrawPage(page);
        }
    },

    drawPage: function(page, position) {
        var canvas = Y.one(SELECTORS.LESSONPAGES);
        var allpages = this.get('pages');

        page.x = position.x;
        page.y = position.y;
        page.width = DEFAULTS.PAGEWIDTH;
        page.height = DEFAULTS.PAGEHEIGHT;
        if (page.qtype === "30") {
            // Find out how many elements in the cluster.
            // console.log(page.clusterchildrenids.length)
            page.width = page.clusterchildrenids.length * 330;
            page.height = 200;
            if (page.clusterchildrenids.length > 3) {
                page.width = 3 * 330;
                page.height = (Math.ceil(page.clusterchildrenids.length / 3)*200);
                console.log(page.height);
            }
        }
        page.jumpShapes = [];

        var shapeNode = this.graphic.addShape({
            type: Y.Rect,
            width: page.width,
            height: page.height,
            x: position.x,
            y: position.y,
            fill: DEFAULTS.PAGEFILL,
            stroke: DEFAULTS.PAGESTROKE
        });

        page.shapeNode = shapeNode;

        // Add some text to the shape
        var titleNode = Y.Node.create('<div style="cursor: pointer; width: 200px;">' + Y.Escape.html(page.qtypestr) + ': ' + Y.Escape.html(page.title) + '</div>');
        canvas.append(titleNode);
        // Keep track of it so we can move it.
        page.titleNode = titleNode;
        titleNode.setXY([position.x + canvas.getX() + 10, position.y + canvas.getY() + 10]);

        // Make the shape draggable.
        var dd = new Y.DD.Drag({
            node: titleNode
        }).plug(Y.Plugin.DDConstrained, {
            constrain2node: SELECTORS.MAINCONTAINER
        });

        dd.on('drag:drag', function(e) {

            // Redraw the page and jumps.
            page.x = e.pageX - canvas.getX() - 10;
            page.y = e.pageY - canvas.getY() - 10;
            this.redrawAllPages();
            // console.log(e);
            // console.log(page);

        }, this);

        dd.on('drag:end', function(e) {
            console.log(page);

            // var currentnode = dd.get('currentNode');
            // console.log(e.pageX - canvas.getX() - 10);
            // console.log(page);
            this.savePosition(page);


        }, this);

    },

    savePosition: function(page) {

        // console.log(page);

        var ajaxurl = AJAXBASE,
                    config;

        config = {
            method: 'post',
            context: this,
            sync: false,
            data : {
                'action'   : 'saveposition',
                'lessonid' : page.lessonid,
                'pageid'   : page.id,
                'pagex'    : page.x,
                'pagey'    : page.y
            },
            on: {
                success: function(tid, response) {
                    var jsondata;
                    try {
                        jsondata = Y.JSON.parse(response.response);
                        // jsondata = Y.JSON.parse(response.responseText);
                        // console.log(jsondata);
                        // if (jsondata.error) {
                        //     return new M.core.ajaxException(jsondata);
                        // } else {
                        //     console.log(jsondata);
                        // }
                    } catch (e) {
                        //return new M.core.exception(e);
                    }
                },
                failure: function(tid, response) {
                    //return M.core.exception(response.responseText);
                    alert('something went wrong');
                }
            }
        };

        YUI().use("io-base", function(Y) {
            Y.io(ajaxurl, config);
        });


    },

    initializer: function() {
        // Lets get a graphics context to draw stuff.
        // Instantiate a graphic instance
        this.graphic = new Y.Graphic({
            render: SELECTORS.LESSONPAGES
        });

        var allpages = this.get('pages');
        var i = 0;
        var page;
        var tempposition;
        var position = {
            x: 0,
            y: 0
        };

        // First draw all the page containers
        for (i = 0; i < allpages.length; i++) {
            page = allpages[i];

            // console.log(page.x);
            if (page.x !== 0) {
                tempposition = {
                    x: parseInt(page.x),
                    y: parseInt(page.y)
                }
            } else {
                tempposition = position;
            }

            this.drawPage(page, tempposition);

            position.y += 150;
        }

        // Now draw jumps.
        for (i = 0; i < allpages.length; i++) {
            page = allpages[i];

            this.drawJumps(page, allpages);
        }

        /**
        var allLessonPages = Y.all(SELECTORS.PAGEMODULES);
        var lessonpagedata = Y.JSON.parse(this.get('lessondata'));
        // console.log(lessonpagedata);

        YUI().use('dd-delegate', 'dd-drop-plugin', function(Y) {

            var del = new Y.DD.Delegate( {
                container: SELECTORS.MAINCONTAINER,
                nodes: SELECTORS.PAGEMODULES

            });

            
        });

        allLessonPages.each(function (lessonPage) {
            // Click and drag of the lesson page.
            lessonPage.on('click', function () {
                console.log(lessonPage);
                // console.log(lessonPage.getXY());
                // lessonPage.setStyle('position', 'absolute');
                // lessonPage.setStyle('left', '25px');
                // lessonPage.setStyle('top', '55px');

            });
        });
    **/
    }


}, {
    NAME: 'pagemMove',
    ATTRS: {
        /**
         * Data for the table.
         *
         * @attribute tabledata.
         * @type Array
         * @writeOnce
         */
        pages: {
             value: null
        }
    }
});


// Y.namespace('M.mod_lesson-pagemmove') = function() {};
Y.namespace('M.mod_lesson.PagemMove').init = function(pages) {
    return new PagemMove({ pages: pages});
};


}, '@VERSION@', {
    "requires": [
        "base",
        "event",
        "node",
        "io",
        "graphics",
        "json",
        "event-move",
        "event-resize",
        "dd-delegate",
        "dd-plugin",
        "dd-constrain",
        "dd-drop-plugin"
    ]
});
