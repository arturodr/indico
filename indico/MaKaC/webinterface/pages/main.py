# -*- coding: utf-8 -*-
##
##
## This file is part of Indico.
## Copyright (C) 2002 - 2012 European Organization for Nuclear Research (CERN).
##
## Indico is free software; you can redistribute it and/or
## modify it under the terms of the GNU General Public License as
## published by the Free Software Foundation; either version 3 of the
## License, or (at your option) any later version.
##
## Indico is distributed in the hope that it will be useful, but
## WITHOUT ANY WARRANTY; without even the implied warranty of
## MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
## General Public License for more details.
##
## You should have received a copy of the GNU General Public License
## along with Indico;if not, see <http://www.gnu.org/licenses/>.

import datetime
import MaKaC.webinterface.pages.base as base
import MaKaC.webinterface.wcomponents as wcomponents
import MaKaC.accessControl as accessControl
from MaKaC.common import timezoneUtils
import MaKaC.common.info as info
from MaKaC.common.utils import formatTime, formatDateTime
from MaKaC.i18n import _
from pytz import timezone
from MaKaC.conference import Category, Conference
from indico.modules import ModuleHolder

class WPMainBase(base.WPDecorated):

    def _createMenu( self ):
        self._showAdmin = self._isAdmin or self._isCategoryManager
        """
        This is no longer needed since the main page doesn't have a side
        menu, only the management pages

        minfo = info.HelperMaKaCInfo.getMaKaCInfoInstance()

        # Check if user is administrator
        adminList = accessControl.AdminList.getInstance()
        self._isAdmin = ( not adminList.getList() and self._getAW().getUser() != None ) or adminList.isAdmin( self._getAW().getUser() )
        self._isCategoryManager = isinstance(self._rh.getTarget(), Category) and self._rh.getTarget().canModify(self._getAW()) or \
                                  isinstance(self._rh.getTarget(), Conference) and self._rh.getTarget().getOwner().canModify(self._getAW())



        # pass the user status (logged in or out) to the menu
        self._leftMenu = wcomponents.SideMenu(self._getAW().getUser() != None)
#        minfo = info.HelperMaKaCInfo.getMaKaCInfoInstance()
#
#        # Check if user is administrator
#        adminList = accessControl.AdminList.getInstance()
#        self._isAdmin = ( not adminList.getList() and self._getAW().getUser() != None ) or adminList.isAdmin( self._getAW().getUser() )
#        self._isCategoryManager = isinstance(self._rh.getTarget(), Category) and self._rh.getTarget().canModify(self._getAW()) or \
#                                  isinstance(self._rh.getTarget(), Conference) and self._rh.getTarget().getOwner().canModify(self._getAW())
#        self._showAdmin = self._isAdmin or self._isCategoryManager
#
#
#        # pass the user status (logged in or out) to the menu
#        self._leftMenu = wcomponents.SideMenu(self._getAW().getUser() != None)
#
#        ### ADMINISTRATION ##
#
#        if self._showAdmin:
#            self._adminSection = wcomponents.SideMenuSection("Site Admin")
#            self._leftMenu.addSection(self._adminSection)
#
#            self._modifCategOpt = wcomponents.SideMenuItem("Modify Category", "")
#            self._adminSection.addItem( self._modifCategOpt)
#
#
#        ### WEBCAST ADMIN ###
#        wm = webcast.HelperWebcastManager.getWebcastManagerInstance()
#        showWebcastAdmin = wm.isManager( self._getAW().getUser() )
#        self._webcastAdminOpt = wcomponents.SideMenuItem("Webcast Admin",
#                                                            urlHandlers.UHWebcast.getURL(),
#                                                            enabled=showWebcastAdmin)
#        if showWebcastAdmin :
#            self._adminSection.addItem( self._webcastAdminOpt)
#
#
#        ### ALL USERS ##
#
#        #event section
#        self._evtSection = wcomponents.SideMenuSection("Event Management")
#
#        self._lectureOpt = wcomponents.SideMenuItem("Add Lecture", "")
#        self._meetingOpt = wcomponents.SideMenuItem("Add Meeting", "")
#        self._conferenceOpt = wcomponents.SideMenuItem("Add Conference", "")
#        #self._manageOpt = wcomponents.SideMenuItem("Manage Event", '')
#
#        self._evtSection.addItem( self._lectureOpt)
#        self._evtSection.addItem( self._meetingOpt)
#        self._evtSection.addItem( self._conferenceOpt)
#        #self._evtSection.addItem( self._manageOpt)
#
#        self._leftMenu.addSection(self._evtSection)



        ### ADMINISTRATION ##

        if self._showAdmin:
            self._adminSection = wcomponents.SideMenuSection("Site Admin")
            self._leftMenu.addSection(self._adminSection)

            self._modifCategOpt = wcomponents.SideMenuItem("Modify Category", "")
            self._adminSection.addItem( self._modifCategOpt)


        ### WEBCAST ADMIN ###
        wm = webcast.HelperWebcastManager.getWebcastManagerInstance()
        showWebcastAdmin = wm.isManager( self._getAW().getUser() )
        self._webcastAdminOpt = wcomponents.SideMenuItem("Webcast Admin",
                                                            urlHandlers.UHWebcast.getURL(),
                                                            enabled=showWebcastAdmin)
        if showWebcastAdmin :
            self._adminSection.addItem( self._webcastAdminOpt)


        ### ALL USERS ##

        #event section
        self._evtSection = wcomponents.SideMenuSection("Event Management")

        self._lectureOpt = wcomponents.SideMenuItem("Add Lecture", "")
        self._meetingOpt = wcomponents.SideMenuItem("Add Meeting", "")
        self._conferenceOpt = wcomponents.SideMenuItem("Add Conference", "")
        #self._manageOpt = wcomponents.SideMenuItem("Manage Event", '')

        self._evtSection.addItem( self._lectureOpt)
        self._evtSection.addItem( self._meetingOpt)
        self._evtSection.addItem( self._conferenceOpt)
        #self._evtSection.addItem( self._manageOpt)

        self._leftMenu.addSection(self._evtSection)
        """

    def _setCurrentMenuItem( self ):
        return

    def _display( self, params ):
        sideMenu = self._getSideMenu()
        self._setCurrentMenuItem()

        # Check if user is administrator
        adminList = accessControl.AdminList.getInstance()
        self._isAdmin = ( not adminList.getList() and self._getAW().getUser() != None ) or adminList.isAdmin( self._getAW().getUser() )
        self._isCategoryManager = self._isAdmin or \
                                  isinstance(self._rh.getTarget(), Category) and self._rh.getTarget().canModify(self._getAW()) or \
                                  isinstance(self._rh.getTarget(), Conference) and self._rh.getTarget().getOwnerList()!=[] and self._rh.getTarget().getOwner().canModify(self._getAW())
        self._showAdmin = self._isAdmin or self._isCategoryManager

        self._timezone = timezone(timezoneUtils.DisplayTZ(self._getAW()).getDisplayTZ())

        body = WMainBase(self._getBody( params ), self._timezone, self._getNavigationDrawer(),
                         isFrontPage=self._isFrontPage(), isRoomBooking=self._isRoomBooking(), sideMenu = sideMenu).getHTML({"subArea": self._getSiteArea()})

        return self._applyDecoration( body )

    def _getBody( self, params ):
        return _("nothing yet")

class WUpcomingEvents(wcomponents.WTemplated):

    def formatDateTime(self, dateTime):
        now = timezoneUtils.nowutc().astimezone(self._timezone)

        if dateTime.date() == now.date():
            return _("today") + " " + formatTime(dateTime.time())
        elif dateTime.date() == (now + datetime.timedelta(days=1)).date():
            return _("tomorrow") + " " + formatTime(dateTime.time())
        elif dateTime < (now + datetime.timedelta(days=6)):
            return formatDateTime(dateTime, format="EEEE H:mm")
        elif dateTime.date().year == now.date().year:
            return formatDateTime(dateTime, format="d MMM")
        else:
            return formatDateTime(dateTime, format="d MMM yyyy")

    def _getUpcomingEvents(self):
        # Just convert UTC to display timezone

        return map(lambda x: (x[0], x[1].astimezone(self._timezone), x[2], x[3]),
                   self._list)

    def getVars(self):
        vars = wcomponents.WTemplated.getVars(self)
        vars['upcomingEvents'] = self._getUpcomingEvents()
        return vars

    def __init__(self, timezone, upcoming_list):
        self._timezone = timezone
        self._list = upcoming_list
        wcomponents.WTemplated.__init__(self)

class WMainBase(wcomponents.WTemplated):

    def __init__(self, page, timezone, navigation=None, isFrontPage=False, isRoomBooking= False, sideMenu=None):
        self._page = page
        self._navigation = navigation
        self._isFrontPage = isFrontPage
        self._isRoomBooking = isRoomBooking
        self._timezone = timezone
        self._sideMenu = sideMenu

    def getVars(self):
        vars = wcomponents.WTemplated.getVars(self)
        minfo = info.HelperMaKaCInfo.getMaKaCInfoInstance()

        vars['body'] = self._escapeChars(self._page)
        vars["isFrontPage"] = self._isFrontPage
        vars["isRoomBooking"] = self._isRoomBooking

        vars["sideMenu"] = None
        if self._sideMenu:
            vars["sideMenu"] = self._sideMenu.getHTML()

        upcoming = ModuleHolder().getById('upcoming_events')

        # if this is the front page, include the
        # upcoming event information (if there are any)
        if self._isFrontPage:
            upcoming_list = upcoming.getUpcomingEventList()
            if upcoming_list:
                vars["upcomingEvents"] = WUpcomingEvents(self._timezone, upcoming_list).getHTML(vars)
            else:
                vars["upcomingEvents"] = ''

        vars["navigation"] = ""
        if self._navigation:
            vars["navigation"] = self._navigation.getHTML(vars)

        vars["timezone"] = self._timezone
        vars["isNewsActive"] = minfo.isNewsActive()

        return vars

