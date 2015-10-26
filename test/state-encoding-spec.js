"use strict";

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

        it("encodes maps' center points", function() {
            var mapState = {
                center: new google.maps.LatLng(0.1234567, -0.1234567)
            };
            expect(DistanceComparator.encodeStateToString({maps: [mapState]}))
                .toEqual("center0=0.123457,-0.123457");
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

    describe("decodeStateFromString", function() {
        it("decodes zoom", function() {
            expect(DistanceComparator.decodeStateFromString("zoom=7")).toEqual({zoom: 7});
        });

        it("decodes center offset", function() {
            expect(DistanceComparator.decodeStateFromString("offset=0.123456,-7"))
                .toEqual({centerOffset: {latDiff: 0.123456, lngDiff: -7.0}});
        });

        it("decodes comparison point", function() {
            expect(DistanceComparator.decodeStateFromString("comparison1=0.123456,-7"))
                .toEqual({comparisonPoint: {
                    mapIndex: 1,
                    position: new google.maps.LatLng(0.123456, -7)
                }});
        });

        it("decodes maps' reference points", function() {
            expect(DistanceComparator.decodeStateFromString("ref1=0.123456,-7"))
                .toEqual({maps: [
                    {},
                    {referencePoint: new google.maps.LatLng(0.123456, -7)}
                ]});
        });

        it("decodes maps' center points", function() {
            expect(DistanceComparator.decodeStateFromString("center1=0.123456,-7"))
                .toEqual({maps: [
                    {},
                    {center: new google.maps.LatLng(0.123456, -7)}
                ]});
        });

        describe("invalid string", function() {
            it("zoom NaN", function() {
                expect(DistanceComparator.decodeStateFromString("zoom=seven")).toEqual({});
            });

            it("zoom infinity", function() {
                expect(DistanceComparator.decodeStateFromString("zoom=Infinity")).toEqual({});
            });

            it("center offset not enough components", function() {
               expect(DistanceComparator.decodeStateFromString("offset=7")).toEqual({});
            });

            it("center offset NaN", function() {
                expect(DistanceComparator.decodeStateFromString("offset=7,foo")).toEqual({});
            });

            it("center offset infinity", function() {
                expect(DistanceComparator.decodeStateFromString("offset=7,Infinity")).toEqual({});
            });

            it("comparison point invalid mapIndex", function() {
                expect(DistanceComparator.decodeStateFromString("comparison2=0.123456,-7")).toEqual({});
            });

            it("comparison point not enough components", function() {
                expect(DistanceComparator.decodeStateFromString("comparison0=0.123456")).toEqual({});
            });

            it("comparison point NaN", function() {
                expect(DistanceComparator.decodeStateFromString("comparison0=0.123456,foo")).toEqual({});
            });

            it("comparison point infinity", function() {
                expect(DistanceComparator.decodeStateFromString("comparison0=0.123456,Infinity")).toEqual({});
            });

            it("reference point invalid index", function() {
                expect(DistanceComparator.decodeStateFromString("ref2=0.123456,-7")).toEqual({});
            });

            it("reference point not enough components", function() {
                expect(DistanceComparator.decodeStateFromString("ref0=0.123456")).toEqual({});
            });

            it("reference point NaN", function() {
                expect(DistanceComparator.decodeStateFromString("ref0=0.123456,foo")).toEqual({});
            });

            it("reference point infinity", function() {
                expect(DistanceComparator.decodeStateFromString("ref0=0.123456,Infinity")).toEqual({});
            });

            it("center point invalid index", function() {
                expect(DistanceComparator.decodeStateFromString("center2=0.123456,-7")).toEqual({});
            });

            it("center point not enough components", function() {
                expect(DistanceComparator.decodeStateFromString("center0=0.123456")).toEqual({});
            });

            it("center point NaN", function() {
                expect(DistanceComparator.decodeStateFromString("center0=0.123456,foo")).toEqual({});
            });

            it("center point infinity", function() {
                expect(DistanceComparator.decodeStateFromString("center0=0.123456,Infinity")).toEqual({});
            });
        });
    });
});
