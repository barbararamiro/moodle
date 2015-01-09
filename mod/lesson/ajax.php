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
}
