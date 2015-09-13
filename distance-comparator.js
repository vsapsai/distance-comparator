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

    /**
     * Represents a single map.
     */
    var MapView = function(mapConfig, zoom) {
        this.referencePoint = mapConfig.center;

        var mapElement = this.createMapElement();
        mapConfig.element.appendChild(mapElement);
        this.map = new google.maps.Map(mapElement, {
            zoom: zoom,
            center: mapConfig.center,
            disableDoubleClickZoom: true  // We use double click for a different purpose.
        });
        this.circle = new google.maps.Circle({
            map: this.map,
            center: mapConfig.center,
            fillOpacity: 0.0,
            strokeColor: "#AAA",
            strokeOpacity: 1.0,
            strokeWeight: 2,
            visible: false,
            clickable: false
        });
        var marker = new google.maps.Marker({
            position: mapConfig.center,
            map: this.map,
            draggable: true
        });
        var referencePointInputElement = this.createSearchBoxElement();
        var referencePointSearchBox = new google.maps.places.SearchBox(referencePointInputElement);
        this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(referencePointInputElement);

        var self = this;
        google.maps.event.addDomListener(this.map, "bounds_changed", function() {
            self.delegate.mapDidMove(self);
        });
        google.maps.event.addDomListener(this.map, "dblclick", function(event) {
            self.delegate.mapDidDoubleClick(self, event);
        });
        google.maps.event.addDomListener(marker, "dragend", function() {
            self.referencePoint = marker.getPosition();
            self.circle.setCenter(self.referencePoint);
            self.delegate.mapDidMove(self, /*didReferencePointMove =*/true);
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
        });
    };

    MapView.prototype.createMapElement = function() {
        var mapElement = document.createElement("div");
        mapElement.classList.add("map-placeholder");
        return mapElement;
    };

    MapView.prototype.createSearchBoxElement = function() {
        var inputElement = document.createElement("input");
        inputElement.setAttribute("type", "text");
        inputElement.setAttribute("placeholder", "Reference Point");
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

    var DistanceComparator = function(mapSettings, initialZoom) {
        this.maps = [];
        this.locationMarker = new google.maps.Marker({
            icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
        });
        this.isBoundsUpdateInProgress = false;
        var self = this;
        mapSettings.forEach(function(mapSetting, i) {
            var map = new MapView(mapSetting, initialZoom);
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

    DistanceComparator.prototype.mapDidDoubleClick = function(mapView, event) {
        this.locationMarker.setMap(mapView.getMap());
        this.locationMarker.setPosition(event.latLng);
        this.syncCircleRadiusWithMap(mapView);
    };

    var exportObject = {};
    exportObject.DistanceComparator = DistanceComparator;
    return exportObject;
})();
