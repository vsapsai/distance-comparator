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

    var DistanceComparator = function() {
        this.maps = [];
        this.circles = [];
        this.locationMarker = new google.maps.Marker({
            icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
        });
        this.isBoundsUpdateInProgress = false;
    };

    DistanceComparator.prototype.syncBoundsWithMap = function(mapIndex) {
        if (this.isBoundsUpdateInProgress) {
            return;
        }
        this.isBoundsUpdateInProgress = true;
        var zoom = this.maps[mapIndex].getZoom();
        var centerDiff = getLatLngDifference(this.mapSettings[mapIndex].center, this.maps[mapIndex].getCenter());
        var i;
        for (i = 0; i < this.maps.length; i++) {
            if (i === mapIndex) {
                continue;
            }
            this.maps[i].setZoom(zoom);
            this.maps[i].setCenter(latLngByApplyingDifference(this.mapSettings[i].center, centerDiff));
        }
        this.isBoundsUpdateInProgress = false;
    };

    DistanceComparator.prototype.attach = function(mapSettings, initialZoom) {
        var self = this;
        self.mapSettings = mapSettings;
        //var i;
        mapSettings.forEach(function(mapSetting, i) {
            var map = new google.maps.Map(mapSettings[i].element, {
                zoom: initialZoom,
                center: mapSetting.center,
                disableDoubleClickZoom: true
            });
            self.maps.push(map);
            var circle = new google.maps.Circle({
                map: map,
                center: mapSetting.center,
                fillOpacity: 0.0,
                strokeColor: "#AAA",
                strokeOpacity: 1.0,
                strokeWeight: 2,
                visible: false,
                clickable: false
            });
            self.circles.push(circle);
            google.maps.event.addDomListener(map, "bounds_changed", self.syncBoundsWithMap.bind(self, i));
            google.maps.event.addDomListener(map, "dblclick", function(event) {
                self.locationMarker.setMap(map);
                self.locationMarker.setPosition(event.latLng);

                var radius = google.maps.geometry.spherical.computeDistanceBetween(mapSetting.center, event.latLng);
                var i;
                for (i = 0; i < self.circles.length; i++) {
                    self.circles[i].setRadius(radius);
                    self.circles[i].setVisible(true);
                }
            });

            var marker = new google.maps.Marker({
                position: mapSetting.center,
                map: map,
                draggable: true
            });
            google.maps.event.addDomListener(marker, "dragend", function() {
                self.mapSettings[i].center = marker.getPosition();
                circle.setCenter(self.mapSettings[i].center);
                self.syncBoundsWithMap(i);
            });
        });
    };

    var exportObject = {};
    exportObject.initialize = function(mapSettings, initialZoom) {
        var distanceComparator = new DistanceComparator();
        distanceComparator.attach(mapSettings, initialZoom);
    };

    return exportObject;
})();
