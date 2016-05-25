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
 * Controls the notification menu in the nav bar.
 *
 * See template: message/notification_menu
 *
 * @module     message/notification_menu_controller
 * @class      notification_menu_controller
 * @package    message
 * @copyright  2015 Ryan Wyllie <ryan@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @since      3.2
 */
define(['jquery', 'core/ajax', 'core/templates', 'core/str'],
        function($, ajax, templates, str) {

    var NotificationMenuController = function(element) {
        this.root = $(element);
        this.menuToggle = this.root.find('.nav-icon');

        this.registerEventListeners();
    };

    NotificationMenuController.prototype.toggleMenu = function() {
        this.root.toggleClass('collapsed');
    };

    NotificationMenuController.prototype.closeMenu = function() {
        this.root.addClass('collapsed');
    };

    NotificationMenuController.prototype.registerEventListeners = function() {
        this.menuToggle.click(function(e) {
            this.toggleMenu();
        }.bind(this));

        $('html').click(function(e) {
            var target = $(e.target);
            if (!this.root.is(target) && !this.root.has(target).length) {
                this.closeMenu();
            }
        }.bind(this));
    };

    return NotificationMenuController;
});
