"use strict";

describe("DistanceComparator", function() {
    var maps;
    var markers;
    var circles;

    beforeEach(function() {
        maps = [];
        markers = [];
        circles = [];
        google.maps.Map = mockClass("Map", [], maps);
        google.maps.Marker = mockClass("Marker", [], markers);
        google.maps.Circle = mockClass("Circle", [], circles);
        google.maps.event.addDomListener = jasmine.createSpy("addDomListener");
    });

    //TODO(vsapsai): test all functionality when both reference points
    // specified, 1 point, and no reference points.

    describe("creation", function() {
        var mapSettings = [
            {
                center: "map1 center",
                element: "element1"
            },
            {
                center: "map2 center",
                element: "element2"
            }
        ];
        var zoom = 10;

        it("creates maps according to mapSettings", function() {
            var comparator = new DistanceComparator.DistanceComparator(mapSettings, zoom);
            expect(comparator).not.toBeNull();
            expect(maps.length).toEqual(2);
            // Verify 1st map.
            expect(maps[0].__constructor__.calls.count()).toEqual(1);
            expect(maps[0].__constructor__.calls.argsFor(0)[0]).toEqual(mapSettings[0].element);
            var map0CreationConfig = maps[0].__constructor__.calls.argsFor(0)[1];
            expect(map0CreationConfig.center).toEqual(mapSettings[0].center);
            expect(map0CreationConfig.zoom).toEqual(zoom);
            expect(map0CreationConfig.disableDoubleClickZoom).toBeTruthy();
            // Verify 2nd map.
            expect(maps[1].__constructor__.calls.count()).toEqual(1);
            expect(maps[1].__constructor__.calls.argsFor(0)[0]).toEqual(mapSettings[1].element);
            var map1CreationConfig = maps[1].__constructor__.calls.argsFor(0)[1];
            expect(map1CreationConfig.center).toEqual(mapSettings[1].center);
            expect(map1CreationConfig.zoom).toEqual(zoom);
            expect(map1CreationConfig.disableDoubleClickZoom).toBeTruthy();
        });

        it("creates markers for reference points and comparison point", function() {
            var comparator = new DistanceComparator.DistanceComparator(mapSettings, zoom);
            expect(markers.length).toEqual(3);
            // Verify comparison point marker.
            expect(markers[0].__constructor__.calls.count()).toEqual(1);
            expect(markers[0].__constructor__.calls.argsFor(0)[0].map).toBeUndefined();
            // Verify 1st reference point marker.
            expect(markers[1].__constructor__.calls.count()).toEqual(1);
            var marker1CreationConfig = markers[1].__constructor__.calls.argsFor(0)[0];
            expect(marker1CreationConfig.position).toEqual(mapSettings[0].center);
            expect(marker1CreationConfig.map).toEqual(maps[0].mockWrapper);
            // Verify 2nd reference point marker.
            expect(markers[2].__constructor__.calls.count()).toEqual(1);
            var marker2CreationConfig = markers[2].__constructor__.calls.argsFor(0)[0];
            expect(marker2CreationConfig.position).toEqual(mapSettings[1].center);
            expect(marker2CreationConfig.map).toEqual(maps[1].mockWrapper);
        });

        it("creates invisible circles for later", function() {
            var comparator = new DistanceComparator.DistanceComparator(mapSettings, zoom);
            expect(circles.length).toEqual(2);
            // Verify 1st circle.
            expect(circles[0].__constructor__.calls.count()).toEqual(1);
            var circle0CreationConfig = circles[0].__constructor__.calls.argsFor(0)[0];
            expect(circle0CreationConfig.center).toEqual(mapSettings[0].center);
            expect(circle0CreationConfig.map).toEqual(maps[0].mockWrapper);
            expect(circle0CreationConfig.visible).toBeFalsy();
            // Verify 2nd circle.
            expect(circles[1].__constructor__.calls.count()).toEqual(1);
            var circle1CreationConfig = circles[1].__constructor__.calls.argsFor(0)[0];
            expect(circle1CreationConfig.center).toEqual(mapSettings[1].center);
            expect(circle1CreationConfig.map).toEqual(maps[1].mockWrapper);
            expect(circle1CreationConfig.visible).toBeFalsy();
        });
    });

    describe("movement and zoom", function() {

    });

    describe("double click", function() {

    });

    describe("dragging reference point", function() {

    });

    describe("dragging comparison point", function() {

    });
});
