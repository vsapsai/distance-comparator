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

    /**
     * Represents a single map.
     */
    var MapView = function(parentElement, mapConfig, zoom, centerOffset) {
        this.referencePoint = mapConfig.referencePoint;
        var mapCenter = DEFAULT_PLACE;
        if (this.referencePoint) {
            if (centerOffset) {
                mapCenter = latLngByApplyingDifference(this.referencePoint, centerOffset);
            } else {
                mapCenter = this.referencePoint;
            }
        }

        var mapElement = this.createMapElement();
        parentElement.appendChild(mapElement);
        this.map = new google.maps.Map(mapElement, {
            zoom: zoom,
            center: mapCenter,
            disableDoubleClickZoom: true  // We use double click for a different purpose.
        });
        this.circle = new google.maps.Circle({
            map: this.map,
            center: this.referencePoint,
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
        if (this.referencePoint) {
            markerConfig.position = this.referencePoint;
            markerConfig.visible = true;
        }
        this.marker = new google.maps.Marker(markerConfig);
        var referencePointInputElement = this.createSearchBoxElement("Reference Point");
        var referencePointSearchBox = new google.maps.places.SearchBox(referencePointInputElement);
        this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(referencePointInputElement);
        var comparisonPointInputElement = this.createSearchBoxElement("Comparison Point");
        var comparisonPointSearchBox = new google.maps.places.SearchBox(comparisonPointInputElement);
        this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(comparisonPointInputElement);

        var self = this;
        google.maps.event.addDomListener(this.map, "bounds_changed", function() {
            self.delegate.mapDidMove(self);
        });
        google.maps.event.addDomListener(this.map, "dblclick", function(event) {
            self.delegate.mapDidSelectComparisonPoint(self, event.latLng);
        });
        google.maps.event.addDomListener(this.map, "idle", function() {
            self.delegate.mapStateDidChange();
        });
        google.maps.event.addDomListener(this.marker, "dragend", function() {
            self.referencePoint = self.marker.getPosition();
            self.circle.setCenter(self.referencePoint);
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
            //TODO(vsapsai): update comparison point in some cases.
            self.referencePoint = newReferencePoint;
            self.marker.setPosition(self.referencePoint);
            self.marker.setVisible(true);
            self.circle.setCenter(self.referencePoint);
            if (centerOffset) {
                self.setCenterOffset(centerOffset);
            } else {
                // If there was no reference point earlier, cannot preserve
                // center offset and just center map on the new reference point.
                self.map.setCenter(self.referencePoint);
            }
            self.delegate.referencePointDidMove(self);
            self.delegate.mapStateDidChange();
        });
        comparisonPointInputElement.addEventListener("change", function(event) {
            if (!event.target.value) {
                self.delegate.mapDidSelectComparisonPoint(self, null);
            }
        });
        google.maps.event.addDomListener(comparisonPointSearchBox, "places_changed", function() {
            var places = comparisonPointSearchBox.getPlaces();
            var placePosition = (places.length > 0) ? places[0].geometry.location : null;
            self.delegate.mapDidSelectComparisonPoint(self, placePosition);
        });
    };

    MapView.prototype.createMapElement = function() {
        var mapElement = document.createElement("div");
        mapElement.classList.add("map-placeholder");
        return mapElement;
    };

    MapView.prototype.createSearchBoxElement = function(placeholderText) {
        var inputElement = document.createElement("input");
        inputElement.setAttribute("type", "text");
        inputElement.setAttribute("placeholder", placeholderText);
        inputElement.classList.add("search-box");
        return inputElement;
    };

    MapView.prototype._clearReferencePoint = function() {
        this.referencePoint = null;
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

    MapView.prototype.hasReferencePoint = function() {
        return !!this.referencePoint;
    };

    MapView.prototype.getCenterOffset = function() {
        var result = undefined;
        if (this.hasReferencePoint()) {
            result = getLatLngDifference(this.referencePoint, this.map.getCenter());
        }
        return result;
    };

    MapView.prototype.setCenterOffset = function(offset) {
        if (this.referencePoint && offset) {
            this.map.setCenter(latLngByApplyingDifference(this.referencePoint, offset));
        }
    };

    MapView.prototype.getDistanceToReferencePoint = function(point) {
        return google.maps.geometry.spherical.computeDistanceBetween(this.referencePoint, point);
    };

    MapView.prototype.setCircleState = function(isPresent, radius) {
        this.circle.setRadius(radius);
        this.circle.setVisible(isPresent && this.hasReferencePoint());
    };

    MapView.prototype.getState = function() {
        return {
            referencePoint: this.referencePoint
        };
    };

    var DistanceComparator = function(comparatorElement, mapSettings) {
        this.maps = [];
        this.locationMarker = new google.maps.Marker({
            icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
        });
        this.isBoundsUpdateInProgress = false;
        var zoom = (mapSettings && mapSettings.zoom) || DEFAULT_ZOOM;
        var centerOffset = mapSettings ? mapSettings.centerOffset : null;
        var i;
        for (i = 0; i < 2; i++) {
            var mapConfig = {};
            if (mapSettings && mapSettings.maps && mapSettings.maps[i]) {
                mapConfig = mapSettings.maps[i];
            }
            var map = new MapView(comparatorElement, mapConfig, zoom, centerOffset);
            map.delegate = this;
            map.tag = i;
            this.maps.push(map);
        }
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

    DistanceComparator.prototype.syncCircleStateWithMap = function(mapView) {
        var isCirclePresent = mapView.hasReferencePoint() && (this.locationMarker.getMap() === mapView.getMap());
        var radius = 0;
        if (isCirclePresent) {
            radius = mapView.getDistanceToReferencePoint(this.locationMarker.getPosition());
        }
        var i;
        for (i = 0; i < this.maps.length; i++) {
            this.maps[i].setCircleState(isCirclePresent, radius);
        }
    };

    DistanceComparator.prototype.mapDidMove = function(mapView) {
        this.syncBoundsWithMap(mapView.tag);
    };

    DistanceComparator.prototype.referencePointDidMove = function(mapView) {
        if (this.locationMarker.getMap() === mapView.getMap()) {
            this.syncCircleStateWithMap(mapView);
        }
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

    DistanceComparator.prototype.mapDidSelectComparisonPoint = function(mapView, position) {
        if (position) {
            this.locationMarker.setMap(mapView.getMap());
            this.locationMarker.setPosition(position);
        } else {
            this.locationMarker.setMap(null);
        }
        this.syncCircleStateWithMap(mapView);
        this.notifyStateDidChange();
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
            components.push("comparison" + state.comparisonPoint.mapIndex +
                            "=" + getUrlValueForLatLng(state.comparisonPoint.position));
        }
        if (state.maps) {
            var i;
            for (i = 0; i < state.maps.length; i++) {
                var mapState = state.maps[i];
                if (mapState.referencePoint) {
                    components.push("ref" + i + "=" + getUrlValueForLatLng(mapState.referencePoint));
                }
            }
        }
        return components.join("&");
    }

    function decodeStateFromString(string) {
        //TODO(vsapsai): implement
    }

    var exportObject = {};
    exportObject.DistanceComparator = DistanceComparator;
    exportObject.encodeStateToString = encodeStateToString;
    exportObject.decodeStateFromString = decodeStateFromString;
    return exportObject;
})();
