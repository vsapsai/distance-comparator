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
                referencePoint: {
                    position: new google.maps.LatLng(0, 0)
                }
            },
            {
                referencePoint: {
                    position: new google.maps.LatLng(100, 100)
                }
            }
        ]
    };

    function mockGoogleMaps() {
        maps = [];
        markers = [];
        circles = [];
        searchBoxes = [];
        google.maps.Map = mockClass("Map", ["getZoom", "setZoom", "getCenter", "setCenter",
            "getBounds", "fitBounds"], maps);
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

    function getMapSettings(names) {
        var result = {
            maps: [
                {
                    referencePoint: {
                        position: new google.maps.LatLng(0, 0)
                    }
                },
                {
                    referencePoint: {
                        position: new google.maps.LatLng(100, 100)
                    }
                }
            ]
        };
        if (names) {
            result.maps[0].referencePoint.name = names[0];
            result.maps[1].referencePoint.name = names[1];
        }
        return result;
    }

    function getComparisonPointMapSettings(name) {
        var result = {
            comparisonPoint: {
                mapIndex: 0,
                position: new google.maps.LatLng(10, 20)
            }
        };
        if (name) {
            result.comparisonPoint.name = name;
        }
        return result;
    }

    function InfiniteBounds() {}
    InfiniteBounds.prototype.contains = function() { return true; };

    function createDistanceComparator() {
        return new DistanceComparator.DistanceComparator(root, mapSettings);
    }

    function createDistanceComparatorWithComparisonPoint() {
        return new DistanceComparator.DistanceComparator(root, getComparisonPointMapSettings());
    }

    beforeEach(mockGoogleMaps);

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
            expect(map0CreationConfig.center).toEqual(mapSettings.maps[0].referencePoint.position);
            expect(map0CreationConfig.zoom).toEqual(mapSettings.zoom);
            expect(map0CreationConfig.disableDoubleClickZoom).toBeTruthy();
            // Verify 2nd map.
            expect(maps[1].__constructor__.calls.count()).toEqual(1);
            expect(root.contains(maps[1].__constructor__.calls.argsFor(0)[0])).toBe(true);
            expect(maps[1].__constructor__.calls.argsFor(0)[0].classList.contains("map-placeholder")).toBe(true);
            var map1CreationConfig = maps[1].__constructor__.calls.argsFor(0)[1];
            expect(map1CreationConfig.center).toEqual(mapSettings.maps[1].referencePoint.position);
            expect(map1CreationConfig.zoom).toEqual(mapSettings.zoom);
            expect(map1CreationConfig.disableDoubleClickZoom).toBeTruthy();
        });

        it("creates markers for reference points and comparison point", function() {
            var comparator = createDistanceComparator();
            expect(markers.length).toEqual(3);
            // Verify comparison point marker.
            expect(markers[0].__constructor__.calls.count()).toEqual(1);
            expect(markers[0].__constructor__.calls.argsFor(0)[0].map).toBeUndefined();
            var marker0CreationConfig = markers[0].__constructor__.calls.argsFor(0)[0];
            expect(marker0CreationConfig.draggable).toBeTruthy();
            // Verify 1st reference point marker.
            expect(markers[1].__constructor__.calls.count()).toEqual(1);
            var marker1CreationConfig = markers[1].__constructor__.calls.argsFor(0)[0];
            expect(marker1CreationConfig.position).toEqual(mapSettings.maps[0].referencePoint.position);
            expect(marker1CreationConfig.map).toEqual(maps[0].mockWrapper);
            expect(marker1CreationConfig.visible).toBeTruthy();
            expect(marker1CreationConfig.draggable).toBeTruthy();
            // Verify 2nd reference point marker.
            expect(markers[2].__constructor__.calls.count()).toEqual(1);
            var marker2CreationConfig = markers[2].__constructor__.calls.argsFor(0)[0];
            expect(marker2CreationConfig.position).toEqual(mapSettings.maps[1].referencePoint.position);
            expect(marker2CreationConfig.map).toEqual(maps[1].mockWrapper);
            expect(marker2CreationConfig.visible).toBeTruthy();
            expect(marker2CreationConfig.draggable).toBeTruthy();
        });

        it("creates comparison point with specified settings", function() {
            var comparisonPoint = {
                mapIndex: 1,
                position: new google.maps.LatLng(10, 20)
            };
            var comparator = new DistanceComparator.DistanceComparator(root, { comparisonPoint: comparisonPoint });

            expect(markers[0].setPosition).toHaveBeenCalledWith(comparisonPoint.position);
            expect(markers[0].setMap).toHaveBeenCalledWith(maps[1].mockWrapper);
        });

        describe("does not create comparison point with invalid settings", function() {
            it("negative map index", function() {
                var comparator = new DistanceComparator.DistanceComparator(root, {
                    comparisonPoint: {
                        mapIndex: -7,
                        position: new google.maps.LatLng(10, 20)
                    }
                });

                expect(markers[0].setPosition).not.toHaveBeenCalled();
                expect(markers[0].setMap).not.toHaveBeenCalled();
            });

            it("too big map index", function() {
                var comparator = new DistanceComparator.DistanceComparator(root, {
                    comparisonPoint: {
                        mapIndex: 2,
                        position: new google.maps.LatLng(10, 20)
                    }
                });

                expect(markers[0].setPosition).not.toHaveBeenCalled();
                expect(markers[0].setMap).not.toHaveBeenCalled();
            });

            it("no position", function() {
                var comparator = new DistanceComparator.DistanceComparator(root, {
                    comparisonPoint: {
                        mapIndex: 0
                    }
                });

                expect(markers[0].setPosition).not.toHaveBeenCalled();
                expect(markers[0].setMap).not.toHaveBeenCalled();
            });
        });

        it("creates invisible circles for later", function() {
            var comparator = createDistanceComparator();
            expect(circles.length).toEqual(2);
            // Verify 1st circle.
            expect(circles[0].__constructor__.calls.count()).toEqual(1);
            var circle0CreationConfig = circles[0].__constructor__.calls.argsFor(0)[0];
            expect(circle0CreationConfig.center).toEqual(mapSettings.maps[0].referencePoint.position);
            expect(circle0CreationConfig.map).toEqual(maps[0].mockWrapper);
            expect(circle0CreationConfig.visible).toBeFalsy();
            expect(circle0CreationConfig.clickable).toEqual(false);
            // Verify 2nd circle.
            expect(circles[1].__constructor__.calls.count()).toEqual(1);
            var circle1CreationConfig = circles[1].__constructor__.calls.argsFor(0)[0];
            expect(circle1CreationConfig.center).toEqual(mapSettings.maps[1].referencePoint.position);
            expect(circle1CreationConfig.map).toEqual(maps[1].mockWrapper);
            expect(circle1CreationConfig.visible).toBeFalsy();
            expect(circle1CreationConfig.clickable).toEqual(false);
        });

        it("creates visible circles if comparison point and reference points are specified", function() {
            var comparisonPoint = {
                mapIndex: 0,
                position: new google.maps.LatLng(30, 40)
            };
            var comparator = new DistanceComparator.DistanceComparator(root, {
                comparisonPoint: comparisonPoint,
                maps: mapSettings.maps
            });
            expect(circles[0].setRadius).toHaveBeenCalledWith(50);
            expect(circles[0].setVisible).toHaveBeenCalledWith(true);
            expect(circles[1].setRadius).toHaveBeenCalledWith(50);
            expect(circles[1].setVisible).toHaveBeenCalledWith(true);
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

        it("creates reference point search boxes with specified names", function() {
            var comparator = new DistanceComparator.DistanceComparator(root,
                getMapSettings(["ref point 0", "ref point 1"]));
            var searchBox0Element = searchBoxes[0].__constructor__.calls.argsFor(0)[0];
            expect(searchBox0Element.value).toEqual("ref point 0");
            var searchBox2Element = searchBoxes[2].__constructor__.calls.argsFor(0)[0];
            expect(searchBox2Element.value).toEqual("ref point 1");
        });

        it("creates empty reference point search boxes if positions are absent", function() {
            var settings = getMapSettings(["ref point 0", "ref point 1"]);
            settings.maps[0].referencePoint.position = undefined;
            settings.maps[1].referencePoint.position = undefined;
            var comparator = new DistanceComparator.DistanceComparator(root, settings);
            var searchBox0Element = searchBoxes[0].__constructor__.calls.argsFor(0)[0];
            expect(searchBox0Element.value).toEqual("");
            var searchBox2Element = searchBoxes[2].__constructor__.calls.argsFor(0)[0];
            expect(searchBox2Element.value).toEqual("");
        });

        it("creates comparison point search boxes with specified names", function() {
            var comparator = new DistanceComparator.DistanceComparator(root, getComparisonPointMapSettings("point"));
            var searchBox1Element = searchBoxes[1].__constructor__.calls.argsFor(0)[0];
            expect(searchBox1Element.value).toEqual("point");
        });

        it("creates empty comparison point search boxes if positions are absent", function() {
            var settings = getComparisonPointMapSettings("point");
            settings.comparisonPoint.position = undefined;
            var comparator = new DistanceComparator.DistanceComparator(root, settings);
            var searchBox1Element = searchBoxes[1].__constructor__.calls.argsFor(0)[0];
            expect(searchBox1Element.value).toEqual("");
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
                    referencePoint: { position: new google.maps.LatLng(0, 0) }
                },
                {
                    referencePoint: { position: new google.maps.LatLng(10, 10) }
                },
                {
                    referencePoint: { position: new google.maps.LatLng(20, 20) }
                }
            ];
            var comparator = new DistanceComparator.DistanceComparator(root, {maps: mapConfigs});
            expect(maps.length).toEqual(2);
            // Verify 1st map.
            var map0CreationConfig = maps[0].__constructor__.calls.argsFor(0)[1];
            expect(map0CreationConfig.center).toEqual(mapConfigs[0].referencePoint.position);
            // Verify 2nd map.
            var map1CreationConfig = maps[1].__constructor__.calls.argsFor(0)[1];
            expect(map1CreationConfig.center).toEqual(mapConfigs[1].referencePoint.position);
        });

        it("creates maps offset by centerOffset", function() {
            var comparator = new DistanceComparator.DistanceComparator(root, {
                centerOffset: {latDiff: 10, lngDiff: 20},
                maps: [
                    { referencePoint: { position: new google.maps.LatLng(10, 10) } }
                ]
            });
            var map0CreationConfig = maps[0].__constructor__.calls.argsFor(0)[1];
            expect(map0CreationConfig.center).toEqual(new google.maps.LatLng(20, 30));
        });

        it("creates maps at center if reference point is absent", function() {
            var mapCenter = new google.maps.LatLng(10, 10);
            var comparator = new DistanceComparator.DistanceComparator(root, {
                maps: [
                    { center: mapCenter }
                ]
            });
            var map0CreationConfig = maps[0].__constructor__.calls.argsFor(0)[1];
            expect(map0CreationConfig.center).toEqual(mapCenter);
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
            maps[1].getCenter.and.returnValue(mapSettings.maps[1].referencePoint.position);

            invokeMovementEventHandlers(maps[1]);
            expect(maps[0].setZoom.calls.mostRecent().args[0]).toEqual(newZoom);
        });

        it("moves maps without reference points independently", function() {
            var comparator = new DistanceComparator.DistanceComparator(root, {maps: [{
                referencePoint: { position: new google.maps.LatLng(0, 0) }
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
            maps[1].getCenter.and.returnValue(mapSettings.maps[1].referencePoint.position);

            invokeMovementEventHandlers(maps[1]);
            expect(maps[0].setZoom.calls.mostRecent().args[0]).toEqual(newZoom);
        });

        it("changes state", function() {
            var comparator = createDistanceComparator();
            var stateChangeHandler = jasmine.createSpy("stateChangeHandler");
            comparator.setStateChangeHandler(stateChangeHandler);
            maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint.position);

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

        describe("without reference point", function() {
            it("puts reference point marker on double click point", function() {
                var comparator = new DistanceComparator.DistanceComparator(root);
                maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint.position);
                var doubleClickHandler = getEventHandler(maps[0].mockWrapper, "dblclick");
                doubleClickHandler({latLng: new google.maps.LatLng(10, 20)});

                expect(markers[1].setPosition.calls.mostRecent().args[0].lat()).toEqual(10);
                expect(markers[1].setPosition.calls.mostRecent().args[0].lng()).toEqual(20);
                expect(markers[1].setVisible).toHaveBeenCalledWith(true);
                expect(markers[2].setPosition).not.toHaveBeenCalled();
                expect(markers[2].setVisible).not.toHaveBeenCalled();

            });

            it("moves circle to double click point", function() {
                var comparator = new DistanceComparator.DistanceComparator(root);
                maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint.position);
                var doubleClickHandler = getEventHandler(maps[0].mockWrapper, "dblclick");
                doubleClickHandler({latLng: new google.maps.LatLng(10, 20)});

                expect(circles[0].setCenter.calls.mostRecent().args[0].lat()).toEqual(10);
                expect(circles[0].setCenter.calls.mostRecent().args[0].lng()).toEqual(20);
                expect(circles[1].setCenter).not.toHaveBeenCalled();
            });

            it("moves another map to have reference point in the same position relative to the map center", function() {
                var comparator = new DistanceComparator.DistanceComparator(root, {maps: [
                    {},
                    {referencePoint: mapSettings.maps[1].referencePoint}
                ]});
                maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint.position);
                var doubleClickHandler = getEventHandler(maps[0].mockWrapper, "dblclick");
                doubleClickHandler({latLng: new google.maps.LatLng(10, 20)});

                expect(maps[1].setCenter.calls.mostRecent().args[0].lat()).toEqual(90);
                expect(maps[1].setCenter.calls.mostRecent().args[0].lng()).toEqual(80);
                expect(maps[0].setCenter).not.toHaveBeenCalled();
            });

            it("changes state", function() {
                var comparator = new DistanceComparator.DistanceComparator(root);
                var stateChangeHandler = jasmine.createSpy("stateChangeHandler");
                comparator.setStateChangeHandler(stateChangeHandler);
                maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint.position);

                var doubleClickHandler = getEventHandler(maps[0].mockWrapper, "dblclick");
                doubleClickHandler({latLng: new google.maps.LatLng(10, 20)});
                expect(stateChangeHandler).toHaveBeenCalled();
            });
        });

        it("does not show a circle at map without reference point", function() {
            var comparator = new DistanceComparator.DistanceComparator(root, {maps: [
                {},
                {referencePoint: mapSettings.maps[1].referencePoint}
            ]});

            getEventHandler(maps[1].mockWrapper, "dblclick")({latLng: new google.maps.LatLng(110, 120)});
            expect(circles[0].setVisible).toHaveBeenCalledWith(false);
            expect(circles[1].setVisible).toHaveBeenCalledWith(true);
        });

        it("changes state", function() {
            var comparator = createDistanceComparator();
            var stateChangeHandler = jasmine.createSpy("stateChangeHandler");
            comparator.setStateChangeHandler(stateChangeHandler);
            maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint.position);

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
            maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint.position);
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
            maps[1].getCenter.and.returnValue(mapSettings.maps[1].referencePoint.position);
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
            doubleClickHandler({latLng: comparisonPoint});
            // Simulate dragging reference point.
            maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint.position);
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
            maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint.position);
            markers[1].getPosition.and.returnValue(new google.maps.LatLng(10, 20));

            var dragHandler = getEventHandler(markers[1].mockWrapper, "dragend");
            dragHandler();
            expect(stateChangeHandler).toHaveBeenCalled();
        });
    });

    describe("dragging comparison point", function() {
        it("updates circle radius", function() {
            var settings = getMapSettings();
            settings.comparisonPoint = {
                mapIndex: 0,
                position: new google.maps.LatLng(10, 0)
            }
            var comparator = new DistanceComparator.DistanceComparator(root, settings);
            // Simulate dragging comparison point.
            maps[0].getCenter.and.returnValue(settings.maps[0].referencePoint.position);
            markers[0].getPosition.and.returnValue(new google.maps.LatLng(40, 30));

            var dragHandler = getEventHandler(markers[0].mockWrapper, "dragend");
            expect(dragHandler).toBeDefined();
            dragHandler();
            expect(circles[0].setRadius).toHaveBeenCalledWith(50);
            expect(circles[1].setRadius).toHaveBeenCalledWith(50);
        });

        it("changes state", function() {
            var comparator = createDistanceComparatorWithComparisonPoint();
            var stateChangeHandler = jasmine.createSpy("stateChangeHandler");
            comparator.setStateChangeHandler(stateChangeHandler);
            maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint.position);
            markers[0].getPosition.and.returnValue(new google.maps.LatLng(10, 20));

            var dragHandler = getEventHandler(markers[0].mockWrapper, "dragend");
            dragHandler();
            expect(stateChangeHandler).toHaveBeenCalled();
        });
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
            maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint.position);
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

        it("updates circle radius to make sure circle goes through comparison point", function() {
            var comparator = createDistanceComparator();
            // Put a comparison point.
            var doubleClickHandler = getEventHandler(maps[0].mockWrapper, "dblclick");
            doubleClickHandler({latLng: new google.maps.LatLng(10, 0)});
            // Simulate reference point search.
            maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint.position);
            searchBoxes[0].getPlaces.and.returnValue([mockPlace(10, 20)]);

            var searchBoxHandler = getEventHandler(searchBoxes[0].mockWrapper, "places_changed");
            searchBoxHandler();
            expect(circles[0].setRadius).toHaveBeenCalledWith(20);
            expect(circles[1].setRadius).toHaveBeenCalledWith(20);
        });

        it("shows circle if another map has a reference point and comparison point", function() {
            var comparator = new DistanceComparator.DistanceComparator(root, {
                maps: [{ referencePoint: { position: new google.maps.LatLng(0, 0) }}],
                comparisonPoint: {
                    mapIndex: 0,
                    position: new google.maps.LatLng(10, 20)
                }
            });
            maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint.position);
            searchBoxes[2].getPlaces.and.returnValue([mockPlace(100, 100)]);
            circles[1].setVisible.calls.reset();

            getEventHandler(searchBoxes[2].mockWrapper, "places_changed")();
            expect(circles[1].setVisible).toHaveBeenCalledWith(true);
        });

        describe("empty search string", function() {
            it("hides reference point marker", function() {
                var comparator = createDistanceComparator();

                var searchBox0Element = searchBoxes[0].__constructor__.calls.argsFor(0)[0];
                searchBox0Element.value = "";
                searchBox0Element.dispatchEvent(new Event("change"));
                expect(markers[1].setVisible).toHaveBeenCalledWith(false);
            });

            it("hides circles", function() {
                var comparator = createDistanceComparatorWithComparisonPoint();

                var searchBox0Element = searchBoxes[0].__constructor__.calls.argsFor(0)[0];
                searchBox0Element.value = "";
                searchBox0Element.dispatchEvent(new Event("change"));
                expect(circles[0].setVisible).toHaveBeenCalledWith(false);
                expect(circles[1].setVisible).toHaveBeenCalledWith(false);
            });

            it("hides circle on a map without a reference point", function() {
                var comparator = new DistanceComparator.DistanceComparator(root, {
                    maps: mapSettings.maps,
                    comparisonPoint: {
                        mapIndex: 0,
                        position: new google.maps.LatLng(10, 20)
                    }
                });
                circles[0].setVisible.calls.reset();
                circles[1].setVisible.calls.reset();

                var searchBox2Element = searchBoxes[2].__constructor__.calls.argsFor(0)[0];
                searchBox2Element.value = "";
                searchBox2Element.dispatchEvent(new Event("change"));
                expect(circles[0].setVisible).not.toHaveBeenCalledWith(false);
                expect(circles[1].setVisible).toHaveBeenCalledWith(false);
            });
        });

        describe("no places found", function() {
            it("hides reference point marker", function() {
                var comparator = createDistanceComparator();
                searchBoxes[0].getPlaces.and.returnValue([]);

                getEventHandler(searchBoxes[0].mockWrapper, "places_changed")();
                expect(markers[1].setVisible).toHaveBeenCalledWith(false);
            });

            it("hides circles", function() {
                var comparator = createDistanceComparatorWithComparisonPoint();
                searchBoxes[0].getPlaces.and.returnValue([]);

                getEventHandler(searchBoxes[0].mockWrapper, "places_changed")();
                expect(circles[0].setVisible).toHaveBeenCalledWith(false);
                expect(circles[1].setVisible).toHaveBeenCalledWith(false);
            });
        });

        it("changes state", function() {
            var comparator = createDistanceComparator();
            var stateChangeHandler = jasmine.createSpy("stateChangeHandler");
            comparator.setStateChangeHandler(stateChangeHandler);
            maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint.position);
            searchBoxes[0].getPlaces.and.returnValue([mockPlace(200, 300)]);

            var searchBoxHandler = getEventHandler(searchBoxes[0].mockWrapper, "places_changed");
            searchBoxHandler();
            expect(stateChangeHandler).toHaveBeenCalled();
        });
    });

    describe("comparison point search", function() {
        it("puts comparison location marker on place location", function() {
            var comparator = createDistanceComparator();
            maps[0].getBounds.and.returnValue(new InfiniteBounds());
            searchBoxes[1].getPlaces.and.returnValue([mockPlace(23, 56)]);

            var searchBoxHandler = getEventHandler(searchBoxes[1].mockWrapper, "places_changed");
            expect(searchBoxHandler).toBeDefined();
            searchBoxHandler();
            expect(markers[0].setPosition.calls.mostRecent().args[0].lat()).toEqual(23);
            expect(markers[0].setPosition.calls.mostRecent().args[0].lng()).toEqual(56);
        });

        it("moves comparison location marker to map where searched for comparison point", function() {
            var comparator = createDistanceComparator();
            maps[0].getBounds.and.returnValue(new InfiniteBounds());
            maps[1].getBounds.and.returnValue(new InfiniteBounds());
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
            maps[1].getBounds.and.returnValue(new InfiniteBounds());
            searchBoxes[3].getPlaces.and.returnValue([mockPlace(130, 140)]);

            var searchBoxHandler = getEventHandler(searchBoxes[3].mockWrapper, "places_changed");
            expect(searchBoxHandler).toBeDefined();
            searchBoxHandler();
            expect(circles[0].setRadius).toHaveBeenCalledWith(50);
            expect(circles[0].setVisible).toHaveBeenCalledWith(true);
            expect(circles[1].setRadius).toHaveBeenCalledWith(50);
            expect(circles[1].setVisible).toHaveBeenCalledWith(true);
        });

        it("hides circles if comparison point is moved to map without reference point", function() {
            var comparator = new DistanceComparator.DistanceComparator(root, {
                maps: [
                    {referencePoint: mapSettings.maps[0].referencePoint}
                ],
                comparisonPoint: { mapIndex: 0, position: new google.maps.LatLng(10, 20) }
            });
            searchBoxes[3].getPlaces.and.returnValue([mockPlace(130, 140)]);

            getEventHandler(searchBoxes[3].mockWrapper, "places_changed")();
            expect(circles[0].setVisible).toHaveBeenCalledWith(false);
            expect(circles[1].setVisible).toHaveBeenCalledWith(false);
        });

        it("moves map to show comparison point if reference point is absent", function() {
            var comparator = new DistanceComparator.DistanceComparator(root);
            searchBoxes[1].getPlaces.and.returnValue([mockPlace(23, 56)]);

            getEventHandler(searchBoxes[1].mockWrapper, "places_changed")();
            expect(maps[0].setCenter.calls.mostRecent().args[0].lat()).toEqual(23);
            expect(maps[0].setCenter.calls.mostRecent().args[0].lng()).toEqual(56);
        });

        it("zooms out to show both reference point and comparison point", function() {
            var comparator = createDistanceComparator();
            maps[0].getBounds.and.returnValue(new google.maps.LatLngBounds(-50, 50, -50, 50));
            maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint.position);
            searchBoxes[1].getPlaces.and.returnValue([mockPlace(-63, 78)]);

            getEventHandler(searchBoxes[1].mockWrapper, "places_changed")();
            expect(maps[0].fitBounds).toHaveBeenCalled();
            var newBounds = maps[0].fitBounds.calls.mostRecent().args[0];
            expect(newBounds._left).toEqual(-78);
            expect(newBounds._right).toEqual(78);
            expect(newBounds._bottom).toEqual(-63);
            expect(newBounds._top).toEqual(63);
        });

        it("does not change zoom if reference point and comparison point already visible", function() {
            var comparator = createDistanceComparator();
            maps[0].getBounds.and.returnValue(new google.maps.LatLngBounds(-50, 50, -50, 50));
            maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint.position);
            searchBoxes[1].getPlaces.and.returnValue([mockPlace(30, 40)]);

            getEventHandler(searchBoxes[1].mockWrapper, "places_changed")();
            expect(maps[0].fitBounds).not.toHaveBeenCalled();
        });

        describe("empty search string", function() {
            it("removes comparison point marker", function() {
                var comparator = createDistanceComparatorWithComparisonPoint();

                var searchBox1Element = searchBoxes[1].__constructor__.calls.argsFor(0)[0];
                searchBox1Element.value = "";
                searchBox1Element.dispatchEvent(new Event("change"));
                expect(markers[0].setMap).toHaveBeenCalledWith(null);
            });

            it("hides circles", function() {
                var comparator = createDistanceComparatorWithComparisonPoint();

                var searchBox1Element = searchBoxes[1].__constructor__.calls.argsFor(0)[0];
                searchBox1Element.value = "";
                searchBox1Element.dispatchEvent(new Event("change"));
                expect(circles[0].setVisible).toHaveBeenCalledWith(false);
                expect(circles[1].setVisible).toHaveBeenCalledWith(false);
            });
        });

        describe("no places found", function() {
            it("hides comparison point marker", function() {
                var comparator = createDistanceComparatorWithComparisonPoint();
                searchBoxes[1].getPlaces.and.returnValue([]);

                getEventHandler(searchBoxes[1].mockWrapper, "places_changed")();
                expect(markers[0].setMap).toHaveBeenCalledWith(null);
            });

            it("hides circles", function() {
                var comparator = createDistanceComparatorWithComparisonPoint();
                searchBoxes[1].getPlaces.and.returnValue([]);

                getEventHandler(searchBoxes[1].mockWrapper, "places_changed")();
                expect(circles[0].setVisible).toHaveBeenCalledWith(false);
                expect(circles[1].setVisible).toHaveBeenCalledWith(false);
            });
        });

        it("changes state", function() {
            var comparator = createDistanceComparator();
            var stateChangeHandler = jasmine.createSpy("stateChangeHandler");
            comparator.setStateChangeHandler(stateChangeHandler);
            maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint.position);
            maps[1].getBounds.and.returnValue(new InfiniteBounds());
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
            maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint.position);

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
            maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint.position);
            var doubleClickHandler = getEventHandler(maps[1].mockWrapper, "dblclick");
            doubleClickHandler({latLng: new google.maps.LatLng(23, 56)});

            var comparisonPoint = comparator.getState().comparisonPoint;
            expect(comparisonPoint.mapIndex).toEqual(1);
            expect(comparisonPoint.position.lat()).toEqual(23);
            expect(comparisonPoint.position.lng()).toEqual(56);
        });

        it("does not contain comparison point when absent", function() {
            var comparator = createDistanceComparator();
            maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint.position);
            expect(comparator.getState().comparisonPoint).toBeUndefined();
        });

        describe("comparison point name", function() {
            function createComparatorAndTriggerSearch(placeName) {
                var comparator = createDistanceComparator();
                maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint.position);
                maps[0].getBounds.and.returnValue(new InfiniteBounds());
                searchBoxes[1].getPlaces.and.returnValue([mockPlace(30, 40)]);
                var searchBox1Element = searchBoxes[1].__constructor__.calls.argsFor(0)[0];
                searchBox1Element.value = placeName;
                getEventHandler(searchBoxes[1].mockWrapper, "places_changed")();
                return comparator;
            }

            it("present after creation", function() {
                var placeName = "point";
                var comparator = new DistanceComparator.DistanceComparator(root,
                    getComparisonPointMapSettings(placeName));
                maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint.position);
                expect(comparator.getState().comparisonPoint.name).toEqual(placeName);
            });

            it("present after comparison point search", function() {
                var placeName = "point";
                var comparator = createComparatorAndTriggerSearch(placeName);
                expect(comparator.getState().comparisonPoint.name).toEqual(placeName);
            });

            it("absent after double click", function() {
                var comparator = createComparatorAndTriggerSearch("point");
                getEventHandler(maps[0].mockWrapper, "dblclick")({latLng: new google.maps.LatLng(23, 56)});
                expect(comparator.getState().comparisonPoint.name).toBeUndefined();
            });

            it("absent after comparison point dragging", function() {
                var comparator = createComparatorAndTriggerSearch("point");
                markers[0].getPosition.and.returnValue(new google.maps.LatLng(10, 20));
                getEventHandler(markers[0].mockWrapper, "dragend")();
                expect(comparator.getState().comparisonPoint.name).toBeUndefined();
            });
        });

        describe("map state", function() {
            it("has state for all maps", function() {
                var comparator = createDistanceComparator();
                maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint.position);
                expect(comparator.getState().maps).toBeDefined();
                expect(comparator.getState().maps.length).toEqual(2);
            });

            it("contains reference point when present", function() {
                var comparator = createDistanceComparator();
                maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint.position);
                var mapsState = comparator.getState().maps;
                var i;
                for (i = 0; i < mapsState.length; i++) {
                    expect(mapsState[i].referencePoint).toBeDefined();
                    expect(mapsState[i].referencePoint.position).toBeDefined();
                    expect(mapsState[i].center).toBeUndefined();
                    expect(mapsState[i].referencePoint.position.lat())
                        .toEqual(mapSettings.maps[i].referencePoint.position.lat());
                    expect(mapsState[i].referencePoint.position.lng())
                        .toEqual(mapSettings.maps[i].referencePoint.position.lng());
                }
            });

            describe("reference point name", function() {
                function createComparatorAndTriggerSearch(placeName) {
                    var comparator = new DistanceComparator.DistanceComparator(root);
                    maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint.position);
                    searchBoxes[0].getPlaces.and.returnValue([mockPlace(30, 40)]);
                    var searchBox0Element = searchBoxes[0].__constructor__.calls.argsFor(0)[0];
                    searchBox0Element.value = placeName;
                    getEventHandler(searchBoxes[0].mockWrapper, "places_changed")();
                    return comparator;
                }

                it("present after creation", function() {
                    var comparator = new DistanceComparator.DistanceComparator(root, getMapSettings(["ref0", "ref1"]));
                    maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint.position);
                    var mapsState = comparator.getState().maps;
                    expect(mapsState[0].referencePoint.name).toEqual("ref0");
                    expect(mapsState[1].referencePoint.name).toEqual("ref1");
                });

                it("present after reference point search", function() {
                    var placeName = "place name";
                    var comparator = createComparatorAndTriggerSearch(placeName);
                    var mapsState = comparator.getState().maps;
                    expect(mapsState[0].referencePoint).toBeDefined();
                    expect(mapsState[0].referencePoint.name).toEqual(placeName);
                    expect(mapsState[1].referencePoint).toBeUndefined();
                });

                it("absent after reference point dragging", function() {
                    var comparator = createComparatorAndTriggerSearch("foo");
                    markers[1].getPosition.and.returnValue(new google.maps.LatLng(10, 20));
                    getEventHandler(markers[1].mockWrapper, "dragend")();

                    var mapsState = comparator.getState().maps;
                    expect(mapsState[0].referencePoint).toBeDefined();
                    expect(mapsState[0].referencePoint.name).toBeUndefined();
                });
            });

            it("contains center position when reference point is absent", function() {
                var comparator = new DistanceComparator.DistanceComparator(root);
                maps[0].getCenter.and.returnValue(mapSettings.maps[0].referencePoint.position);
                maps[1].getCenter.and.returnValue(mapSettings.maps[1].referencePoint.position);
                var mapsState = comparator.getState().maps;
                var i;
                for (i = 0; i < mapsState.length; i++) {
                    expect(mapsState[i].referencePoint).toBeUndefined();
                    expect(mapsState[i].center).toBeDefined();
                    expect(mapsState[i].center.lat()).toEqual(mapSettings.maps[i].referencePoint.position.lat());
                    expect(mapsState[i].center.lng()).toEqual(mapSettings.maps[i].referencePoint.position.lng());
                }
            });
        });
    });
});
