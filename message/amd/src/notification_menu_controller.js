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
define(['jquery', 'core/ajax', 'core/templates', 'core/str', 'core/notification', 'message/notification_repository'],
        function($, ajax, templates, str, debugNotification, notificationRepo) {

    var NotificationMenuController = function(element) {
        this.root = $(element);
        this.content = this.root.find('.menu-content');
        this.contentContainer = this.root.find('.menu-content-container');
        this.menuToggle = this.root.find('.nav-icon');
        this.limit = 20;
        this.offset = 0;
        this.unreadCount = 0;
        this.isLoading = false;
        this.hasLoadedAllNotifications = false;
        this.initialLoad = false;

        this.registerEventListeners();
        this.loadNotificationCount();
    };

    NotificationMenuController.prototype.toggleMenu = function() {
        this.root.toggleClass('collapsed');

        if (!this.initialLoad) {
            this.loadMoreNotifications();
        }
    };

    NotificationMenuController.prototype.closeMenu = function() {
        this.root.addClass('collapsed');
    };

    NotificationMenuController.prototype.startLoading = function() {
        this.isLoading = true;
        this.contentContainer.addClass('loading');
    };

    NotificationMenuController.prototype.stopLoading = function() {
        this.isLoading = false;
        this.contentContainer.removeClass('loading');
    };

    NotificationMenuController.prototype.renderUnreadCount = function() {
        var element = this.root.find('.count-container');

        if (this.unreadCount) {
            element.text(this.unreadCount);
            element.removeClass('hidden');
        } else {
            element.addClass('hidden');
        }
    };

    NotificationMenuController.prototype.renderNotifications = function(notifications) {
        $.each(notifications, function(index, notification) {
            templates.render('message/notification_menu_item', notification).done(function(html, js) {
                this.content.append(html);
                templates.runTemplateJS(js);
            }.bind(this));
        }.bind(this));
    };

    NotificationMenuController.prototype.loadNotificationCount = function() {
        notificationRepo.countUnread({useridto: this.root.attr('data-userid')}).then(function(count) {
            this.unreadCount = count;
            this.renderUnreadCount();
        }.bind(this));
    };

    NotificationMenuController.prototype.loadMoreNotifications = function() {
        if (this.isLoading || this.hasLoadedAllNotifications) {
            return $.Deferred().promise.resolve();
        }

        this.startLoading();

        var promise = notificationRepo.query({
            limit: this.limit,
            offset: this.offset,
            useridto: this.root.attr('data-userid'),
        }).then(function(result) {
            var notifications = result.notifications;
            this.unreadCount = result.unreadcount;
            this.renderUnreadCount();

            if (!notifications.length || notifications.length < this.limit) {
                this.hasLoadedAllNotifications = true;
            } else {
                this.renderNotifications(notifications);
                this.offset += this.limit;
            }
        }.bind(this))
        .fail(debugNotification.exception)
        .always(function() { this.stopLoading() }.bind(this));

        return promise;
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

        this.contentContainer.scroll(function(e) {
             if (!this.isLoading && !this.hasLoadedAllNotifications) {
                var scrollTop = this.contentContainer.scrollTop();
                var innerHeight = this.contentContainer.innerHeight();
                var scrollHeight = this.contentContainer[0].scrollHeight;

                if (scrollTop + innerHeight >= scrollHeight) {
                    this.loadMoreNotifications();
                }
             }
         }.bind(this));

        this.root.on('click', '.menu-content-item-container', function(e) {
            var container = $(e.target).closest('.menu-content-item-container');
            container.toggleClass('expanded');
        });
    };

    return NotificationMenuController;
});
