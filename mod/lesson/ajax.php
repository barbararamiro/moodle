<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Process ajax requests
 *
 * @package mod_assign
 * @copyright  2015 Adrian Greeve <adrian@moodle.com>
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);

require('../../config.php');
require_once($CFG->dirroot . '/mod/lesson/locallib.php');

$action = optional_param('action', '', PARAM_ALPHANUM);
$lessonid = optional_param('lessonid', '', PARAM_ALPHANUM); // Definitely need this.
$pageid = optional_param('pageid', '', PARAM_RAW);
$pagex = optional_param('pagex', '', PARAM_RAW);
$pagey = optional_param('pagey', '', PARAM_RAW);
$lessondata = optional_param_array('lessondata', '', PARAM_RAW);


$pagecookie = new stdClass();
if (isset($_COOKIE['pageinfo'])) {
    $pagecookie = json_decode($_COOKIE['pageinfo']);
}
// var_dump($pagecookie);

if ($action == 'saveposition') {

    $record = new stdClass();
    $record->id = $lessondata['pageid'];
    $record->positionx = $lessondata['positionx'];
    $record->positiony = $lessondata['positiony'];
    $DB->update_record('lesson_pages', $record);

    $response = 'this was a success!';
    echo json_encode($response);
    die();
} else if ($action == 'createcontent') {
    // Find record with zero as the previous page.
    $lastfile = $DB->get_record('lesson_pages', array('lessonid' => $lessonid, 'nextpageid' => 0));

    $lessondata['timecreated'] = time();
    $lessondata['prevpageid'] = $lastfile->id;
    // Instead of direct call, we need to use the API. With that in mind, we will probably end up using web services anyway.
    $insertid = $DB->insert_record('lesson_pages', $lessondata);

    $lastfile->nextpageid = $insertid;
    $DB->update_record('lesson_pages', $lastfile);

    // Also need an entry in lesson_answers.
    $lessonanswerrecord = new stdClass();
    $lessonanswerrecord->lessonid = $lessonid;
    $lessonanswerrecord->pageid = $insertid;
    $lessonanswerrecord->jumpto = -1;
    $lessonanswerrecord->timecreated = time();
    $lessonanswerrecord->answer = 'Next page';
    $DB->insert_record('lesson_answers', $lessonanswerrecord);

    // Don't do this. Use the lesson_page::get_type
    if ((int)$lessondata['qtype'] < 10) {
        // Also need an entry in lesson_answers.
        $lessonanswerrecord = new stdClass();
        $lessonanswerrecord->lessonid = $lessonid;
        $lessonanswerrecord->pageid = $insertid;
        $lessonanswerrecord->jumpto = 0;
        $lessonanswerrecord->timecreated = time();
        $lessonanswerrecord->answer = 'This page';
        $DB->insert_record('lesson_answers', $lessonanswerrecord);
    }  

    // Also need an entry in lesson_answers.
    // $lessonanswerrecord = new stdClass();
    // $lessonanswerrecord->lessonid = $lessonid;
    // $lessonanswerrecord->pageid = $lastfile->id;
    // $lessonanswerrecord->jumpto = $insertid;
    // $lessonanswerrecord->timecreated = time();
    // $lessonanswerrecord->answer = 'Next page';
    // $DB->insert_record('lesson_answers', $lessonanswerrecord);

    // Get the complete record and send that back.
    $lessonpage = $DB->get_record('lesson_pages', array('id' => $insertid));
    // $lessonpage->jumpto = array($lessonpage->nextpageid);
    
    echo json_encode($lessonpage);
    die();
} else if ($action == 'deletelessonpage') {

    $lesson = lesson::load($lessonid);
    $lessonpage = lesson_page::load($pageid, $lesson);
    $lessonpage->delete();

    // Delete lesson page
    echo json_encode('deleted');
    die();
} else if ($action == 'linklessonpages') {

    // See if we have a record for this already. Perhaps we should be removing the link.
    $lessonanswer1 = $DB->get_record('lesson_answers', array('pageid' => $lessondata['pageid'], 'jumpto' => $lessondata['jumpid']));

    $sql = "SELECT la.id, la.jumpto
              FROM mdl_lesson_answers la, mdl_lesson_pages lp
             WHERE la.pageid = lp.id
               AND (lp.id = :pageid AND lp.nextpageid = :jumpid AND la.jumpto = -1)";
    $params = array('pageid' => $lessondata['pageid'], 'jumpid' => $lessondata['jumpid']);
    $lessonanswer2 = $DB->get_record_sql($sql, $params);

    if ($lessonanswer1) {
        $DB->delete_records('lesson_answers', array('id' => $lessonanswer1->id));
        echo json_encode('unlinked-type1');
    } else if ($lessonanswer2) {
        $lessonanswer2->jumpto = 0;
        $DB->update_record('lesson_answers', $lessonanswer2);
        echo json_encode('unlinked-type2');
    } else {
        // Check to see if there is a jumpto 0 and update that record first.
        if ($record = $DB->get_record('lesson_answers', array('lessonid' => $lessonid, 'pageid' => $lessondata['pageid'], 'jumpto' => 0))) {
            $record->jumpto = $lessondata['jumpid'];
            $DB->update_record('lesson_answers', $record);
            echo json_encode('linked-type2');
        } else {
            $record = new stdClass();
            $record->pageid = $lessondata['pageid'];
            $record->lessonid = $lessonid;
            $record->jumpto = $lessondata['jumpid'];
            $record->timecreated = time();
            $record->answer = 'jump to ' . $lessondata['jumpid'];
            $DB->insert_record('lesson_answers', $record);
            echo json_encode('linked');
        }

    }

    die();
} else if ($action == 'getjumpoptions') {
    $options = $DB->get_records('lesson_pages', array('lessonid' => $lessonid), '','id,title');
    $options[0] = new stdClass();
    $options[0]->id = 0;
    $options[0]->title = 'This page';
    $options[1] = new stdClass();
    $options[1]->id = 1;
    $options[1]->title = 'Next page';
    // var_dump($options);
    echo json_encode($options);
    die();
} else if ($action == 'getlessondata') {
    $pageid = $lessondata['pageid'];
    $lesson = lesson::load($lessonid);
    $pages = array();
    $clusters = array();
    $clustercount = 0;
    $currentclusterid = 0;
    while ($pageid != 0) {
        $page = $lesson->load_page($pageid);
        if ($clustercount) {
            if ($page->qtype == 31) {
                $clustercount --;
            } else {
                $clusters[$currentclusterid][] = $pageid;
            }
        }
        if ($page->qtype == 30) {
            $clusters[$pageid] = array(); 
            $clustercount ++;
            $currentclusterid = $pageid;
        }
        $pageproperties = $page->properties();
        $pageproperties->qtypestr = $page->get_typestring();

        $pageproperties->x = $page->positionx;
        $pageproperties->y = $page->positiony;

        if ($clustercount) {
            $pageproperties->location = 'cluster';
        } else {
            $pageproperties->location = 'normal';
        }

        // Add the cluster id to the cluster end object.
        if ($page->qtype == 31) {
            $pageproperties->clusterid = $currentclusterid;
        }
        $pages[$pageid] = $pageproperties;
        $pageid = $page->nextpageid;
    }
    foreach ($clusters as $key => $value) {
        $pages[$key]->clusterchildrenids = $value;
    }
    // Reindex the array for use with YUI.
    echo json_encode($pages);
    die();
} else if ($action == 'updatelessonpage') {
    // var_dump($lessondata);
    $DB->update_record('lesson_pages', $lessondata);
    echo json_encode($lessondata);
    die();
}
