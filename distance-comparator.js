var DistanceComparator = (function() {
    "use strict";

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
    var MapView = function(parentElement, mapConfig, zoom) {
        this.referencePoint = mapConfig.referencePoint;

        var mapElement = this.createMapElement();
        parentElement.appendChild(mapElement);
        this.map = new google.maps.Map(mapElement, {
            zoom: zoom,
            center: this.referencePoint,
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
        var marker = new google.maps.Marker({
            position: this.referencePoint,
            map: this.map,
            draggable: true
        });
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
        google.maps.event.addDomListener(marker, "dragend", function() {
            self.referencePoint = marker.getPosition();
            self.circle.setCenter(self.referencePoint);
            self.delegate.mapDidMove(self, /*didReferencePointMove =*/true);
            self.delegate.mapStateDidChange();
        });
        google.maps.event.addDomListener(referencePointSearchBox, "places_changed", function() {
            //TODO(vsapsai): handle when there are no places.
            var newReferencePoint = referencePointSearchBox.getPlaces()[0].geometry.location;
            var centerOffset = self.getCenterOffset();
            //TODO(vsapsai): update comparison point in some cases.
            self.referencePoint = newReferencePoint;
            marker.setPosition(self.referencePoint);
            self.setCenterOffset(centerOffset);
            self.circle.setCenter(self.referencePoint);
            self.delegate.mapStateDidChange();
        });
        google.maps.event.addDomListener(comparisonPointSearchBox, "places_changed", function() {
            //TODO(vsapsai): handle when there are no places.
            var placePosition = comparisonPointSearchBox.getPlaces()[0].geometry.location;
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
    }

    MapView.prototype.getMap = function() {
        return this.map;
    };

    MapView.prototype.getZoom = function() {
        return this.map.getZoom();
    };

    MapView.prototype.setZoom = function(zoom) {
        this.map.setZoom(zoom);
    };

    MapView.prototype.getCenterOffset = function() {
        return getLatLngDifference(this.referencePoint, this.map.getCenter());
    };

    MapView.prototype.setCenterOffset = function(offset) {
        this.map.setCenter(latLngByApplyingDifference(this.referencePoint, offset));
    };

    MapView.prototype.getDistanceToReferencePoint = function(point) {
        return google.maps.geometry.spherical.computeDistanceBetween(this.referencePoint, point);
    };

    MapView.prototype.setCircleRadius = function(radius) {
        this.circle.setRadius(radius);
        this.circle.setVisible(true);
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
        var self = this;
        mapSettings.maps.forEach(function(mapSetting, i) {
            var map = new MapView(comparatorElement, mapSetting, mapSettings.zoom);
            map.delegate = self;
            map.tag = i;
            self.maps.push(map);
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

    DistanceComparator.prototype.syncCircleRadiusWithMap = function(mapView) {
        var radius = mapView.getDistanceToReferencePoint(this.locationMarker.getPosition());
        var i;
        for (i = 0; i < this.maps.length; i++) {
            this.maps[i].setCircleRadius(radius);
        }
    };

    DistanceComparator.prototype.mapDidMove = function(mapView, didReferencePointMove) {
        this.syncBoundsWithMap(mapView.tag);
        if (didReferencePointMove) {
            // Update circles' radii if reference point changed in comparison point map.
            if (this.locationMarker.getMap() === mapView.getMap()) {
                this.syncCircleRadiusWithMap(mapView);
            }
        }
    };

    DistanceComparator.prototype.mapDidSelectComparisonPoint = function(mapView, position) {
        this.locationMarker.setMap(mapView.getMap());
        this.locationMarker.setPosition(position);
        this.syncCircleRadiusWithMap(mapView);
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
            centerOffset: this.maps[0].getCenterOffset()
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
