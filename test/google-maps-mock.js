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
    function isPropertyMethod(methodName) {
        return methodName.startsWith("property:");
    }
    function getPropertyName(methodName) {
        return methodName.substring("property:".length);
    }

    var mockedMethods = ["__constructor__"];
    methods.forEach(function(methodName) {
        if (isPropertyMethod(methodName)) {
            var propertyName = getPropertyName(methodName);
            mockedMethods.push("get" + propertyName);
            mockedMethods.push("set" + propertyName);
        } else {
           mockedMethods.push(methodName);
        }
    });
    var mockedClass = function(args) {
        this.spy = jasmine.createSpyObj(className, mockedMethods);
        this.spy.mockWrapper = this;
        this.spy.__constructor__.apply(this.spy, arguments);
        objectsContainer.push(this.spy);
        this.__properties__ = {};
    };
    methods.forEach(function(methodName) {
        if (isPropertyMethod(methodName)) {
            var propertyName = getPropertyName(methodName);
            var setter = "set" + propertyName;
            mockedClass.prototype[setter] = function(value) {
                this.__properties__[propertyName] = value;
                this.spy[setter].apply(this.spy, arguments);
            }
            var getter = "get" + propertyName;
            mockedClass.prototype[getter] = function(args) {
                var spyValue = this.spy[getter].apply(this.spy, arguments);
                return spyValue ? spyValue : this.__properties__[propertyName];
            }
        } else {
            mockedClass.prototype[methodName] = function(args) {
                return this.spy[methodName].apply(this.spy, arguments);
            }
        }
    });
    return mockedClass;
};
