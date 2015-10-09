"use strict";

describe("DistanceComparator", function() {
    var maps;
    var markers;
    var circles;
    var searchBoxes;
    var root = document.createElement("div");
    var mapSettings = [
        {
            center: new google.maps.LatLng(0, 0)
        },
        {
            center: new google.maps.LatLng(100, 100)
        }
    ];
    var zoom = 10;

    function mockGoogleMaps() {
        maps = [];
        markers = [];
        circles = [];
        searchBoxes = [];
        google.maps.Map = mockClass("Map", ["getZoom", "setZoom", "getCenter", "setCenter"], maps);
        google.maps.Map.prototype.controls = {};
        google.maps.Map.prototype.controls[google.maps.ControlPosition.TOP_LEFT] = [];
        google.maps.Marker = mockClass("Marker", ["property:Map", "property:Position"], markers);
        google.maps.Circle = mockClass("Circle", ["setRadius", "setVisible", "setCenter"], circles);
        google.maps.places.SearchBox = mockClass("SearchBox", ["getPlaces"], searchBoxes);
        google.maps.event.addDomListener = jasmine.createSpy("addDomListener");
    }

    function mockPlace(lat, lng) {
        var mockPlace = {
            geometry: {}
        };
        mockPlace.geometry.location = new google.maps.LatLng(lat, lng);
        return mockPlace;
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

    function createDistanceComparator() {
        return new DistanceComparator.DistanceComparator(root, mapSettings, zoom);
    }

    beforeEach(mockGoogleMaps);

    //TODO(vsapsai): test all functionality when both reference points
    // specified, 1 point, and no reference points.

    describe("creation", function() {
        it("creates maps according to mapSettings", function() {
            var comparator = createDistanceComparator()
            expect(comparator).not.toBeNull();
            expect(maps.length).toEqual(2);
            // Verify 1st map.
            expect(maps[0].__constructor__.calls.count()).toEqual(1);
            expect(root.contains(maps[0].__constructor__.calls.argsFor(0)[0])).toBe(true);
            expect(maps[0].__constructor__.calls.argsFor(0)[0].classList.contains("map-placeholder")).toBe(true);
            var map0CreationConfig = maps[0].__constructor__.calls.argsFor(0)[1];
            expect(map0CreationConfig.center).toEqual(mapSettings[0].center);
            expect(map0CreationConfig.zoom).toEqual(zoom);
            expect(map0CreationConfig.disableDoubleClickZoom).toBeTruthy();
            // Verify 2nd map.
            expect(maps[1].__constructor__.calls.count()).toEqual(1);
            expect(root.contains(maps[1].__constructor__.calls.argsFor(0)[0])).toBe(true);
            expect(maps[1].__constructor__.calls.argsFor(0)[0].classList.contains("map-placeholder")).toBe(true);
            var map1CreationConfig = maps[1].__constructor__.calls.argsFor(0)[1];
            expect(map1CreationConfig.center).toEqual(mapSettings[1].center);
            expect(map1CreationConfig.zoom).toEqual(zoom);
            expect(map1CreationConfig.disableDoubleClickZoom).toBeTruthy();
        });

        it("creates markers for reference points and comparison point", function() {
            var comparator = createDistanceComparator();
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
            var comparator = createDistanceComparator();
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

        it("creates reference point and comparison point search boxes", function() {
            var comparator = createDistanceComparator();
            expect(searchBoxes.length).toEqual(4);
            var mapControls = google.maps.Map.prototype.controls[google.maps.ControlPosition.TOP_LEFT];
            expect(mapControls.length).toEqual(4);
            // Verify 1st reference point search box.
            expect(searchBoxes[0].__constructor__.calls.count()).toEqual(1);
            var searchBox0Element = searchBoxes[0].__constructor__.calls.argsFor(0)[0];
            expect(mapControls.indexOf(searchBox0Element)).not.toEqual(-1);
            expect(searchBox0Element.tagName).toEqual("INPUT");
            expect(searchBox0Element.getAttribute("type")).toEqual("text");
            expect(searchBox0Element.getAttribute("placeholder")).toMatch(/reference/i);
            // Verify 1st comparison point search box.
            expect(searchBoxes[1].__constructor__.calls.count()).toEqual(1);
            var searchBox1Element = searchBoxes[1].__constructor__.calls.argsFor(0)[0];
            expect(mapControls.indexOf(searchBox1Element)).not.toEqual(-1);
            expect(searchBox1Element.tagName).toEqual("INPUT");
            expect(searchBox1Element.getAttribute("type")).toEqual("text");
            expect(searchBox1Element.getAttribute("placeholder")).toMatch(/comparison/i);
            // Verify 2nd reference point search box.
            expect(searchBoxes[2].__constructor__.calls.count()).toEqual(1);
            var searchBox2Element = searchBoxes[2].__constructor__.calls.argsFor(0)[0];
            expect(mapControls.indexOf(searchBox2Element)).not.toEqual(-1);
            expect(searchBox2Element.tagName).toEqual("INPUT");
            expect(searchBox2Element.getAttribute("type")).toEqual("text");
            expect(searchBox2Element.getAttribute("placeholder")).toMatch(/reference/i);
            // Verify 2nd comparison point search box.
            expect(searchBoxes[3].__constructor__.calls.count()).toEqual(1);
            var searchBox3Element = searchBoxes[3].__constructor__.calls.argsFor(0)[0];
            expect(mapControls.indexOf(searchBox3Element)).not.toEqual(-1);
            expect(searchBox3Element.tagName).toEqual("INPUT");
            expect(searchBox3Element.getAttribute("type")).toEqual("text");
            expect(searchBox3Element.getAttribute("placeholder")).toMatch(/comparison/i);
        });
    });

    describe("movement and zoom", function() {
        it("synchronizes map movement", function() {
            var comparator = createDistanceComparator();
            // Mock movement by 10, 20.
            maps[0].getCenter.and.returnValue(new google.maps.LatLng(10, 20));

            var boundsChangedHandler = getEventHandler(maps[0].mockWrapper, "bounds_changed");
            expect(boundsChangedHandler).toBeDefined();
            boundsChangedHandler();
            expect(maps[1].setCenter.calls.mostRecent().args[0].lat()).toEqual(110);
            expect(maps[1].setCenter.calls.mostRecent().args[0].lng()).toEqual(120);
        });

        it("synchronizes map zoom", function() {
            var comparator = createDistanceComparator();
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
            var comparator = createDistanceComparator();

            var doubleClickHandler = getEventHandler(maps[0].mockWrapper, "dblclick");
            expect(doubleClickHandler).toBeDefined();
            doubleClickHandler({latLng: new google.maps.LatLng(23, 56)});
            expect(markers[0].setPosition.calls.mostRecent().args[0].lat()).toEqual(23);
            expect(markers[0].setPosition.calls.mostRecent().args[0].lng()).toEqual(56);
        });

        it("moves comparison location marker to double clicked map", function() {
            var comparator = createDistanceComparator();
            var mockEvent = {latLng: new google.maps.LatLng(42, 42)};
            var doubleClickHandler1 = getEventHandler(maps[0].mockWrapper, "dblclick");
            doubleClickHandler1(mockEvent);
            expect(markers[0].setMap).toHaveBeenCalledWith(maps[0].mockWrapper);
            var doubleClickHandler2 = getEventHandler(maps[1].mockWrapper, "dblclick");
            doubleClickHandler2(mockEvent);
            expect(markers[0].setMap).toHaveBeenCalledWith(maps[1].mockWrapper);
        });

        it("shows circles with radius as distance from reference point to comparison point", function() {
            var comparator = createDistanceComparator();

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
        it("moves another map to have reference point in the same position relative to the map center", function() {
            var comparator = createDistanceComparator();
            // Simulate dragging reference point by 10, 20 which requires moving
            // another map by the same distance in opposite direction.
            maps[0].getCenter.and.returnValue(mapSettings[0].center);
            markers[1].getPosition.and.returnValue(new google.maps.LatLng(10, 20));

            var dragHandler = getEventHandler(markers[1].mockWrapper, "dragend");
            expect(dragHandler).toBeDefined();
            dragHandler();
            expect(maps[1].setCenter.calls.mostRecent().args[0].lat()).toEqual(90);
            expect(maps[1].setCenter.calls.mostRecent().args[0].lng()).toEqual(80);
            expect(maps[0].setCenter).not.toHaveBeenCalled();
        });

        it("updates circle center on the same map", function() {
            var comparator = createDistanceComparator();
            maps[1].getCenter.and.returnValue(mapSettings[1].center);
            markers[2].getPosition.and.returnValue(new google.maps.LatLng(120, 110));

            var dragHandler = getEventHandler(markers[2].mockWrapper, "dragend");
            expect(dragHandler).toBeDefined();
            dragHandler();
            expect(circles[1].setCenter.calls.mostRecent().args[0].lat()).toEqual(120);
            expect(circles[1].setCenter.calls.mostRecent().args[0].lng()).toEqual(110);
            expect(circles[0].setCenter).not.toHaveBeenCalled();
        });

        it("updates circle radius if the same map has comparison point marker", function() {
            var comparator = createDistanceComparator();
            // Put a comparison point marker.
            var doubleClickHandler = getEventHandler(maps[0].mockWrapper, "dblclick");
            var comparisonPoint = new google.maps.LatLng(10, 0);
            //markers[0].getPosition
            doubleClickHandler({latLng: comparisonPoint});
            // Simulate dragging reference point.
            maps[0].getCenter.and.returnValue(mapSettings[0].center);
            markers[1].getPosition.and.returnValue(new google.maps.LatLng(10, 20));
            var dragHandler = getEventHandler(markers[1].mockWrapper, "dragend");
            dragHandler();

            expect(circles[0].setRadius.calls.count()).toEqual(2);
            expect(circles[0].setRadius.calls.mostRecent().args[0]).toEqual(20);
            expect(circles[0].setCenter.calls.count()).toEqual(1);
            expect(circles[1].setRadius.calls.count()).toEqual(2);
            expect(circles[1].setRadius.calls.mostRecent().args[0]).toEqual(20);
            expect(circles[1].setCenter.calls.count()).toEqual(0);
        });
    });

    describe("dragging comparison point", function() {
        //TODO(vsapsai): add support
    });

    describe("reference point search", function() {
        it("moves map to reflect new reference point", function() {
            var comparator = createDistanceComparator();
            // Simulate the reference point is to the left and to the bottom relative to the map center.
            maps[0].getCenter.and.returnValue(new google.maps.LatLng(10, 20));
            searchBoxes[0].getPlaces.and.returnValue([mockPlace(200, 300)]);

            var searchBoxHandler = getEventHandler(searchBoxes[0].mockWrapper, "places_changed");
            expect(searchBoxHandler).toBeDefined();
            searchBoxHandler();
            expect(maps[0].setCenter.calls.mostRecent().args[0].lat()).toEqual(210);
            expect(maps[0].setCenter.calls.mostRecent().args[0].lng()).toEqual(320);
        });

        it("updates reference point marker and circle", function() {
            var comparator = createDistanceComparator();
            // Simulate the reference point is to the left and to the bottom relative to the map center.
            maps[0].getCenter.and.returnValue(mapSettings[0].center);
            searchBoxes[0].getPlaces.and.returnValue([mockPlace(10, 20)]);

            var searchBoxHandler = getEventHandler(searchBoxes[0].mockWrapper, "places_changed");
            searchBoxHandler();
            expect(markers[1].setPosition.calls.mostRecent().args[0].lat()).toEqual(10);
            expect(markers[1].setPosition.calls.mostRecent().args[0].lng()).toEqual(20);
            expect(markers[2].setPosition).not.toHaveBeenCalled();
            expect(circles[0].setCenter.calls.mostRecent().args[0].lat()).toEqual(10);
            expect(circles[0].setCenter.calls.mostRecent().args[0].lng()).toEqual(20);
            expect(circles[1].setCenter).not.toHaveBeenCalled();
        });
    });

    describe("comparison point search", function() {
        it("puts comparison location marker on place location", function() {
            var comparator = createDistanceComparator();
            searchBoxes[1].getPlaces.and.returnValue([mockPlace(23, 56)]);

            var searchBoxHandler = getEventHandler(searchBoxes[1].mockWrapper, "places_changed");
            expect(searchBoxHandler).toBeDefined();
            searchBoxHandler();
            expect(markers[0].setPosition.calls.mostRecent().args[0].lat()).toEqual(23);
            expect(markers[0].setPosition.calls.mostRecent().args[0].lng()).toEqual(56);
        });

        it("moves comparison location marker to map where searched for comparison point", function() {
            var comparator = createDistanceComparator();
            searchBoxes[1].getPlaces.and.returnValue([mockPlace(23, 56)]);
            searchBoxes[3].getPlaces.and.returnValue([mockPlace(23, 56)]);

            var searchBoxHandler1 = getEventHandler(searchBoxes[1].mockWrapper, "places_changed");
            searchBoxHandler1();
            expect(markers[0].setMap).toHaveBeenCalledWith(maps[0].mockWrapper);
            var searchBoxHandler2 = getEventHandler(searchBoxes[3].mockWrapper, "places_changed");
            searchBoxHandler2();
            expect(markers[0].setMap).toHaveBeenCalledWith(maps[1].mockWrapper);
        });

        it("shows circles with radius as distance from reference point to comparison point", function() {
            var comparator = createDistanceComparator();
            searchBoxes[3].getPlaces.and.returnValue([mockPlace(130, 140)]);

            var searchBoxHandler = getEventHandler(searchBoxes[3].mockWrapper, "places_changed");
            expect(searchBoxHandler).toBeDefined();
            searchBoxHandler();
            expect(circles[0].setRadius).toHaveBeenCalledWith(50);
            expect(circles[0].setVisible).toHaveBeenCalledWith(true);
            expect(circles[1].setRadius).toHaveBeenCalledWith(50);
            expect(circles[1].setVisible).toHaveBeenCalledWith(true);
        });
    });

    describe("state", function() {
        it("contains current zoom", function() {
            var comparator = createDistanceComparator();
            var currentZoom = 7;
            maps[0].getZoom.and.returnValue(currentZoom);
            maps[0].getCenter.and.returnValue(mapSettings[0].center);

            expect(comparator.getState().zoom).toEqual(currentZoom);
        });

        it("contains center offset when has a reference point", function() {
            var comparator = createDistanceComparator();
            maps[0].getCenter.and.returnValue(new google.maps.LatLng(10, 20));

            var centerOffset = comparator.getState().centerOffset;
            expect(centerOffset.latDiff).toEqual(10);
            expect(centerOffset.lngDiff).toEqual(20);
        });

        //TODO(vsapsai): add when don't require reference points
        it("does not contain center offset when has no reference points", function() {});

        it("contains comparison point when present", function() {
            var comparator = createDistanceComparator();
            maps[0].getCenter.and.returnValue(mapSettings[0].center);
            var doubleClickHandler = getEventHandler(maps[1].mockWrapper, "dblclick");
            doubleClickHandler({latLng: new google.maps.LatLng(23, 56)});

            var comparisonPoint = comparator.getState().comparisonPoint;
            expect(comparisonPoint.mapIndex).toEqual(1);
            expect(comparisonPoint.position.lat()).toEqual(23);
            expect(comparisonPoint.position.lng()).toEqual(56);
        });

        it("does not contain comparison point when absent", function() {
            var comparator = createDistanceComparator();
            maps[0].getCenter.and.returnValue(mapSettings[0].center);
            expect(comparator.getState().comparisonPoint).toBeUndefined();
        });

        describe("map state", function() {
            it("has state for all maps", function() {
                var comparator = createDistanceComparator();
                maps[0].getCenter.and.returnValue(mapSettings[0].center);
                expect(comparator.getState().maps).toBeDefined();
                expect(comparator.getState().maps.length).toEqual(2);
            });

            it("contains reference point when present", function() {
                var comparator = createDistanceComparator();
                maps[0].getCenter.and.returnValue(mapSettings[0].center);
                var mapsState = comparator.getState().maps;
                var i;
                for (i = 0; i < mapsState.length; i++) {
                    expect(mapsState[i].referencePoint).toBeDefined();
                    expect(mapsState[i].referencePoint.lat()).toEqual(mapSettings[i].center.lat());
                    expect(mapsState[i].referencePoint.lng()).toEqual(mapSettings[i].center.lng());
                }
            });

            //TODO(vsapsai): add when don't require reference points
            it("contains center position when reference point is absent", function() {});
        });
    });
});
