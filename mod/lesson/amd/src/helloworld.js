define(['jqueryui', 'jquery'], function(jqui, $) {

    var lessonobjects = null;
    var lessonobjectid = 9999;
    var lessonid = 0;
    var ajaxlocation = 'ajax.php';

    var drawline = function(pagefrom, pageto) {
        if (pageto === 0) {
            return;
        }
        if (!document.getElementById('mod_lesson_page_element_' + pagefrom)) {
            return;
        }
        if (!document.getElementById('mod_lesson_page_element_' + pageto)) {
            return;
        }

        var fromoffset = $('#mod_lesson_page_element_' + pagefrom).offset();
        var tooffset = $('#mod_lesson_page_element_' + pageto).offset();

        var fromx = fromoffset.left + $('#mod_lesson_page_element_' + pagefrom).width();
        var fromy = fromoffset.top + $('#mod_lesson_page_element_' + pagefrom).height();

        var length = Math.sqrt(((tooffset.left - fromx) * (tooffset.left - fromx)) +
                ((tooffset.top - fromy) * (tooffset.top - fromy)));
        var angle = Math.atan2((fromy - tooffset.top), (fromx - tooffset.left)) * (180 / Math.PI);
        var cx = ((fromx + tooffset.left) / 2) - (length / 2);
        var cy = ((fromy + tooffset.top) / 2) - 1;
        var htmlline = "<div class='lessonline' style='left:" + cx + "px; top:" + cy + "px; width:" + length + "px;";
        htmlline += " -moz-transform:rotate(" + angle + "deg); -webkit-transform:rotate(" + angle + "deg);";
        htmlline += " -o-transform:rotate(" + angle + "deg); -ms-transform:rotate(" + angle + "deg);";
        htmlline += " transform:rotate(" + angle + "deg);' />";
        $('body').append(htmlline);
    };

    var drawalllines = function() {
        // console.log('drawinglines');
        $('.lessonline').remove();
        for (var lessonpageid in lessonobjects) {
            var currentlessonobject = lessonobjects[lessonpageid];
            var i = 0, nextpageid = 0;
            var jumpname = "jumpto[" + i + "]";
            while (currentlessonobject.hasOwnProperty(jumpname)) {
            // var nextjumpid = currentlessonobject[jumpname];
            // console.log(currentlessonobject[jumpname]);
                if(currentlessonobject[jumpname] === "-1") {
                    nextpageid = currentlessonobject.nextpageid;
                } else {
                    nextpageid = currentlessonobject[jumpname];
                }

                if (currentlessonobject.qtype === "31") {
                    drawline(currentlessonobject.clusterid, nextpageid);
                } else if (nextpageid === "-9") {
                    drawline(currentlessonobject.id, currentlessonobject.id + '1');
                } else if (currentlessonobject.location !== "cluster") {
                    drawline(currentlessonobject.id, nextpageid);
                }
                i += 1;
                jumpname = "jumpto[" + i + "]";
            }
        } 
    };

    /**
     * I now think that we don't need this.
     */
    var addEOL = function() {
        for (var lessonpageid in lessonobjects) {

            var i = 0, nextpageid = 0;
            var jumpname = "jumpto[" + i + "]";
            while(lessonobjects[lessonpageid].hasOwnProperty(jumpname)) {
                if(lessonobjects[lessonpageid][jumpname] === "-1") {
                    nextpageid = lessonobjects[lessonpageid].nextpageid;
                } else {
                    nextpageid = lessonobjects[lessonpageid][jumpname];
                }

                if (nextpageid === "-9") {
                    // Add the html to the screen.
                    // var currentobject = lessonobjects[lessonpageid];
                    var htmleol = "<div class='mod_lesson_page_element' id='mod_lesson_page_element_" + lessonpageid + "1'>";
                    htmleol += "<header id='mod_lesson_page_element_" + lessonpageid + "1'>End Of Lesson</header>";
                    htmleol += "<div class='mod_lesson_page_body' id='mod_lesson_page_element_" + lessonpageid + "1'></div></div>";
                    $('#mod_lesson_page_element_' + lessonpageid).append(htmleol);
                    // Add an End Of Lesson object to the lessonobjects.
                    var newid = lessonpageid + '1';
                    var temp = {
                        id: newid,
                        prevpageid: lessonpageid,
                        nextpageid: 'none',
                        qtype: '-1',
                        eolid: newid
                    };
                    lessonobjects[newid] = temp;
                }
                i += 1;
                jumpname = "jumpto[" + i + "]";
            }
        }
    };

    var attachElement = function(event, ui) {
        var ischild = $(this).find(ui.helper).length;
        if (!ischild) {
            ui.helper.detach();
            $(this).append(ui.helper);
            formatClusters();
        }
    };

    var detachElement = function(event, ui) {
        var ischild = $(this).find(ui.helper).length;
        // var lastoffset = ui.helper.offset();
        if (ischild) {
            ui.helper.detach();
            $(".mod_lesson_pages").append(ui.helper);
            // ui.helper.offset({left: event.pageX, top: event.pageY});
            formatClusters();
        }
    };

    var formatClusters = function() {
        for (var lessonpageid in lessonobjects) {
            var currentobject = lessonobjects[lessonpageid];
            if (lessonobjects[lessonpageid].qtype === "30") {
                // We have a cluster. Now count how many children it has.
                var childcount = currentobject.clusterchildrenids.length;
                // console.log('child count ' + childcount);
                if (childcount === 0) {
                    childcount = 1;
                }
                var childwidth = 270;
                var childheight = 100;
                // var clusterwidth = $("#mod_lesson_page_element_" + lessonpageid).width();
                var clusterheight = $("#mod_lesson_page_element_" + lessonpageid).height();
                var newwidth = 0;
                var newheight = 0;
                
                if  (childcount > 3) {
                    newwidth = childwidth * 3;
                    newheight = clusterheight + (Math.ceil(childcount / 3) * childheight);
                } else {
                    newwidth = childwidth * childcount;
                    newheight = clusterheight + (childheight * 1);
                }

                // Adjust the cluster width.
                $("#mod_lesson_page_element_" + lessonpageid).width(newwidth);
                // Adjust the cluster height.
                $("#mod_lesson_page_element_" + lessonpageid).height(newheight);
                // Position children in the cluster.
                var originalx = $("#mod_lesson_page_element_" + lessonpageid).offset().left + 10;
                var startx = originalx;
                var starty = $("#mod_lesson_page_element_" + lessonpageid).offset().top + 80;
                for (var key in currentobject.clusterchildrenids) {
                    
                    if ((key % 3) === 0 && key !== "0") {
                        starty = starty + 110;
                        $("#mod_lesson_page_element_" + currentobject.clusterchildrenids[key]).offset({
                            top: starty,
                            left: originalx
                        });
                        startx = originalx + $("#mod_lesson_page_element_" + currentobject.clusterchildrenids[key]).width() + 30;
                    } else {
                        $("#mod_lesson_page_element_" + currentobject.clusterchildrenids[key]).offset({top: starty, left: startx});
                        startx = startx + $("#mod_lesson_page_element_" + currentobject.clusterchildrenids[key]).width() + 30;
                    }

                }
                $("#mod_lesson_page_element_" + lessonpageid).droppable({
                    drop: attachElement,
                    out: detachElement
                });
            }
        }
    };

    var replacecontent = function(event, ui) {
        pagetype = ui.helper.text();
        var htmlelement = "<div class='mod_lesson_menu_item'>" + pagetype + "</div>";
        $('.mod_lesson_menu').append(htmlelement);
        $(".mod_lesson_menu_item").draggable({
             stop: createLessonObject
        });
        // console.log('put another content object in the menu');
    };

    var createLessonObject = function(event, ui) {
        var pagetype = ui.helper.text();
        var qtype;
        switch(pagetype) {
            case "Content":
                qtype = "20";
                break;
            case "True False":
                qtype = "2";
                break;
            case "Numerical":
                qtype = "8";
                break;
            case "Multiple Choice":
                qtype = "3";
                break;
            default:
                qtype = "0";
                break;
        }
        
        if (!ui.helper.hasClass('mod_lesson_page_element')) {
            var lastoffset = ui.helper.offset();
            // console.log(lastoffset);
            ui.helper.addClass('mod_lesson_page_element');
            ui.helper.removeClass('mod_lesson_menu_item');

            var defaultdata = {
                title: 'Default title',
                contents: '',
                qtype: qtype,
                lessonid: lessonid,
                location: "normal",
                previouspageid: "0",
                nextpageid: "0",
                positionx: Math.round(lastoffset.left),
                positiony: Math.round(lastoffset.top)
            };

            // Try some ajax here.
            $.ajax({
                method: "POST",
                url: ajaxlocation,
                dataType: "json",
                data: {
                    action: "createcontent",
                    lessonid: lessonid,
                    lessondata: defaultdata
                }
            })
                .done(function(newobject) {

                    ui.helper.attr('id', 'mod_lesson_page_element_' + newobject.id);
                    var htmlelement = '<header id="mod_lesson_page_element_' + newobject.id + '">' + pagetype + '</header>';
                    htmlelement += '<div class="mod_lesson_page_body" id="mod_lesson_page_element_' + newobject.id + '"></div>';
                    htmlelement += '<img src="../../theme/image.php?theme=clean&component=core&image=t%2Fedit" class="mod_lesson_page_object_menu"></div>';
                    $("#mod_lesson_page_element_" + newobject.id).html(htmlelement);

                    // Add default information to the main lesson object.
                    newobject['jumpto[0]'] = '-1';
                    // newobject['jumpto[0]'] = newobject.nextpageid;
                    lessonobjects[newobject.id] = newobject;
                    lessonobjects[newobject.prevpageid].nextpageid = newobject.id;
                    // console.log(lessonobjects);

                    ui.helper.detach();
                    $('.mod_lesson_pages').append(ui.helper);
                    $("#mod_lesson_page_element_" + newobject.id).offset(lastoffset);
                    resetListeners();
                    drawalllines();
                })

                .fail(function(e) {
                    console.log(e);
                })
        }
        resetListeners();

    };

    /**
     * May need to be expanded to return the full record for the lesson page.
     */
    var getJumpOptions = function() {
        var jumpoptions = $.Deferred();

        var promise = $.ajax({
            method: "POST",
            url: ajaxlocation,
            dataType: "json",
            data: {
                action: "getjumpoptions",
                lessonid: lessonid
            }
        });

        promise.done(function(options) {
            // console.log(options);
            jumpoptions.resolve(options);
        });

        promise.fail(function(e) {
            console.log(e);
        });
        return jumpoptions.promise();
    };

    var openEditor = function(event) {
        event.preventDefault();
        event.stopPropagation();
        var elementid = $(this).parent().parent().parent().parent().attr('id');
        var pageids = elementid.split('_');
        var pageid = pageids[4];
        var jumpselectoptions = '';

        closeObjectMenus();

        $.when(getJumpOptions()).done(function(joptions){
            // Create a page for editing the content.
            var pageeditor = '<div class="mod_lesson_page_editor">';
            pageeditor += '<h3>Edit this lesson content page </h3>';
            pageeditor += '<div>Page title</div>';
            pageeditor += '<div><input type="text" id="mod_lesson_title" value="' + lessonobjects[pageid].title + '" /></div>';
            pageeditor += '<div>Page contents</div>';
            pageeditor += '<div><textarea id="mod_lesson_contents">' + lessonobjects[pageid].contents + '</textarea></div>';
            pageeditor += '<h4>Content 1</h4>';
            pageeditor += '<div>Jump name</div>';
            pageeditor += '<div><input type="text" id="jumpname" /></div>';
            pageeditor += '<div>Jump</div>';
            pageeditor += '<div><select id="mod_lesson_jump_select">';
            var jumpname = "jumpto[0]";
            $.each(joptions ,function(index, tmepspecial) {
                if (lessonobjects[pageid][jumpname] === index.toString()) {
                    pageeditor += '<option value="' + index + '" selected>' + tmepspecial.title + '</option>';
                } else {
                    pageeditor += '<option value="' + index + '">' + tmepspecial.title + '</option>';
                }
            });
            pageeditor += '</select></div>';
            pageeditor += '<div><button type="button" id="mod_lesson_editor_save_btn">Save</button>';
            pageeditor += '<button type="button" id="mod_lesson_editor_cancel_btn">Cancel</button></div>';
            pageeditor += '</div>';
            $('.mod_lesson_pages').append(pageeditor);
            $('#mod_lesson_editor_save_btn').click({pageid: pageid}, saveTheCheerleader);
            $('#mod_lesson_editor_cancel_btn').click(function() {
                $('.mod_lesson_page_editor').remove();
            });
        });
    };

    /**
     * Save edited lesson page content.
     */
    var saveTheCheerleader = function(event) {
        var record = {
            id: event.data.pageid,
            title: $('#mod_lesson_title').val()
        };

        // More ajax to save us all.
        $.ajax({
                method: "POST",
                url: ajaxlocation,
                dataType: "json",
                data: {
                    action: "updatelessonpage",
                    lessonid: lessonid,
                    lessondata: record
                }
        }).done(function(newobject) {
            $('#mod_lesson_page_element_' + record.id + '_body').html(record.title);
            $('.mod_lesson_page_editor').remove();
        });
    };

    var openObjectMenu = function(event) {

        if (!$(this).parent().children('.mod_lesson_page_object_menu_thing').length) {
            var menu = '<div class="mod_lesson_page_object_menu_thing">';
            menu += '<ul>';
            menu += '<li><a href="#" class="mod_lesson_page_edit">Edit</a></li>';
            menu += '<li><a href="#" class="mod_lesson_page_link">Link</a></li>';
            menu += '<li><a href="#" class="mod_lesson_page_delete">Delete</a></li>';
            menu += '</ul>';
            menu += '</div>';
            $(this).parent().append(menu);
            $('.mod_lesson_page_delete').on({
                click: deleteLessonPageObject
            });
            $('.mod_lesson_page_edit').on({
                click: openEditor
            });
            $('.mod_lesson_page_link').on({
                click: linkLessonPage
            });
        } else {
            $(this).parent().find('.mod_lesson_page_object_menu_thing').remove();
        }
    }

    var closeObjectMenus = function() {
        $('.mod_lesson_main').find('.mod_lesson_page_object_menu_thing').remove();
    };

    var deleteLessonPageObject = function(event) {
        event.preventDefault();
        var elementid = $(this).parents('.mod_lesson_page_element').attr('id');
        var pageids = elementid.split('_');
        var pageid = pageids[4];
        $.ajax({
            method: "POST",
            url: ajaxlocation,
            dataType: "json",
            data: {
                action: "deletelessonpage",
                lessonid: lessonid,
                pageid: pageid
            }
        })
            .done(function() {

            })

            .fail(function(e) {
                console.log(e);
            });
        $(this).parents('.mod_lesson_page_element').remove();
        closeObjectMenus();
        drawalllines();
    };

    var linkLessonPage = function(event) {
        event.preventDefault();
        event.stopPropagation();
        // Should use parents instead of a lot of parent.
        var elementid = $(this).parent().parent().parent().parent().attr('id');
        var pageids = elementid.split('_');
        var pageid = pageids[4];
        $('.mod_lesson_page_element').click({pageid: pageid}, actuallyLinkLessonPages);
        $('.mod_lesson_page_element').hover(hoverin, hoverout);
    };

    var hoverin = function() {
        $(this).css('background-color', 'blue');
    };

    var hoverout = function() {
        $(this).css('background-color', 'white');
    };

    var actuallyLinkLessonPages = function(event) {
        var objectid = this.id;
        var jumpids = objectid.split('_');
        var jumpid = jumpids[4];
        var pageid = event.data.pageid;
        $('.mod_lesson_page_element').unbind('click');
        $(this).css('background-color', 'white');
        $('.mod_lesson_page_element').off("mouseenter mouseleave");

        var lessondata = {
            pageid: pageid,
            jumpid: jumpid
        };

        // Go go ajax link and stuff.
        $.ajax({
            method: "POST",
            url: ajaxlocation,
            dataType: "json",
            data: {
                action: "linklessonpages",
                lessonid: lessonid,
                lessondata: lessondata
            }
        })
            .done(function(response) {
                var i = 0;
                var jumpname = "jumpto[" + i + "]";
                if (response === 'linked') {
                    while (lessonobjects[pageid].hasOwnProperty(jumpname)) {
                        i += 1;
                        jumpname = "jumpto[" + i + "]";
                    }
                    lessonobjects[pageid][jumpname] = jumpid;
                } else if (response === 'linked-type2') {
                    while (lessonobjects[pageid].hasOwnProperty(jumpname)) {
                        if (lessonobjects[pageid][jumpname] === "0" ) {
                            lessonobjects[pageid][jumpname] = 1;
                            break;
                        }
                        i += 1;
                        jumpname = "jumpto[" + i + "]";
                    }
                } else if (response === 'unlinked-type1') {
                    while (lessonobjects[pageid].hasOwnProperty(jumpname)) {
                        if (lessonobjects[pageid][jumpname] === jumpid ) {
                            delete lessonobjects[pageid][jumpname];
                            break;
                        }
                        i += 1;
                        jumpname = "jumpto[" + i + "]";
                    }
                } else {
                    // Special stuff has to happen here.
                    lessonobjects[pageid].nextpageid = "0";
                }
                drawalllines();
            })

            .fail(function(e) {
                console.log(e);
            });
        closeObjectMenus();

    };

    var resetListeners = function() {

        $(".mod_lesson_page_element").draggable({
            drag: drawalllines,
            stop: saveLocation
        });

        // Remove handler so that we don't double up with other elements.
        $(".mod_lesson_page_element").unbind('dblclick');
        $(".mod_lesson_page_object_menu").unbind('click');

        $(".mod_lesson_page_object_menu").on({
            click: openObjectMenu
        });        

        $(".mod_lesson_menu_item").draggable({
            stop: createLessonObject
        });

    };

    var saveLocation = function(event, ui) {
        // console.log(ui.helper.position());
        var lastposition = ui.helper.position();
        var elementid = this.id;
        var pageids = elementid.split('_');
        var pageid = pageids[4];
        var lessonobjectdata = {
            pageid: pageid,
            positionx: Math.round(lastposition.left),
            positiony: Math.round(lastposition.top)
        };

        // Try some ajax here.
        $.ajax({
            method: "POST",
            url: ajaxlocation,
            dataType: "json",
            data: {
                action: "saveposition",
                lessonid: lessonid,
                lessondata: lessonobjectdata
            }
        })
            .done(function() {
                // Not doing anything at the moment.
                // console.log('success');
            });
    };

    var setLessonPages = function() {
        for (elementid in lessonobjects) {
            // End of cluster elements have been removed from this form.
            if (lessonobjects[elementid].qtype !== "31") {
                var newx = lessonobjects[elementid].x;
                var newy = lessonobjects[elementid].y;
                var lessonelement = $("#mod_lesson_page_element_" + elementid);
                var parentelement = lessonelement.parent();
                lessonelement.position({
                    my: "left top",
                    at: "left+" + newx + " top+" + newy,
                    of: parentelement
                });
            }
        }
    };

    var setLessonData = function(lessonid, pageid) {
        // console.log(lessonid);
        // console.log(pageid);
        var tmepthing = $.Deferred();

        var lessondata = {
            pageid: pageid
        };

        var promise = $.ajax({
            method: "POST",
            url: ajaxlocation,
            dataType: "json",
            data: {
                action: "getlessondata",
                lessonid: lessonid,
                lessondata: lessondata
            }
        });

        promise.done(function(lessonpages) {
            tmepthing.resolve(lessonpages);
        });

        promise.fail(function(e) {
            console.log(e);
        });
        return tmepthing.promise();
    };

    return {

        init: function(llessonid, pageid) {
            lessonid = llessonid;
            $.when(setLessonData(llessonid, pageid)).done(function(data) {
                lessonobjects = data;
                console.log(lessonobjects);
                // lessonid = lessonobjects[firstelementid].lessonid;
                // Add end of lesson objects.
                // addEOL();
                // Format clusters.
                formatClusters();

                // Position all elements.
                setLessonPages();

                // Draw lines between all of the objects.
                drawalllines();

                // addMenu();
                resetListeners();

                $(".mod_lesson_menu").droppable({
                    out: replacecontent,
                    drop: function(event, ui) {
                        // console.log(ui.draggable);
                        ui.draggable.remove();
                    }
                });
            });
        }
    };
});