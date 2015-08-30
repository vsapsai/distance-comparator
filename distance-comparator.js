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
        this.map = new google.maps.Map(mapConfig.element, {
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
            self.delegate.mapDidMove(self);
        });
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

    DistanceComparator.prototype.mapDidMove = function(mapView) {
        this.syncBoundsWithMap(mapView.tag);
    };

    DistanceComparator.prototype.mapDidDoubleClick = function(mapView, event) {
        this.locationMarker.setMap(mapView.getMap());
        this.locationMarker.setPosition(event.latLng);

        var radius = mapView.getDistanceToReferencePoint(event.latLng);
        var i;
        for (i = 0; i < this.maps.length; i++) {
            this.maps[i].setCircleRadius(radius);
        }
    };

    var exportObject = {};
    exportObject.DistanceComparator = DistanceComparator;
    return exportObject;
})();
