"use strict";

describe("DistanceComparator", function() {
    var maps;
    var markers;
    var circles;
    var searchBoxes;
    var root = document.createElement("div");
    var mapSettings = {
        zoom: 10,
        maps: [
            {
                referencePoint: new google.maps.LatLng(0, 0)
            },
            {
                referencePoint: new google.maps.LatLng(100, 100)
            }
        ]
    };

    function mockGoogleMaps() {
        maps = [];
        markers = [];
        circles = [];
        searchBoxes = [];
        google.maps.Map = mockClass("Map", ["getZoom", "setZoom", "getCenter", "setCenter"], maps);
        google.maps.Map.prototype.controls = {};
        google.maps.Map.prototype.controls[google.maps.ControlPosition.TOP_LEFT] = [];
        google.maps.Marker = mockClass("Marker", ["property:Map", "property:Position", "setVisible"], markers);
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
        return new DistanceComparator.DistanceComparator(root, mapSettings);
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
            expect(map0CreationConfig.center).toEqual(mapSettings.maps[0].referencePoint);
            expect(map0CreationConfig.zoom).toEqual(mapSettings.zoom);
            expect(map0CreationConfig.disableDoubleClickZoom).toBeTruthy();
            // Verify 2nd map.
            expect(maps[1].__constructor__.calls.count()).toEqual(1);
            expect(root.contains(maps[1].__constructor__.calls.argsFor(0)[0])).toBe(true);
            expect(maps[1].__constructor__.calls.argsFor(0)[0].classList.contains("map-placeholder")).toBe(true);
            var map1CreationConfig = maps[1].__constructor__.calls.argsFor(0)[1];
            expect(map1CreationConfig.center).toEqual(mapSettings.maps[1].referencePoint);
            expect(map1CreationConfig.zoom).toEqual(mapSettings.zoom);
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
            expect(marker1CreationConfig.position).toEqual(mapSettings.maps[0].referencePoint);
            expect(marker1CreationConfig.map).toEqual(maps[0].mockWrapper);
            expect(marker1CreationConfig.visible).toBeTruthy();
            // Verify 2nd reference point marker.
            expect(markers[2].__constructor__.calls.count()).toEqual(1);
            var marker2CreationConfig = markers[2].__constructor__.calls.argsFor(0)[0];
            expect(marker2CreationConfig.position).toEqual(mapSettings.maps[1].referencePoint);
            expect(marker2CreationConfig.map).toEqual(maps[1].mockWrapper);
            expect(marker2CreationConfig.visible).toBeTruthy();
        });

        it("creates invisible circles for later", function() {
            var comparator = createDistanceComparator();
            expect(circles.length).toEqual(2);
            // Verify 1st circle.
            expect(circles[0].__constructor__.calls.count()).toEqual(1);
            var circle0CreationConfig = circles[0].__constructor__.calls.argsFor(0)[0];
            expect(circle0CreationConfig.center).toEqual(mapSettings.maps[0].referencePoint);
            expect(circle0CreationConfig.map).toEqual(maps[0].mockWrapper);
            expect(circle0CreationConfig.visible).toBeFalsy();
            expect(circle0CreationConfig.clickable).toEqual(false);
            // Verify 2nd circle.
            expect(circles[1].__constructor__.calls.count()).toEqual(1);
            var circle1CreationConfig = circles[1].__constructor__.calls.argsFor(0)[0];
            expect(circle1CreationConfig.center).toEqual(mapSettings.maps[1].referencePoint);
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

        describe("without settings", function() {
            var comparator;
            beforeEach(function() {
                comparator = new DistanceComparator.DistanceComparator(root);
            });

            it("provides default values for map zoom and center as these values are required", function() {
                expect(maps.length).toEqual(2);
                // Verify 1st map.
                var map0CreationConfig = maps[0].__constructor__.calls.argsFor(0)[1];
                expect(map0CreationConfig.center).toBeDefined();
                expect(map0CreationConfig.zoom).toBeDefined();
                // Verify 2nd map.
                var map1CreationConfig = maps[1].__constructor__.calls.argsFor(0)[1];
                expect(map1CreationConfig.center).toBeDefined();
                expect(map1CreationConfig.zoom).toBeDefined();
            });

            it("creates reference point markers invisible and without position", function() {
                // Verify 1st reference point marker.
                var marker1CreationConfig = markers[1].__constructor__.calls.argsFor(0)[0];
                expect(marker1CreationConfig.position).toBeUndefined();
                expect(marker1CreationConfig.visible).toBeFalsy();
                // Verify 2nd reference point marker.
                var marker2CreationConfig = markers[2].__constructor__.calls.argsFor(0)[0];
                expect(marker2CreationConfig.position).toBeUndefined();
                expect(marker2CreationConfig.visible).toBeFalsy();
            });

            it("creates circles without positions", function() {
                // Verify 1st circle.
                var circle0CreationConfig = circles[0].__constructor__.calls.argsFor(0)[0];
                expect(circle0CreationConfig.center).toBeUndefined();
                // Verify 2nd circle.
                var circle1CreationConfig = circles[1].__constructor__.calls.argsFor(0)[0];
                expect(circle1CreationConfig.center).toBeUndefined();
            });
        });

        it("creates only 2 maps regardless of number of map settings", function() {
            var mapConfigs = [
                {
                    referencePoint: new google.maps.LatLng(0, 0)
                },
                {
                    referencePoint: new google.maps.LatLng(10, 10)
                },
                {
                    referencePoint: new google.maps.LatLng(20, 20)
                }
            ];
            var comparator = new DistanceComparator.DistanceComparator(root, {maps: mapConfigs});
            expect(maps.length).toEqual(2);
            // Verify 1st map.
            var map0CreationConfig = maps[0].__constructor__.calls.argsFor(0)[1];
            expect(map0CreationConfig.center).toEqual(mapConfigs[0].referencePoint);
            // Verify 2nd map.
            var map1CreationConfig = maps[1].__constructor__.calls.argsFor(0)[1];
            expect(map1CreationConfig.center).toEqual(mapConfigs[1].referencePoint);
        });
    });

    describe("movement and zoom", function() {
        function invokeMovementEventHandlers(map) {
            var boundsChangedHandler = getEventHandler(map.mockWrapper, "bounds_changed");
            expect(boundsChangedHandler).toBeDefined();
            boundsChangedHandler();
            var idleHandler = getEventHandler(map.mockWrapper, "idle");
            expect(idleHandler).toBeDefined();
            idleHandler();
        }

        it("synchronizes map movement", function() {
            var comparator = createDistanceComparator();
            // Mock movement by 10, 20.
            maps[0].getCenter.and.returnValue(new google.maps.LatLng(10, 20));

            invokeMovementEventHandlers(maps[0]);
            expect(maps[1].setCenter.calls.mostRecent().args[0].lat()).toEqual(110);
            expect(maps[1].setCenter.calls.mostRecent().args[0].lng()).toEqual(120);
        });

        it("synchronizes map zoom", function() {
            var comparator = createDistanceComparator();
            var newZoom = 42;
            maps[1].getZoom.and.returnValue(newZoom);
            maps[1].getCenter.and.returnValue(mapSettings.maps[1].referencePoint);

            invokeMovementEventHandlers(maps[1]);
            expect(maps[0].setZoom.calls.mostRecent().args[0]).toEqual(newZoom);
        });

        it("moves maps without reference points independently", function() {
            var comparator = new DistanceComparator.DistanceComparator(root, {maps: [{
                referencePoint: new google.maps.LatLng(0, 0)
            }]});

            // Mock moving the 1st map.
            maps[0].getCenter.and.returnValue(new google.maps.LatLng(10, 20));
            invokeMovementEventHandlers(maps[0]);
            expect(maps[1].setCenter).not.toHaveBeenCalled();
            // Mock moving the 2nd map.
            maps[1].getCenter.and.returnValue(new google.maps.LatLng(100, 500));
            invokeMovementEventHandlers(maps[1]);
            expect(maps[0].setCenter).not.toHaveBeenCalled();
        });

        it("synchronizes map zoom regardless of reference points", function() {
            var comparator = new DistanceComparator.DistanceComparator(root);
            var newZoom = 42;
            maps[1].getZoom.and.returnValue(newZoom);
            maps[1].getCenter.and.returnValue(mapSettings.maps[1].referencePoint);

            invokeMovementEventHandlers(maps[1]);
            expect(maps[0].setZoom.calls.mostRecent().args[0]).toEqual(newZoom);
        });

        it("changes state", function() {
            var comparator = createDistanceComparator();
            var stateChangeHandler = jasmine.createSpy("stateChangeHandler");
            comparator.setStateChangeHandler(stateChangeHandler);
            maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint);

            invokeMovementEventHandlers(maps[0]);
            expect(stateChangeHandler).toHaveBeenCalled();
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

        it("changes state", function() {
            var comparator = createDistanceComparator();
            var stateChangeHandler = jasmine.createSpy("stateChangeHandler");
            comparator.setStateChangeHandler(stateChangeHandler);
            maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint);

            var doubleClickHandler = getEventHandler(maps[1].mockWrapper, "dblclick");
            doubleClickHandler({latLng: new google.maps.LatLng(130, 140)});
            expect(stateChangeHandler).toHaveBeenCalled();
        });
    });

    describe("dragging reference point", function() {
        it("moves another map to have reference point in the same position relative to the map center", function() {
            var comparator = createDistanceComparator();
            // Simulate dragging reference point by 10, 20 which requires moving
            // another map by the same distance in opposite direction.
            maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint);
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
            maps[1].getCenter.and.returnValue(mapSettings.maps[1].referencePoint);
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
            maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint);
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

        it("changes state", function() {
            var comparator = createDistanceComparator();
            var stateChangeHandler = jasmine.createSpy("stateChangeHandler");
            comparator.setStateChangeHandler(stateChangeHandler);
            maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint);
            markers[1].getPosition.and.returnValue(new google.maps.LatLng(10, 20));

            var dragHandler = getEventHandler(markers[1].mockWrapper, "dragend");
            dragHandler();
            expect(stateChangeHandler).toHaveBeenCalled();
        });
    });

    describe("dragging comparison point", function() {
        //TODO(vsapsai): add support
    });

    describe("reference point search", function() {
        describe("moves map to reflect new reference point", function() {
            it("both maps have reference points", function() {
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

            it("another map has a reference point", function() {
                var comparator = new DistanceComparator.DistanceComparator(root, {maps: [
                    {},
                    {referencePoint: mapSettings.maps[1].referencePoint}
                ]});
                // Simulate the reference point is to the left and to the bottom relative to the map center.
                maps[1].getCenter.and.returnValue(new google.maps.LatLng(110, 120));
                searchBoxes[0].getPlaces.and.returnValue([mockPlace(50, 60)]);

                var searchBoxHandler = getEventHandler(searchBoxes[0].mockWrapper, "places_changed");
                searchBoxHandler();
                expect(maps[0].setCenter.calls.mostRecent().args[0].lat()).toEqual(60);
                expect(maps[0].setCenter.calls.mostRecent().args[0].lng()).toEqual(80);
            });

            it("no map has a reference point", function() {
                var comparator = new DistanceComparator.DistanceComparator(root);
                searchBoxes[0].getPlaces.and.returnValue([mockPlace(10, 20)]);

                var searchBoxHandler = getEventHandler(searchBoxes[0].mockWrapper, "places_changed");
                searchBoxHandler();
                expect(maps[0].setCenter.calls.mostRecent().args[0].lat()).toEqual(10);
                expect(maps[0].setCenter.calls.mostRecent().args[0].lng()).toEqual(20);
            });
        });

        it("updates reference point marker and circle", function() {
            var comparator = createDistanceComparator();
            // Simulate the reference point is to the left and to the bottom relative to the map center.
            maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint);
            searchBoxes[0].getPlaces.and.returnValue([mockPlace(10, 20)]);

            var searchBoxHandler = getEventHandler(searchBoxes[0].mockWrapper, "places_changed");
            searchBoxHandler();
            expect(markers[1].setPosition.calls.mostRecent().args[0].lat()).toEqual(10);
            expect(markers[1].setPosition.calls.mostRecent().args[0].lng()).toEqual(20);
            expect(markers[1].setVisible).toHaveBeenCalledWith(true);
            expect(markers[2].setPosition).not.toHaveBeenCalled();
            expect(markers[2].setVisible).not.toHaveBeenCalled();
            expect(circles[0].setCenter.calls.mostRecent().args[0].lat()).toEqual(10);
            expect(circles[0].setCenter.calls.mostRecent().args[0].lng()).toEqual(20);
            expect(circles[1].setCenter).not.toHaveBeenCalled();
        });

        it("changes state", function() {
            var comparator = createDistanceComparator();
            var stateChangeHandler = jasmine.createSpy("stateChangeHandler");
            comparator.setStateChangeHandler(stateChangeHandler);
            maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint);
            searchBoxes[0].getPlaces.and.returnValue([mockPlace(200, 300)]);

            var searchBoxHandler = getEventHandler(searchBoxes[0].mockWrapper, "places_changed");
            searchBoxHandler();
            expect(stateChangeHandler).toHaveBeenCalled();
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

        it("changes state", function() {
            var comparator = createDistanceComparator();
            var stateChangeHandler = jasmine.createSpy("stateChangeHandler");
            comparator.setStateChangeHandler(stateChangeHandler);
            maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint);
            searchBoxes[3].getPlaces.and.returnValue([mockPlace(130, 140)]);

            var searchBoxHandler = getEventHandler(searchBoxes[3].mockWrapper, "places_changed");
            searchBoxHandler();
            expect(stateChangeHandler).toHaveBeenCalled();
        });
    });

    describe("state", function() {
        it("contains current zoom", function() {
            var comparator = createDistanceComparator();
            var currentZoom = 7;
            maps[0].getZoom.and.returnValue(currentZoom);
            maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint);

            expect(comparator.getState().zoom).toEqual(currentZoom);
        });

        it("contains center offset when has a reference point", function() {
            var comparator = createDistanceComparator();
            maps[0].getCenter.and.returnValue(new google.maps.LatLng(10, 20));

            var centerOffset = comparator.getState().centerOffset;
            expect(centerOffset.latDiff).toEqual(10);
            expect(centerOffset.lngDiff).toEqual(20);
        });

        it("contains center offset when at least 1 map has a reference point", function() {
            var comparator = new DistanceComparator.DistanceComparator(root, {maps: [
                {},
                {referencePoint: mapSettings.maps[1].referencePoint}
            ]});
            maps[1].getCenter.and.returnValue(new google.maps.LatLng(110, 120));

            var centerOffset = comparator.getState().centerOffset;
            expect(centerOffset).toBeDefined();
            expect(centerOffset.latDiff).toEqual(10);
            expect(centerOffset.lngDiff).toEqual(20);
        });

        it("does not contain center offset when has no reference points", function() {
            var comparator = new DistanceComparator.DistanceComparator(root);
            var centerOffset = comparator.getState().centerOffset;
            expect(centerOffset).toBeUndefined();
        });

        it("contains comparison point when present", function() {
            var comparator = createDistanceComparator();
            maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint);
            var doubleClickHandler = getEventHandler(maps[1].mockWrapper, "dblclick");
            doubleClickHandler({latLng: new google.maps.LatLng(23, 56)});

            var comparisonPoint = comparator.getState().comparisonPoint;
            expect(comparisonPoint.mapIndex).toEqual(1);
            expect(comparisonPoint.position.lat()).toEqual(23);
            expect(comparisonPoint.position.lng()).toEqual(56);
        });

        it("does not contain comparison point when absent", function() {
            var comparator = createDistanceComparator();
            maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint);
            expect(comparator.getState().comparisonPoint).toBeUndefined();
        });

        describe("map state", function() {
            it("has state for all maps", function() {
                var comparator = createDistanceComparator();
                maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint);
                expect(comparator.getState().maps).toBeDefined();
                expect(comparator.getState().maps.length).toEqual(2);
            });

            it("contains reference point when present", function() {
                var comparator = createDistanceComparator();
                maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint);
                var mapsState = comparator.getState().maps;
                var i;
                for (i = 0; i < mapsState.length; i++) {
                    expect(mapsState[i].referencePoint).toBeDefined();
                    expect(mapsState[i].referencePoint.lat()).toEqual(mapSettings.maps[i].referencePoint.lat());
                    expect(mapsState[i].referencePoint.lng()).toEqual(mapSettings.maps[i].referencePoint.lng());
                }
            });

            //TODO(vsapsai): add when don't require reference points
            it("contains center position when reference point is absent", function() {});
        });
    });
});

describe("state <-> string conversion", function() {
    describe("encodeStateToString", function() {
        it("encodes zoom", function() {
            expect(DistanceComparator.encodeStateToString({zoom: 7})).toEqual("zoom=7");
        });

        it("encodes center offset", function() {
            var offset = {latDiff: 0.1234567, lngDiff: -0.1234567};
            expect(DistanceComparator.encodeStateToString({centerOffset: offset}))
                .toEqual("offset=0.123457,-0.123457");
        });

        it("encodes comparison point", function() {
            var comparisonPoint = {
                mapIndex: 3,
                position: new google.maps.LatLng(0.1234567, -0.1234567)
            };
            expect(DistanceComparator.encodeStateToString({comparisonPoint: comparisonPoint}))
                .toEqual("comparison3=0.123457,-0.123457");
        });

        it("encodes maps' reference points", function() {
            var mapState = {
                referencePoint: new google.maps.LatLng(0.1234567, -0.1234567)
            };
            expect(DistanceComparator.encodeStateToString({maps: [mapState]}))
                .toEqual("ref0=0.123457,-0.123457");
        });

        it("separates components with &", function() {
            var offset = {latDiff: 0.1234567, lngDiff: -0.1234567};
            var state = {
                zoom: 5,
                centerOffset: offset
            };
            expect(DistanceComparator.encodeStateToString(state))
                .toEqual("zoom=5&offset=0.123457,-0.123457");
        });
    });
});
