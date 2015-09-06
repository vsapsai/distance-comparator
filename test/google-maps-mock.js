// Empty namespace-like structure.
var google = {
    maps: {
        event: {},
        geometry: {
            spherical: {}
        }
    }
};

// Simplified implementation of google.maps.LatLng suitable for tests.
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
