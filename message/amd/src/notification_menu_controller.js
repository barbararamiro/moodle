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
define(['jquery', 'theme_bootstrapbase/bootstrap', 'core/ajax', 'core/templates', 'core/str', 'core/notification', 'message/notification_repository'],
        function($, bootstrap, ajax, templates, str, debugNotification, notificationRepo) {

    var NotificationMenuController = function(element) {
        this.root = $(element);
        this.content = this.root.find('.menu-content');
        this.contentContainer = this.root.find('.menu-content-container');
        this.menuToggle = this.root.find('.nav-icon');
        this.markAllReadButton = this.root.find('#mark-all-read-button');
        this.unreadCount = 0;
        this.isLoading = false;
        this.userId = this.root.attr('data-userid');
        this.modeToggle = this.root.find('.menu-header-actions .fancy-toggle');
        this.config = {
            unread: {
                container: this.content.find('.unread-notifications'),
                limit: 20,
                offset: 0,
                loadedAll: false,
                initialLoad: false,
            },
            all: {
                container: this.content.find('.all-notifications'),
                limit: 20,
                offset: 0,
                loadedAll: false,
                initialLoad: false,
            }
        };

        this.registerEventListeners();
        this.loadUnreadNotificationCount();
        this.root.find('[data-toggle="tooltip"]').tooltip();
    };

    NotificationMenuController.prototype.toggleMenu = function() {
        if (this.root.hasClass('collapsed')) {
            this.openMenu();
        } else {
            this.closeMenu();
        }
    };

    NotificationMenuController.prototype.closeMenu = function() {
        this.root.addClass('collapsed');
        this.renderUnreadCount();
        this.clearUnreadNotifications();
    };

    NotificationMenuController.prototype.openMenu = function() {
        this.root.removeClass('collapsed');
        this.hideUnreadCount();

        if (!this.hasDoneInitialLoad()) {
            this.loadMoreNotifications();
        }
    };

    NotificationMenuController.prototype.unreadOnlyMode = function() {
        return this.modeToggle.hasClass('on');
    };

    NotificationMenuController.prototype.getConfig = function() {
        if (this.unreadOnlyMode()) {
            return this.config.unread;
        } else {
            return this.config.all;
        }
    };

    NotificationMenuController.prototype.getOffset = function() {
        return this.getConfig().offset;
    };

    NotificationMenuController.prototype.incrementOffset = function() {
        // Only need to increment offset if we're combining read and unread
        // because all unread messages are marked as read when we retrieve them
        // which acts as the result set increment for us.
        if (!this.unreadOnlyMode()) {
            this.getConfig().offset += this.getConfig().limit;
        }
    };

    NotificationMenuController.prototype.resetOffset = function() {
        this.getConfig().offset = 0;
    };

    NotificationMenuController.prototype.getNotificationsContainer = function() {
        return this.getConfig().container;
    };

    NotificationMenuController.prototype.hasDoneInitialLoad = function() {
        return this.getConfig().initialLoad;
    };

    NotificationMenuController.prototype.hasLoadedAllNotifications = function() {
        return this.getConfig().loadedAll;
    };

    NotificationMenuController.prototype.setLoadedAllNotifications = function(val) {
        this.getConfig().loadedAll = val;
    };

    NotificationMenuController.prototype.clearUnreadNotifications = function() {
        this.config.unread.offset = 0;
        this.config.unread.loadedAll = false;
        this.config.unread.initialLoad = false;
        this.config.unread.container.empty();
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

    NotificationMenuController.prototype.hideUnreadCount = function() {
        this.root.find('.count-container').addClass('hidden');
    };

    NotificationMenuController.prototype.loadUnreadNotificationCount = function() {
        notificationRepo.countUnread({useridto: this.userId}).then(function(count) {
            this.unreadCount = count;
            this.renderUnreadCount();
        }.bind(this));
    };

    NotificationMenuController.prototype.renderNotifications = function(notifications, container) {
        var promises = [];

        if (notifications.length) {
            $.each(notifications, function(index, notification) {
                var promise = templates.render('message/notification_menu_item', notification);
                promise.then(function(html, js) {
                    container.append(html);
                    templates.runTemplateJS(js);
                }.bind(this));

                promises.push(promise);
            }.bind(this));
        }

        return $.when.apply($.when, promises);
    };

    NotificationMenuController.prototype.loadMoreNotifications = function() {
        if (this.isLoading || this.hasLoadedAllNotifications()) {
            return $.Deferred().resolve();
        }

        this.startLoading();
        var request = {
            limit: this.limit,
            offset: this.getOffset(),
            useridto: this.userId,
            markasread: true,
            embeduserto: false,
            embeduserfrom: true,
        };

        if (this.unreadOnlyMode()) {
            request.status = 'unread';
        }

        var container = this.getNotificationsContainer();
        var promise = notificationRepo.query(request).then(function(result) {
            var notifications = result.notifications;
            this.unreadCount = result.unreadcount;
            this.setLoadedAllNotifications(!notifications.length || notifications.length < this.limit);
            this.getConfig().initialLoad = true;

            if (notifications.length) {
                this.incrementOffset();
                return this.renderNotifications(notifications, container);
            }
        }.bind(this))
        .always(function() { this.stopLoading() }.bind(this));

        return promise;
    };

    NotificationMenuController.prototype.markAllAsRead = function() {
        this.markAllReadButton.addClass('loading');

        return notificationRepo.markAllAsRead({useridto: this.userId})
            .then(function() {
                this.unreadCount = 0;
                this.clearUnreadNotifications();
            }.bind(this))
            .always(function() { this.markAllReadButton.removeClass('loading') }.bind(this));
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
             if (!this.isLoading && !this.hasLoadedAllNotifications()) {
                var scrollTop = this.contentContainer.scrollTop();
                var innerHeight = this.contentContainer.innerHeight();
                var scrollHeight = this.contentContainer[0].scrollHeight;

                if (scrollTop + innerHeight >= scrollHeight) {
                    this.loadMoreNotifications();
                }
             }
         }.bind(this));

        this.root.on('click', '.show-button', function(e) {
            var container = $(e.target).closest('.menu-content-item-container');
            container.addClass('expanded');
            e.preventDefault();
        });

        this.root.on('click', '.hide-button', function(e) {
            var container = $(e.target).closest('.menu-content-item-container');
            container.removeClass('expanded');
            e.preventDefault();
        });

        this.modeToggle.click(function(e) {
            if (this.modeToggle.hasClass('on')) {
                this.clearUnreadNotifications();
                this.modeToggle.removeClass('on');
                this.modeToggle.addClass('off');
                this.root.removeClass('unread-only');
            } else {
                this.modeToggle.removeClass('off');
                this.modeToggle.addClass('on');
                this.root.addClass('unread-only');
            }

            if (!this.hasDoneInitialLoad()) {
                this.loadMoreNotifications();
            }
        }.bind(this));

        this.markAllReadButton.click(function(e) {
            this.markAllAsRead();
        }.bind(this));
    };

    return NotificationMenuController;
});
