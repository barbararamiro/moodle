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
 * Test pandoc functionality.
 *
 * @package    core
 * @category   phpunit
 * @copyright  2016 Damyon Wiese
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();


/**
 * A set of tests for some of the pandoc functionality within Moodle.
 *
 * @package    core
 * @category   phpunit
 * @copyright  2016 Damyon Wiese
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class core_pandoc_testcase extends advanced_testcase {

    private $testfile1 = null;
    private $testfile2 = null;

    public function setUp() {
        $this->fixturepath = __DIR__ . DIRECTORY_SEPARATOR . 'fixtures' . DIRECTORY_SEPARATOR;

        $fs = get_file_storage();
        $filerecord = array(
            'contextid' => context_system::instance()->id,
            'component' => 'test',
            'filearea' => 'unittest',
            'itemid' => 0,
            'filepath' => '/',
            'filename' => 'test.html'
        );
        $teststring = file_get_contents($this->fixturepath . DIRECTORY_SEPARATOR . 'pandoc-source.html');
        $this->testfile1 = $fs->create_file_from_string($filerecord, $teststring);

        $filerecord = array(
            'contextid' => context_system::instance()->id,
            'component' => 'test',
            'filearea' => 'unittest',
            'itemid' => 0,
            'filepath' => '/',
            'filename' => 'test.docx'
        );
        $teststring = file_get_contents($this->fixturepath . DIRECTORY_SEPARATOR . 'pandoc-source.docx');
        $this->testfile2 = $fs->create_file_from_string($filerecord, $teststring);

        $this->resetAfterTest();
    }

    public function test_generate_pdf() {
        global $CFG;

        if (empty($CFG->pathtopandoc) || !is_executable(trim($CFG->pathtopandoc))) {
            // No conversions are possible, sorry.
            return $this->markTestSkipped();
        }
        $fs = get_file_storage();

        $result = $fs->get_converted_document($this->testfile1, 'pdf');
        $this->assertSame($result->get_mimetype(), 'application/pdf');
        $this->assertGreaterThan(0, $result->get_filesize());
        $result = $fs->get_converted_document($this->testfile2, 'pdf');
        $this->assertSame($result->get_mimetype(), 'application/pdf');
        $this->assertGreaterThan(0, $result->get_filesize());
    }

    public function test_generate_markdown() {
        global $CFG;

        if (empty($CFG->pathtopandoc) || !is_executable(trim($CFG->pathtopandoc))) {
            // No conversions are possible, sorry.
            return $this->markTestSkipped();
        }
        $fs = get_file_storage();

        $result = $fs->get_converted_document($this->testfile1, 'md');
        $this->assertSame($result->get_mimetype(), 'text/plain');
        $this->assertGreaterThan(0, $result->get_filesize());
        $result = $fs->get_converted_document($this->testfile2, 'md');
        $this->assertSame($result->get_mimetype(), 'text/plain');
        $this->assertGreaterThan(0, $result->get_filesize());
    }
}
