include("http://maps.google.com/maps/api/js?sensor=false");

/**
 * A Google Map of rooms.
 */
type ("RoomMap", ["IWidget"],
    {
        initialize: function(mapCanvas, aspectsCanvas, filterCanvas, aspects, buildings, filters) {
            this.initData(aspects, buildings, filters);
            this.createMap(mapCanvas);
            this.initializeBounds();
            this.createAspectChangeLinks(aspectsCanvas);
            this.createBuildingMarkers();
            this.createFilters(filterCanvas);
            this.setDefaultFilterValues();
            this.updateFiltersState();
            this.filterMarkers();
        },

        initData: function(aspects, buildings, filters) {
            this.aspects = aspects;
            this.buildings = buildings;
            this.filters = filters;

            // save a reference to the building number filter
            for (var i = 0; i < filters.length; i++) {
                var filter = filters[i];
                if (filter.filterType == 'building' && filter.property == 'number') {
                    this.buildingNumberFilter = filter;
                }
            }
        },

        createMap: function(mapCanvas) {
            this.markers = [];

            // map options
            var options = {
              zoom: 17,
              mapTypeId: google.maps.MapTypeId.HYBRID
            };

            // Google Maps API setup
            this.map = new google.maps.Map(mapCanvas, options);
            google.maps.event.addListener(this.map, "click", this.createMapClickHandler());
        },

        createMapClickHandler: function() {
            var self = this;
            return function() {
                self.closeTooltips();
                self.closeInfoBaloon();
            }
        },

        createBuildingMarkers: function() {
            for (var i in this.buildings) {
                var building = this.buildings[i];
                building.point = new google.maps.LatLng(building.latitude, building.longitude);

                // create marker for the building
                var marker = new google.maps.Marker({
                    position: building.point,
                    map: this.map,
                    visible: false
                });

                // the building and marker reference each-other
                marker.building = building;
                building.marker = marker;

                // when the marker is clicked, open the info window
                marker.onClick = this.createMarkerClickHandler(marker);
                google.maps.event.addListener(marker, "click", marker.onClick);

                this.markers.push(marker);
            }
        },

        createMarkerClickHandler: function(marker) {
            var self = this;
            return function() {
                // it the info baloon is shown for a first time, create it
                if (!exists(marker.infoWindow)) {
                    var info = self.createBuildingInfo(marker.building);
                    marker.infoWindow = new google.maps.InfoWindow({content: info});
                }

                // closed the tooltips and info baloon
                self.closeInfoBaloon();
                self.closeTooltips();

                // show the info baloon
                self.activeInfoWindow = marker.infoWindow;
                marker.infoWindow.open(self.map, marker);
            }
        },

        closeInfoBaloon: function() {
            // if a info baloon is shown, close it
            if (exists(this.activeInfoWindow)) {
                this.activeInfoWindow.close();
                this.activeInfoWindow = null;
            }
        },

        closeTooltips: function() {
            domTT_closeAll();
        },

        setSelectedAspectStyle: function(link) {
            // unselect the previous selected link (if any)
            if (this.selectedLink) {
                this.selectedLink.dom.className = this.constructAspectCss(false);
            }

            // select the clicked link
            this.selectedLink = link;
            link.dom.className = this.constructAspectCss(true);
        },

        createAspectChangeFunction: function(aspect, link) {
            var self = this;
            // execute this every time the user clicks on some aspect and changes the visible map area
            return function() {
                self.closeTooltips();
                self.map.setCenter(new google.maps.LatLng(aspect.centerLatitude, aspect.centerLongitude));
                self.map.setZoom(parseInt(aspect.zoomLevel));
                self.setSelectedAspectStyle(link);
            }
        },

        constructBrowserSpecificCss: function() {
            return this.isBrowserIE7() ? 'browserIE7' : 'browserDefault';
        },

        constructAspectCss: function (selected) {
            var selectionClass = selected ? 'mapAspectSelected' : 'mapAspectUnselected';
            return 'mapAspectsItem ' + selectionClass;
        },

        createAspectChangeLinks: function(aspectsCanvas) {
            var links = Html.ul({className:'mapAspectsList'}).dom;
            for (var i = 0; i < this.aspects.length; i++) {
                var aspect = this.aspects[i];

                // construct a link that changes the map aspect if clicked
                var link = Html.a({'href': '#', className: this.constructAspectCss(false)}, aspect.name);
                var itemClassName = i == 0 ? 'first ' : i == this.aspects.length - 1 ? 'last ' : '';
                var item = Html.li({className:itemClassName + this.constructBrowserSpecificCss()}, link.dom);
                var aspectChangeFunction = this.createAspectChangeFunction(aspect, link);

                // store the link for the aspect
                aspect.link = link;

                // if the aspect is a default one, apply it on start
                if (aspect.defaultOnStartup) {
                    aspectChangeFunction();
                }

                // on click, apply the clicked aspect on the map
                link.observeClick(aspectChangeFunction);

                links.appendChild(item.dom);
            }
            aspectsCanvas.appendChild(links);
        },

        createRoomInfo: function(building, room) {
            var self = this;
            var address = building.number + '/' + room.floor + '-' + room.roomNr;

            // caption
            var caption = Html.span({}, $T("Room") + ' ' + address);

            // room address
            var addr = Html.span({className:'mapRoomAddress'}, address).dom;

            // "Book" link
            var book = Html.a({href:room.bookingUrl, target:'_parent', className:'mapBookRoomLink'}, $T("Book"));

            // "More" link - for room details
            var more = Html.a({href:"#", className:'mapRoomInfoLink'}, $T("More") + "...");

            // "Room details" link
            var details = Html.a({href:room.detailsUrl, target:'_parent'}, $T("Details") + "...");
            details = Html.span({className:'mapRoomDetailsLink'}, details);

            // room details elements
            title = Html.table({className: 'mapRoomTooltipTitle', width: '100%', cellpadding: 0, cellspacing: 0}, Html.tbody({}, Html.tr({}, Html.td({width: '75%'}, caption.dom), Html.td({width: '25%'}, details.dom))));

            var img = Html.img({src: room.tipPhotoURL, width: 212, height: 140, className: 'mapRoomTooltipImage'});
            var desc = Html.div({className: 'mapRoomTooltipDescription'}, room.markerDescription);
            var all = Widget.lines([img, desc]);
            var help = Html.div({className: 'tip'}, all.dom);

            // when the "More" link is clicked, show a tooltip with room details
            more.observeClick(function(event) {
                self.closeTooltips();
                var closeLink = Html.span({className: 'mapRoomTooltipClose'}, 'x');
                domTT_activate(more.dom, event, 'content', help.dom, 'maxWidth', 223, 'type', 'sticky', 'caption', title.dom, 'closeLink', closeLink.dom);
            });

            var roomInfo = Html.p({className:'mapRoomInfo'}, addr, ' - ', book.dom, more.dom);
            return roomInfo.dom;
        },

        createBuildingInfo: function(building) {
            // the building title
            var title = Html.p({className:'mapBuildingTitle'}, building.title).dom;

            // the div containing info about rooms
            var roomsInfo = Html.div({className:'mapRoomsInfo'}).dom;

            // add info for each room
            for (var j = 0; j < building.rooms.length; j++) {
                var room = building.rooms[j];
                if (room.showOnMap) {
                    var roomInfo = this.createRoomInfo(building, room);
                    roomsInfo.appendChild(roomInfo);
                }
            }

            // building info box
            var buildingInfo = Html.div({className:'mapBuildingInfo'}, title, roomsInfo);
            return buildingInfo.dom;
        },

        showMarkers: function() {
            var bounds = this.map.getBounds();
            var inBoundsCount = 0;

            // 'alone' building - a bulding that is displayed alone on the screen
            var aloneBuilding = null;

            // 'exact' building - a building whose number was entered in the building filter
            var exactBuilding = null;

            // if a building number filter exists, get its value
            var exactBuildingNumber = null;
            if (this.buildingNumberFilter) {
                exactBuildingNumber = this.getFilterValue(this.buildingNumberFilter);
            }

            for (var i = 0; i < this.buildings.length; i++) {
                var building = this.buildings[i];
                this.boundCounters[i] = 0;

                // if the building is filtered as visible on map
                if (building.showOnMap) {
                    // if only 1 building is visible - that's the 'alone' building
                    if (this.visibleBuildingsCount == 1) {
                        aloneBuilding = building;
                    }

                    // if the building number is entered in the building filter, that's the 'exact' building
                    if (exactBuildingNumber != null && building.number == exactBuildingNumber) {
                        exactBuilding = building;
                    }

                    // initialize the marker aspect and info
                    var pos = new google.maps.LatLng(building.latitude, building.longitude);

                    // count the number of rooms in each of the aspect areas
                    for (var j = 0; j < this.bounds.length; j++) {
                        if (this.bounds[j].contains(pos)) {
                            this.boundCounters[j] += building.visibleRoomsSize;
                        }
                    }
                }

                // show only the filtered buildings
                building.marker.setVisible(building.showOnMap);
            }

            // if an 'exact' building if found, show it in the center of the map
            if (exactBuilding != null) {
                var center = new google.maps.LatLng(exactBuilding.latitude, exactBuilding.longitude);
                this.map.setCenter(center);
            }

            // if an 'alone' building if found, show its info baloon
            if (aloneBuilding != null) {
                aloneBuilding.marker.onClick();
            }

        },

        getFilterPropertyOptions: function(filter) {
            var options = [];
            function addOption(option) {
                if (options.indexOf(option) < 0) options.push(option);
            }

            for (var i = 0; i < this.buildings.length; i++) {
                var building = this.buildings[i];
                if (filter.filterType == 'building') {
                    addOption(building[filter.property]);
                } else {
                    for (var j = 0; j < building.rooms.length; j++) {
                        var room = building.rooms[j];
                        addOption(room[filter.property]);
                    }
                }
            }

            return options;
        },

        updateFiltersState: function() {
            for (var i = 0; i < this.filters.length; i++) {
                var filter = this.filters[i];

                // the corresponding function calculates if the filter input is enabled (default: yes)
                filter.enabled = !exists(filter.enabledIf) || filter.enabledIf(this);
                filter.input.dom.disabled = !filter.enabled;

                // the corresponding function calculates if the filter is active (default: yes)
                filter.active = !exists(filter.activeIf) || filter.activeIf(this);
            }
        },

        createFilterWidget: function(filter) {
            // value type
            var input;
            if (filter.inputType == 'text' || filter.inputType == 'subtext') {
                // text input for text and sub-text filters
                input = Html.input('text', {className: 'mapFilterTextbox'});
            } else if (filter.inputType == 'boolean') {
                // checkbox input for boolean filters
                input = Html.checkbox({className: 'mapFilterCheckbox'});
            } else if (filter.inputType == 'list_contains') {
                // checkbox input for 'list containts' filters
                input = Html.checkbox({className: 'mapFilterCheckbox'});
            } else if (filter.inputType == 'hidden') {
                // no input for hidden filters
                input = null;
            } else if (filter.inputType == 'combo') {
                // drop-down box input for combo filters
                var options = [];
                var optionValues = this.getFilterPropertyOptions(filter);
                for (var i = 0; i < optionValues.length; i++) {
                    var optionValue = optionValues[i];
                    var option = Html.option({value: optionValue}, optionValue);
                    options.push(option);
                }
                input = Html.select({className: 'mapFilterCombo'}, options);
            }

            if (input) {
                filter.input = input;

                // observe change of the filter inputs
                var self = this;
                input.observeKeyPress(function(key) {
                    self.onFiltersInputChanged();
                });
                input.observeChange(function(key) {
                    self.onFiltersInputChanged();
                });

                // title
                var label = Html.span({className: 'mapFilterLabel'}, filter.label);

                // layout order
                var order;
                if (filter.inputType == 'text' || filter.inputType == 'subtext' || filter.inputType == 'combo') {
                    order = [label, input];
                } else {
                    order = [input, label];
                }
                return Widget.inline(order);
            } else {
                return null;
            }
        },

        onFiltersInputChanged: function() {
            this.updateFiltersState();
        },

        setDefaultFilterValue: function(filter) {
            if (filter.group !== undefined) {
                if (filter.defaultValue !== undefined) {
                    filter.mainCheckbox.dom.checked = filter.defaultValue;
                    filter.mainCheckbox.dispatchEvent("change");
                }
                for (var i = 0; i < filter.group.length; i++) {
                    this.setDefaultFilterValue(filter.group[i]);
                }
            } else {
                if (filter.defaultValue !== undefined && filter.input) {
                    if (filter.inputType == 'boolean' || filter.inputType == 'list_contains') {
                        filter.input.dom.checked = filter.defaultValue;
                    } else {
                        filter.input.dom.value = filter.defaultValue;
                    }
                    filter.input.dispatchEvent("change");
                }
            }
        },

        setDefaultFilterValues: function() {
            for (var i = 0; i < this.filters.length; i++) {
                this.setDefaultFilterValue(this.filters[i]);
            }
        },

        createGroupWidget: function(filter) {
            var widgets = Html.div({className: "mapFilterGroup"}, this.createFilterWidgets(filter.group));

            var mainCheckbox = Html.checkbox({className: 'mapFilterCheckbox'});

            function onMainCheckboxClick() {
                if (mainCheckbox.dom.checked) {
                    IndicoUI.Effect.appear(widgets);
                } else {
                    IndicoUI.Effect.disappear(widgets);
                }
            }

            mainCheckbox.observeChange(onMainCheckboxClick);
            onMainCheckboxClick();

            var label = Html.span({className: 'mapFilterLabel'}, filter.label);

            var top = Html.div({}, mainCheckbox, label);

            filter.widgets = widgets;
            filter.mainCheckbox = mainCheckbox
            return Html.div({}, top, widgets);
        },

        createFilterWidgets: function(filters) {
            var widgets = [];
            for (var i = 0; i < filters.length; i++) {
                var filter = filters[i];
                var widget;
                if (exists(filter.group)) {
                    widget = this.createGroupWidget(filter);
                } else {
                    widget = this.createFilterWidget(filter);
                }
                widgets.push(widget);
            }
            return Widget.lines(widgets);
        },

        createFilters: function(filterCanvas) {
            var lines = [];

            var title = Html.div({className: 'mapFilterTitle'}, $T("Search criteria")+":");
            lines.push(title);

            var widgets = this.createFilterWidgets(this.filters);
            lines.push(widgets);

            var self = this;

            var filterButton = Html.button('mapButton', $T("Filter"));
            filterButton.observeClick(function() {
                self.filterMarkers();
            });

            var resetButton = Html.button('mapButton', $T("Reset"));
            resetButton.observeClick(function() {
                self.setDefaultFilterValues();
                self.filterMarkers();
            });

            this.buttons = Html.div({}, filterButton, resetButton);
            lines.push(this.buttons);

            this.progress = Html.span({}, progressIndicator(true, true)).dom;

            this.resultsInfo = Html.span('mapResultsInfo', "");
            lines.push(this.resultsInfo);

            filterCanvas.appendChild(Widget.lines(lines).dom);
        },

        matchesCriteria: function(x, criteria) {
            for (var i = 0; i < criteria.length; i++) {
                var criterium = criteria[i];
                if (!criterium(x)) {
                    return false;
                }
            }
            return true;
        },

        filterByCriteria: function(items, criteria) {
            var count = 0;
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                item.showOnMap = this.matchesCriteria(item, criteria);
                if (item.showOnMap) {
                    count++;
                }
            }
            return count;
        },

        filterBuildingsByCriteria: function(buildingCriteria, roomCriteria) {
            this.filterByCriteria(this.buildings, buildingCriteria);
            for (var i = 0; i < this.buildings.length; i++) {
                var building = this.buildings[i];
                if (building.showOnMap) {
                    building.visibleRoomsSize = this.filterByCriteria(building.rooms, roomCriteria);
                    this.visibleRoomsCount += building.visibleRoomsSize;
                    if (building.visibleRoomsSize > 0) {
                        this.visibleBuildingsCount++;
                    } else {
                        building.showOnMap = false;
                    }
                } else {
                    building.visibleRoomsSize = 0;
                }
            }
        },

        building: function(number) {
            for (var i = 0; i < this.buildings.length; i++) {
                var building = this.buildings[i];
                if (building.number == number) {
                    return building;
                }
            }
            return null;
        },

        filterInput: function(index) {
            return this.getFilterValue(this.filters[index]);
        },

        createPropertyFilter: function(inputType, propertyName, expectedValue) {
            if (inputType == 'list_contains') {
                return function(obj) {
                    // search for element in the list
                    return obj[propertyName].indexOf(expectedValue) > -1;
                }
            } else if (inputType == 'subtext') {
                return function(obj) {
                    // search for substring in the string
                    return obj[propertyName].indexOf(expectedValue) > -1;
                }
            } else {
                return function(obj) {
                    return obj[propertyName] == expectedValue;
                }
            }
        },

        getFilterValue: function(filter) {
            var value; // the filter value
            if (filter.inputType == 'boolean') {
                // boolean value that tells if checkbox is checked
                value = filter.input.dom.checked;
                if (value && filter.checkedValue !== undefined) {
                    // if the checkbox is checked, the boolean value can be replaced with arbitrary one
                    value = filter.checkedValue;
                } else if (value && filter.filterFunction !== undefined) {
                    // for more complex filtering logic, a custom filter function can be specified
                    value = filter.filterFunction;
                }
            } else if (filter.inputType == 'list_contains') {
                // if the checkbox is checked, the filter value is the specified one
                value = filter.input.dom.checked ? filter.value : '';
            } else if (filter.inputType == 'hidden') {
                value = filter.defaultValue;
            } else {
                value = filter.input.dom.value;
            }
            return value;
        },

        addFilterFunctionToCriteria: function(filter, func, buildingCriteria, roomCriteria) {
            if (filter.filterType == 'building') {
                buildingCriteria.push(func);
            } else {
                roomCriteria.push(func);
            }
        },

        addFiltersToCriteria: function(filters, buildingCriteria, roomCriteria) {
            for (var i = 0; i < filters.length; i++) {
                filter = filters[i];
                // check if the filter is a group of filters
                if (filter.group !== undefined) {
                    var value = filter.mainCheckbox.dom.checked;
                    // the group filter shoud be enabled
                    if (!filter.optional || value) {
                        if (filter.property) {
                            // a filter function that checks the specified property for the specified value
                            var func = this.createPropertyFilter('boolean', filter.property, value);
                            this.addFilterFunctionToCriteria(filter, func, buildingCriteria, roomCriteria);
                        }
                        this.addFiltersToCriteria(filter.group, buildingCriteria, roomCriteria);
                    }
                } else {
                    var value = this.getFilterValue(filter);
                    if ((!filter.optional || value) && filter.active && filter.enabled) {
                        var func;
                        if (filter.filterFunction) {
                            // the first argument of the custom filter function is the calling instance
                            // specify the calling instance (this) and derivate a proper predicate function
                            func = curry(filter.filterFunction, this);
                        } else {
                            // a filter function that checks the specified property for the specified value
                            func = this.createPropertyFilter(filter.inputType, filter.property, value);
                        }
                        this.addFilterFunctionToCriteria(filter, func, buildingCriteria, roomCriteria);
                    }
                }
            }
        },

        resetFilteringCycle: function() {
            this.visibleBuildingsCount = 0;
            this.visibleRoomsCount = 0;

            // the info balloons whould be re-created after each filtering
            for (var i = 0; i < this.buildings.length; i++) {
                var building = this.buildings[i];
                building.marker.infoWindow = null;
            }

            // reset the counters for the aspects (areas)
            for (var i = 0; i < this.boundCounters.length; i++) {
                this.boundCounters[i] = 0;
            }
        },

        filterMarkers: function() {
            this.buttons.dom.appendChild(this.progress);
            var mapView = this;
            setTimeout(function() {
                var buildingCriteria = [];
                var roomCriteria = [];
                mapView.resetFilteringCycle();
                mapView.closeTooltips();
                mapView.closeInfoBaloon();
                mapView.addFiltersToCriteria(mapView.filters, buildingCriteria, roomCriteria);
                mapView.filterBuildingsByCriteria(buildingCriteria, roomCriteria);
                mapView.showMarkers();
                mapView.showResultsInfo();
                mapView.updateAspectsInfo();
                mapView.buttons.dom.removeChild(mapView.progress);
            }, 0);
        },

        showResultsInfo: function() {
            var info = $T('Total') + ' '
                        + this.visibleRoomsCount + ' ' + $T('room(s)')
                        + ' / ' + this.visibleBuildingsCount + ' ' + $T('building(s)');
            this.resultsInfo.dom.innerHTML = info;
        },

        initializeBounds: function() {
            this.bounds = [];
            this.boundCounters = [];
            for (var i = 0; i < this.aspects.length; i++) {
                var aspect = this.aspects[i];

                // initialize the bounds of the area descripbed in the aspect
                var sw = new google.maps.LatLng(aspect.topLeftLatitude, aspect.topLeftLongitude);
                var ne = new google.maps.LatLng(aspect.bottomRightLatitude, aspect.bottomRightLongitude);
                this.bounds.push(new google.maps.LatLngBounds(sw, ne));

                // initialize the array of counters for the aspect areas
                this.boundCounters.push(0);
            }
        },

        updateAspectsInfo: function() {
            for (var i = 0; i < this.aspects.length; i++) {
                var aspect = this.aspects[i];
                var counter = this.boundCounters[i];
                aspect.link.dom.innerHTML = aspect.name + " (" + counter + ")";
            }
        },

        isBrowserIE7: function() {
            var isIE = window.ActiveXObject ? true : false;
            var agent = navigator.userAgent.toLowerCase();
            return isIE && /msie 7/.test(agent) && document.documentMode == 7;
        }

    },

    /**
     * Constructor of the RoomMap
     */

    function(mapCanvas, aspectsCanvas, filterCanvas, aspects, buildings, filters) {
        this.initialize(mapCanvas, aspectsCanvas, filterCanvas, aspects, buildings, filters);
        this.values = {};
        this.extraComponents = [];
    }
);