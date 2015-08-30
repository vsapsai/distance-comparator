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

    var maps = [];
    var circles = [];
    var locationMarker;

    var exportObject = {};
    exportObject.initialize = function(mapSettings, initialZoom) {
          var i;
          mapSettings.forEach(function(mapSetting, i) {
            var map = new google.maps.Map(document.getElementById(mapSettings[i].elementId), {
              zoom: initialZoom,
              center: mapSetting.center,
              disableDoubleClickZoom: true
            });
            maps.push(map);
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
            circles.push(circle);
            google.maps.event.addDomListener(map, "bounds_changed", syncBoundsWithMap.bind(undefined, i));
            google.maps.event.addDomListener(map, "dblclick", function(event) {
              locationMarker.setMap(map);
              locationMarker.setPosition(event.latLng);

              var radius = google.maps.geometry.spherical.computeDistanceBetween(mapSetting.center, event.latLng);
              var i;
              for (i = 0; i < circles.length; i++) {
                circles[i].setRadius(radius);
                circles[i].setVisible(true);
              }
            });

            var marker = new google.maps.Marker({
              position: mapSetting.center,
              map: map,
              draggable: true
            });
            google.maps.event.addDomListener(marker, "dragend", function() {
              mapSettings[i].center = marker.getPosition();
              circle.setCenter(mapSettings[i].center);
              syncBoundsWithMap(i);
            });
          });
          locationMarker = new google.maps.Marker({
            icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
          });

          var isBoundsUpdateInProgress = false;
          function syncBoundsWithMap(mapIndex) {
            if (isBoundsUpdateInProgress) {
              return;
            }
            isBoundsUpdateInProgress = true;
            var zoom = maps[mapIndex].getZoom();
            var centerDiff = getLatLngDifference(mapSettings[mapIndex].center, maps[mapIndex].getCenter());
            var i;
            for (i = 0; i < maps.length; i++) {
              if (i === mapIndex) {
                continue;
              }
              maps[i].setZoom(zoom);
              maps[i].setCenter(latLngByApplyingDifference(mapSettings[i].center, centerDiff));
            }
            isBoundsUpdateInProgress = false;
          }
    };

    return exportObject;
})();
