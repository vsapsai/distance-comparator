"use strict";

describe("DistanceComparator", function() {
    var maps;
    var markers;
    var circles;
    var mapSettings = [
        {
            center: new google.maps.LatLng(0, 0),
            element: "element1"
        },
        {
            center: new google.maps.LatLng(100, 100),
            element: "element2"
        }
    ];
    var zoom = 10;

    function mockGoogleMaps() {
        maps = [];
        markers = [];
        circles = [];
        google.maps.Map = mockClass("Map", ["getZoom", "setZoom", "getCenter", "setCenter"], maps);
        google.maps.Marker = mockClass("Marker", ["setMap", "setPosition"], markers);
        google.maps.Circle = mockClass("Circle", ["setRadius", "setVisible"], circles);
        google.maps.event.addDomListener = jasmine.createSpy("addDomListener");
    }

    function getEventHandler(instance, eventName) {
        var calls = google.maps.event.addDomListener.calls;
        var i;
        for (i = 0; i < calls.count(); i++) {
            var callArgs = calls.argsFor(i);
            if ((instance === callArgs[0]) && (eventName === callArgs[1])) {
                return callArgs[2];
            }
        }
        return undefined;
    }

    beforeEach(mockGoogleMaps);

    //TODO(vsapsai): test all functionality when both reference points
    // specified, 1 point, and no reference points.

    describe("creation", function() {
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
            expect(circle0CreationConfig.clickable).toEqual(false);
            // Verify 2nd circle.
            expect(circles[1].__constructor__.calls.count()).toEqual(1);
            var circle1CreationConfig = circles[1].__constructor__.calls.argsFor(0)[0];
            expect(circle1CreationConfig.center).toEqual(mapSettings[1].center);
            expect(circle1CreationConfig.map).toEqual(maps[1].mockWrapper);
            expect(circle1CreationConfig.visible).toBeFalsy();
            expect(circle1CreationConfig.clickable).toEqual(false);
        });
    });

    describe("movement and zoom", function() {
        it("synchronizes map movement", function() {
            var comparator = new DistanceComparator.DistanceComparator(mapSettings, zoom);
            // Mock movement by 10, 20.
            maps[0].getCenter.and.returnValue(new google.maps.LatLng(10, 20));

            var boundsChangedHandler = getEventHandler(maps[0].mockWrapper, "bounds_changed");
            expect(boundsChangedHandler).toBeDefined();
            boundsChangedHandler();
            expect(maps[1].setCenter.calls.mostRecent().args[0].lat()).toEqual(110);
            expect(maps[1].setCenter.calls.mostRecent().args[0].lng()).toEqual(120);
        });

        it("synchronizes map zoom", function() {
            var comparator = new DistanceComparator.DistanceComparator(mapSettings, zoom);
            var newZoom = 42;
            maps[1].getZoom.and.returnValue(newZoom);
            maps[1].getCenter.and.returnValue(mapSettings[1].center);

            var boundsChangedHandler = getEventHandler(maps[1].mockWrapper, "bounds_changed");
            expect(boundsChangedHandler).toBeDefined();
            boundsChangedHandler();
            expect(maps[0].setZoom.calls.mostRecent().args[0]).toEqual(newZoom);
        });
    });

    describe("double click", function() {
        it("puts comparison location marker on double click point", function() {
            var comparator = new DistanceComparator.DistanceComparator(mapSettings, zoom);

            var doubleClickHandler = getEventHandler(maps[0].mockWrapper, "dblclick");
            expect(doubleClickHandler).toBeDefined();
            doubleClickHandler({latLng: new google.maps.LatLng(23, 56)});
            expect(markers[0].setPosition.calls.mostRecent().args[0].lat()).toEqual(23);
            expect(markers[0].setPosition.calls.mostRecent().args[0].lng()).toEqual(56);
        });

        it("moves comparison location marker to double clicked map", function() {
            var comparator = new DistanceComparator.DistanceComparator(mapSettings, zoom);
            var mockEvent = {latLng: new google.maps.LatLng(42, 42)};
            var doubleClickHandler1 = getEventHandler(maps[0].mockWrapper, "dblclick");
            doubleClickHandler1(mockEvent);
            expect(markers[0].setMap).toHaveBeenCalledWith(maps[0].mockWrapper);
            var doubleClickHandler2 = getEventHandler(maps[1].mockWrapper, "dblclick");
            doubleClickHandler2(mockEvent);
            expect(markers[0].setMap).toHaveBeenCalledWith(maps[1].mockWrapper);
        });

        it("shows circles with radius as distance from reference point to comparison point", function() {
            var comparator = new DistanceComparator.DistanceComparator(mapSettings, zoom);

            var doubleClickHandler = getEventHandler(maps[1].mockWrapper, "dblclick");
            expect(doubleClickHandler).toBeDefined();
            doubleClickHandler({latLng: new google.maps.LatLng(130, 140)});
            expect(circles[0].setRadius).toHaveBeenCalledWith(50);
            expect(circles[0].setVisible).toHaveBeenCalledWith(true);
            expect(circles[1].setRadius).toHaveBeenCalledWith(50);
            expect(circles[1].setVisible).toHaveBeenCalledWith(true);
        });
    });

    describe("dragging reference point", function() {

    });

    describe("dragging comparison point", function() {

    });
});
