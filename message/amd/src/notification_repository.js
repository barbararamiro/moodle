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
 * Retrieves notifications from the server.
 *
 * @module     message/notification_repository
 * @class      notification_repository
 * @package    message
 * @copyright  2015 Ryan Wyllie <ryan@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @since      3.2
 */
define(['core/ajax', 'core/notification'], function(ajax, notification) {
    var query = function(args) {
        if (typeof args.limit === 'undefined') {
            args.limitnum = 20;
        } else {
            args.limitnum = args.limit;
            delete args.limit;
        }

        if (typeof args.offset === 'undefined') {
            args.limitfrom = 0;
        } else {
            args.limitfrom = args.offset;
            delete args.offset;
        }

        args.type = 'notifications';

        var request = {
            methodname: 'core_message_get_messages',
            args: args
        };

        var promise = ajax.call([request])[0];

        promise.fail(notification.exception);

        return promise;
    };

    return {
        query: query,
    };
});
