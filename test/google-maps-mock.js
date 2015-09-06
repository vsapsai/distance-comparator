// Empty namespace-like structure.
var google = {
    maps: {
        event: {},
        geometry: {
            spherical: {}
        }
    }
};

// Simplified implementation of google.maps parts suitable for tests.  In life
// the Earth is geoid, in tests it is a rectangle.
google.maps.LatLng = function(lat, lng) {
    this._lat = lat;
    this._lng = lng;
};
google.maps.LatLng.prototype.lat = function() {
    return this._lat;
};
google.maps.LatLng.prototype.lng = function() {
    return this._lng;
};
google.maps.geometry.spherical.computeDistanceBetween = function(from, to) {
    var latDifference = to.lat() - from.lat();
    var lngDifference = to.lng() - from.lng();
    return Math.sqrt(latDifference*latDifference + lngDifference*lngDifference);
};

function mockClass(className, methods, objectsContainer) {
    var methodsWithConstructor = methods.slice();
    methodsWithConstructor.push("__constructor__");
    var mockedClass = function(args) {
        this.spy = jasmine.createSpyObj(className, methodsWithConstructor);
        this.spy.mockWrapper = this;
        this.spy.__constructor__.apply(this.spy, arguments);
        objectsContainer.push(this.spy);
    };
    methods.forEach(function(methodName) {
        mockedClass.prototype[methodName] = function(args) {
            return this.spy[methodName].apply(this.spy, arguments);
        }
    });
    return mockedClass;
};
