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

"""
Event-related utils
"""

import re
from MaKaC import conference

UID_RE = re.compile(r'^(?P<event>\w+)(?:\.s(?P<session>\w+))?(?:\.(?P<contrib>\w+))?(?:\.(?P<subcont>\w+))?$')


def uniqueId(obj):
    ret = obj.getId()

    if isinstance(obj, conference.Contribution):
        ret = "%s.%s" % (obj.getConference().getId(), ret)
    elif isinstance(obj, conference.SubContribution):
        ret = "%s.%s.%s" % (obj.getConference().getId(),
                          obj.getContribution().getId(), ret)
    elif isinstance(obj, conference.Session):
        ret = "%s.s%s" % (obj.getConference().getId(), ret)
    elif isinstance(obj, conference.SessionSlot):
        ret = "%s.s%s.%s" % (obj.getConference().getId(),
                             obj.getSession().getId(), ret)
    elif isinstance(obj, conference.Material):
        ret = "%sm%s" % (uniqueId(obj.getOwner()), ret)
    elif isinstance(obj, conference.Resource):
        ret = "%s.%s" % (uniqueId(obj.getOwner()), ret)

    return ret


def uid_to_obj(uid):
    m = UID_RE.match(uid)
    if not m:
        return m
    else:
        d = m.groupdict()
        obj = conference.ConferenceHolder().getById(d['event'])
        if 'session' in d:
            obj = obj.getSessionById(d['session'])
        if 'contrib' in d:
            obj = obj.getContributionById(d['contrib'])
        if 'subcont' in d:
            obj = obj.getSubContributionById(d['subcont'])

        return obj
