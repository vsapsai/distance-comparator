var DistanceComparator = (function() {
    "use strict";

    var DEFAULT_ZOOM = 10;
    var DEFAULT_PLACE = new google.maps.LatLng(50.45, 30.523611);

    function getLatLngDifference(latLng1, latLng2) {
        return {
            "latDiff": latLng2.lat() - latLng1.lat(),
            "lngDiff": latLng2.lng() - latLng1.lng()
        };
    }

    function latLngByApplyingDifference(latLng, latLngDiff) {
        return new google.maps.LatLng(
            latLng.lat() + latLngDiff.latDiff,
            latLng.lng() + latLngDiff.lngDiff
        );
    }

    function getUrlValueForLatLngDifference(latLngDiff) {
        var precision = 6;
        return latLngDiff.latDiff.toFixed(precision) + "," + latLngDiff.lngDiff.toFixed(precision);
    }

    function getUrlValueForLatLng(latLng) {
        var precision = 6;
        return latLng.lat().toFixed(precision) + "," + latLng.lng().toFixed(precision);
    }

    function encodePlaceName(name) {
        return encodeURIComponent(name)
            // Replace comma and space because we expect quite a lot of them in
            // place names and want better readability.
            .replace(/%2C/g, ",")
            .replace(/%20/g, "+");
    }

    function decodePlaceName(encodedName) {
        return decodeURIComponent(encodedName.replace(/\+/g, " "));
    }

    // Differs from String.prototype.split by not splitting on every match of separator
    // but splitting on at most limit-1 separator.
    //
    // Returns an array of substrings, at most of length limit.
    function _splitStopEarly(string, separator, limit) {
        if (limit === 0) {
            return [];
        }
        if (limit === 1) {
            return [string];
        }
        var result = [];
        var start = 0;
        while (result.length < (limit - 1)) {
            var separatorPosition = string.indexOf(separator, start);
            if (separatorPosition === -1) {
                break;
            }
            result.push(string.substring(start, separatorPosition));
            start = separatorPosition + 1;
        }
        if (start < string.length) {
            result.push(string.substring(start));
        }
        return result;
    }

    function _parse2Floats(str1, str2) {
        var floats = [parseFloat(str1), parseFloat(str2)];
        if (isNaN(floats[0]) || isNaN(floats[1])
            || !isFinite(floats[0]) || !isFinite(floats[1])) {
            return null;
        }
        return floats;
    }

    function _parse2FloatsString(string) {
        var strings = _splitStopEarly(string, ",", 2);
        if (strings.length < 2) {
            return null;
        }
        return _parse2Floats(strings[0], strings[1]);
    }

    function parseLatLngDifference(string) {
        var floats = _parse2FloatsString(string);
        if (floats === null) {
            return null;
        }
        return {
            "latDiff": floats[0],
            "lngDiff": floats[1]
        };
    }

    function parseLatLng(string) {
        var floats = _parse2FloatsString(string);
        if (floats === null) {
            return null;
        }
        return new google.maps.LatLng(floats[0], floats[1]);
    }

    function parseNamedPoint(string) {
        var components = _splitStopEarly(string, ",", 3);
        if (components.length < 2) {
            return null;
        }
        var floats = _parse2Floats(components[0], components[1]);
        if (floats == null) {
            return null;
        }
        var result = {
            position: new google.maps.LatLng(floats[0], floats[1])
        };
        if ((components.length >= 3) && components[2]) {
            result.name = decodePlaceName(components[2]);
        }
        return result;
    }

    /**
     * Represents a single map.
     */
    var MapView = function(parentElement, mapConfig, zoom, centerOffset, comparisonPointName) {
        var referencePointPosition = undefined;
        if (mapConfig.referencePoint && mapConfig.referencePoint.position) {
            referencePointPosition = mapConfig.referencePoint.position;
        }
        // Create a new object instead of using mapConfig.referencePoint to avoid
        // referencePoint to be changed from outside by mutating mapConfig.referencePoint.
        this.referencePoint = { position: referencePointPosition };
        if (referencePointPosition && mapConfig.referencePoint.name) {
            this.referencePoint.name = mapConfig.referencePoint.name;
        }
        var mapCenter = DEFAULT_PLACE;
        if (referencePointPosition) {
            if (centerOffset) {
                mapCenter = latLngByApplyingDifference(referencePointPosition, centerOffset);
            } else {
                mapCenter = referencePointPosition;
            }
        } else if (mapConfig.center) {
            mapCenter = mapConfig.center;
        }

        var mapElement = this._createMapElement();
        parentElement.appendChild(mapElement);
        this.map = new google.maps.Map(mapElement, {
            zoom: zoom,
            center: mapCenter,
            disableDoubleClickZoom: true  // We use double click for a different purpose.
        });
        this.circle = new google.maps.Circle({
            map: this.map,
            center: referencePointPosition,
            fillOpacity: 0.0,
            strokeColor: "#AAA",
            strokeOpacity: 1.0,
            strokeWeight: 2,
            visible: false,
            clickable: false
        });
        var markerConfig = {
            map: this.map,
            visible: false,
            draggable: true
        };
        if (referencePointPosition) {
            markerConfig.position = referencePointPosition;
            markerConfig.visible = true;
        }
        this.marker = new google.maps.Marker(markerConfig);
        var referencePointInputElement = this._createSearchBoxElement("Reference Point");
        if (this.referencePoint.name) {
            referencePointInputElement.value = this.referencePoint.name;
        }
        var referencePointSearchBox = new google.maps.places.SearchBox(referencePointInputElement);
        this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(referencePointInputElement);
        var comparisonPointInputElement = this._createSearchBoxElement("Comparison Point");
        if (comparisonPointName) {
            comparisonPointInputElement.value = comparisonPointName;
        }
        var comparisonPointSearchBox = new google.maps.places.SearchBox(comparisonPointInputElement);
        this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(comparisonPointInputElement);

        var self = this;
        google.maps.event.addDomListener(this.map, "bounds_changed", function() {
            self.delegate.mapDidMove(self);
        });
        google.maps.event.addDomListener(this.map, "dblclick", function(event) {
            if (self.hasReferencePoint()) {
                self.delegate.mapDidSelectComparisonPoint(self, event.latLng, null);
            } else {
                self.referencePoint = {
                    position: event.latLng,
                };
                self.marker.setPosition(self.referencePoint.position);
                self.marker.setVisible(true);
                self.circle.setCenter(self.referencePoint.position);
                self.delegate.referencePointDidMove(self);
                self.delegate.mapDidMove(self);
                self.delegate.mapStateDidChange();
            }
        });
        google.maps.event.addDomListener(this.map, "idle", function() {
            self.delegate.mapStateDidChange();
        });
        google.maps.event.addDomListener(this.marker, "dragend", function() {
            self.referencePoint = { position: self.marker.getPosition() };
            self.circle.setCenter(self.referencePoint.position);
            self.delegate.mapDidMove(self);
            self.delegate.referencePointDidMove(self);
            self.delegate.mapStateDidChange();
        });
        referencePointInputElement.addEventListener("change", function(event) {
            if (!event.target.value) {
                self._clearReferencePoint();
            }
        });
        google.maps.event.addDomListener(referencePointSearchBox, "places_changed", function() {
            var places = referencePointSearchBox.getPlaces();
            if (places.length == 0) {
                self._clearReferencePoint();
                return;
            }
            var newReferencePoint = places[0].geometry.location;
            var centerOffset = self.getCenterOffset();
            if (!centerOffset) {
                centerOffset = self.delegate.getSharedCenterOffset();
            }
            self.referencePoint = {
                position: newReferencePoint,
                name: referencePointInputElement.value
            };
            self.marker.setPosition(self.referencePoint.position);
            self.marker.setVisible(true);
            self.circle.setCenter(self.referencePoint.position);
            if (centerOffset) {
                self.setCenterOffset(centerOffset);
            } else {
                // If there was no reference point earlier, cannot preserve
                // center offset and just center map on the new reference point.
                self.map.setCenter(self.referencePoint.position);
            }
            self.delegate.referencePointDidMove(self);
            self.delegate.mapStateDidChange();
        });
        comparisonPointInputElement.addEventListener("change", function(event) {
            if (!event.target.value) {
                self.delegate.mapDidSelectComparisonPoint(self, null, null);
            }
        });
        google.maps.event.addDomListener(comparisonPointSearchBox, "places_changed", function() {
            var places = comparisonPointSearchBox.getPlaces();
            var placePosition = (places.length > 0) ? places[0].geometry.location : null;
            if (placePosition) {
                if (self.hasReferencePoint()) {
                    self._zoomToShowPoint(placePosition);
                } else {
                    self.map.setCenter(placePosition);
                }
            }
            self.delegate.mapDidSelectComparisonPoint(self, placePosition, comparisonPointInputElement.value);
        });
    };

    MapView.prototype._createMapElement = function() {
        var mapElement = document.createElement("div");
        mapElement.classList.add("map-placeholder");
        return mapElement;
    };

    MapView.prototype._createSearchBoxElement = function(placeholderText) {
        var inputElement = document.createElement("input");
        inputElement.setAttribute("type", "text");
        inputElement.setAttribute("placeholder", placeholderText);
        inputElement.classList.add("search-box");
        return inputElement;
    };

    MapView.prototype._clearReferencePoint = function() {
        this.referencePoint = {};
        this.marker.setVisible(false);
        this.delegate.referencePointDidMove(this);
    };

    MapView.prototype.getMap = function() {
        return this.map;
    };

    MapView.prototype.getZoom = function() {
        return this.map.getZoom();
    };

    MapView.prototype.setZoom = function(zoom) {
        this.map.setZoom(zoom);
    };

    MapView.prototype._zoomToShowPoint = function(position) {
        var map = this.getMap();
        if (map.getBounds().contains(position)) {
            return;
        }
        // Calculate desired bounds.
        var center = map.getCenter();
        var distance = google.maps.geometry.spherical.computeDistanceBetween(position, center);
        var heading = google.maps.geometry.spherical.computeHeading(position, center);
        var to = google.maps.geometry.spherical.computeOffset(center, distance, heading);
        var desiredBounds = new google.maps.LatLngBounds();
        desiredBounds = desiredBounds.extend(position);
        desiredBounds = desiredBounds.extend(to);
        // Set new bounds.
        map.fitBounds(desiredBounds);
    };

    MapView.prototype.hasReferencePoint = function() {
        return !!(this.referencePoint && this.referencePoint.position);
    };

    MapView.prototype.getCenterOffset = function() {
        var result = undefined;
        if (this.hasReferencePoint()) {
            result = getLatLngDifference(this.referencePoint.position, this.map.getCenter());
        }
        return result;
    };

    MapView.prototype.setCenterOffset = function(offset) {
        if (this.hasReferencePoint() && offset) {
            this.map.setCenter(latLngByApplyingDifference(this.referencePoint.position, offset));
        }
    };

    MapView.prototype.getDistanceToReferencePoint = function(point) {
        return google.maps.geometry.spherical.computeDistanceBetween(this.referencePoint.position, point);
    };

    MapView.prototype.setCircleState = function(isPresent, radius) {
        this.circle.setRadius(radius);
        this.circle.setVisible(isPresent && this.hasReferencePoint());
    };

    MapView.prototype.getState = function() {
        var state = {};
        if (this.hasReferencePoint()) {
            state.referencePoint = {
                position: this.referencePoint.position,
                name: this.referencePoint.name
            };
        } else {
            state.center = this.map.getCenter();
        }
        return state;
    };

    var DistanceComparator = function(comparatorElement, mapSettings) {
        this.maps = [];
        this.locationMarker = new google.maps.Marker({
            icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
            draggable: true
        });
        this.locationName = null;
        this.isBoundsUpdateInProgress = false;
        var zoom = (mapSettings && mapSettings.zoom) || DEFAULT_ZOOM;
        var centerOffset = mapSettings ? mapSettings.centerOffset : null;
        var comparisonPointMapIndex = null;
        if (mapSettings && mapSettings.comparisonPoint) {
            comparisonPointMapIndex = mapSettings.comparisonPoint.mapIndex;
        }
        var i;
        for (i = 0; i < 2; i++) {
            var mapConfig = {};
            if (mapSettings && mapSettings.maps && mapSettings.maps[i]) {
                mapConfig = mapSettings.maps[i];
            }
            var comparisonPointName = null;
            if ((i === comparisonPointMapIndex) && mapSettings.comparisonPoint.position) {
                comparisonPointName = mapSettings.comparisonPoint.name;
            }
            var map = new MapView(comparatorElement, mapConfig, zoom, centerOffset, comparisonPointName);
            map.delegate = this;
            map.tag = i;
            this.maps.push(map);
        }
        if (mapSettings && mapSettings.comparisonPoint) {
            var mapIndex = mapSettings.comparisonPoint.mapIndex;
            var isValidComparisonPointConfig = mapSettings.comparisonPoint.position
                && ((0 <= comparisonPointMapIndex) && (comparisonPointMapIndex < this.maps.length));
            if (isValidComparisonPointConfig) {
                this.locationMarker.setPosition(mapSettings.comparisonPoint.position);
                if (mapSettings.comparisonPoint.name) {
                    this.locationName = mapSettings.comparisonPoint.name;
                }
                var comparisonPointMapView = this.maps[comparisonPointMapIndex];
                this.locationMarker.setMap(comparisonPointMapView.getMap());
                this.syncCircleState();
            }
        }
        var self = this;
        google.maps.event.addDomListener(this.locationMarker, "dragend", function() {
            self.updateComparisonPointPosition(self.locationMarker.getPosition(), null);
        });
    };

    DistanceComparator.prototype.syncBoundsWithMap = function(mapIndex) {
        if (this.isBoundsUpdateInProgress) {
            return;
        }
        this.isBoundsUpdateInProgress = true;
        var zoom = this.maps[mapIndex].getZoom();
        var centerOffset = this.maps[mapIndex].getCenterOffset();
        var i;
        for (i = 0; i < this.maps.length; i++) {
            if (i === mapIndex) {
                continue;
            }
            this.maps[i].setZoom(zoom);
            this.maps[i].setCenterOffset(centerOffset);
        }
        this.isBoundsUpdateInProgress = false;
    };

    DistanceComparator.prototype.syncCircleState = function() {
        var i;
        var comparisonPointMapView = null;
        if (this.locationMarker.getMap() !== null) {
            for (i = 0; i < this.maps.length; i++) {
                if (this.maps[i].getMap() === this.locationMarker.getMap()) {
                    comparisonPointMapView = this.maps[i];
                    break;
                }
            }
        }
        var isCirclePresent = (comparisonPointMapView !== null) && comparisonPointMapView.hasReferencePoint();
        var radius = 0;
        if (isCirclePresent) {
            radius = comparisonPointMapView.getDistanceToReferencePoint(this.locationMarker.getPosition());
        }
        for (i = 0; i < this.maps.length; i++) {
            this.maps[i].setCircleState(isCirclePresent, radius);
        }
    };

    DistanceComparator.prototype.mapDidMove = function(mapView) {
        this.syncBoundsWithMap(mapView.tag);
    };

    DistanceComparator.prototype.referencePointDidMove = function(mapView) {
        this.syncCircleState();
    };

    DistanceComparator.prototype.getSharedCenterOffset = function() {
        var centerOffset = undefined;
        var i;
        for (i = 0; i < this.maps.length; i++) {
            centerOffset = this.maps[i].getCenterOffset();
            if (centerOffset) {
                break;
            }
        }
        return centerOffset;
    };

    DistanceComparator.prototype.updateComparisonPointPosition = function(position, positionName) {
        if (position) {
            this.locationMarker.setPosition(position);
            this.locationName = positionName;
        } else {
            this.locationName = null;
        }
        this.syncCircleState();
        this.notifyStateDidChange();
    };

    DistanceComparator.prototype.mapDidSelectComparisonPoint = function(mapView, position, positionName) {
        if (position) {
            this.locationMarker.setMap(mapView.getMap());
        } else {
            this.locationMarker.setMap(null);
        }
        this.updateComparisonPointPosition(position, positionName);
    };

    DistanceComparator.prototype.mapStateDidChange = function() {
        this.notifyStateDidChange();
    };

    DistanceComparator.prototype.getStateChangeHandler = function() {
        return this.stateChangeHandler;
    };

    DistanceComparator.prototype.setStateChangeHandler = function(handler) {
        this.stateChangeHandler = handler;
    };

    DistanceComparator.prototype.getState = function() {
        // State contains:
        // * zoom
        // * center offset (if one of the maps has a reference point)
        // * reference point or center for the 1st map
        // * reference point or center for the 2nd map
        // * comparison point if present
        var state = {
            zoom: this.maps[0].getZoom(),
            centerOffset: this.getSharedCenterOffset()
        };
        state.maps = this.maps.map(function(mapView) {
            return mapView.getState();
        });
        var i;
        for (i = 0; i < this.maps.length; i++) {
            if (this.locationMarker.getMap() === this.maps[i].getMap()) {
                state.comparisonPoint = {
                    mapIndex: i,
                    position: this.locationMarker.getPosition()
                };
                if (this.locationName) {
                    state.comparisonPoint.name = this.locationName;
                }
                break;
            }
        }
        return state;
    };

    DistanceComparator.prototype.notifyStateDidChange = function() {
        var stateChangeHandler = this.getStateChangeHandler();
        if (stateChangeHandler) {
            stateChangeHandler(this.getState());
        }
    };

    function encodeStateToString(state) {
        var components = [];
        if (state.zoom) {
            components.push("zoom=" + state.zoom);
        }
        if (state.centerOffset) {
            components.push("offset=" + getUrlValueForLatLngDifference(state.centerOffset));
        }
        if (state.comparisonPoint) {
            var urlValue = getUrlValueForLatLng(state.comparisonPoint.position);
            if (state.comparisonPoint.name) {
                urlValue += "," + encodePlaceName(state.comparisonPoint.name);
            }
            components.push("comparison" + state.comparisonPoint.mapIndex + "=" + urlValue);
        }
        if (state.maps) {
            var i;
            for (i = 0; i < state.maps.length; i++) {
                var mapState = state.maps[i];
                if (mapState.referencePoint && mapState.referencePoint.position) {
                    var urlValue = getUrlValueForLatLng(mapState.referencePoint.position);
                    if (mapState.referencePoint.name) {
                        urlValue += "," + encodePlaceName(mapState.referencePoint.name);
                    }
                    components.push("ref" + i + "=" + urlValue);
                } else if (mapState.center) {
                    components.push("center" + i + "=" + getUrlValueForLatLng(mapState.center));
                }
            }
        }
        return components.join("&");
    }

    function decodeStateFromString(string) {
        var components = (string || "").split("&");
        var componentsDictionary = {};
        components.forEach(function(component) {
            var separatorIndex = component.indexOf("=");
            if (separatorIndex != -1) {
                componentsDictionary[component.substring(0, separatorIndex)] = component.substring(separatorIndex + 1);
            }
        });
        var state = {};
        if (componentsDictionary.zoom) {
            var zoom = parseInt(componentsDictionary.zoom);
            if (!isNaN(zoom)) {
                state.zoom = zoom;
            }
        }
        if (componentsDictionary.offset) {
            var centerOffset = parseLatLngDifference(componentsDictionary.offset);
            if (centerOffset) {
                state.centerOffset = centerOffset;
            }
        }
        if (componentsDictionary.comparison0 || componentsDictionary.comparison1) {
            var mapIndex = componentsDictionary.comparison0 ? 0 : 1;
            var comparisonPoint = parseNamedPoint(componentsDictionary.comparison0 || componentsDictionary.comparison1);
            if (comparisonPoint) {
                state.comparisonPoint = comparisonPoint;
                state.comparisonPoint.mapIndex = mapIndex;
            }
        }
        var mapStates = [{}, {}];
        var hasMapState = false;
        var i;
        for (i = 0; i < 2; i++) {
            var centerString = componentsDictionary["center" + i];
            if (centerString) {
                var position = parseLatLng(centerString);
                if (position) {
                    mapStates[i].center = position;
                    hasMapState = true;
                }
            }
            var referencePointString = componentsDictionary["ref" + i];
            if (referencePointString) {
                var referencePoint = parseNamedPoint(referencePointString);
                if (referencePoint) {
                    mapStates[i].referencePoint = referencePoint;
                    hasMapState = true;
                }
            }
        }
        if (hasMapState) {
            state.maps = mapStates;
        }
        return state;
    }

    var exportObject = {};
    exportObject.DistanceComparator = DistanceComparator;
    exportObject.encodeStateToString = encodeStateToString;
    exportObject.decodeStateFromString = decodeStateFromString;
    return exportObject;
})();
