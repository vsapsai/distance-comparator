// Empty namespace-like structure.
var google = {
    maps: {
        ControlPosition: {
            TOP_LEFT: "TOP_LEFT"
        },
        event: {},
        geometry: {
            spherical: {}
        },
        places: {}
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
google.maps.LatLngBounds = function(left, right, bottom, top) {
    this._left = left || 0;
    this._right = right || 0;
    this._bottom = bottom || 0;
    this._top = top || 0;
};
google.maps.LatLngBounds.prototype.contains = function(position) {
    var lat = position.lat();
    var lng = position.lng();
    return ((this._bottom <= lat) && (lat <= this._top))
        && ((this._left <= lng) && (lng <= this._right));
};
google.maps.LatLngBounds.prototype.extend = function(position) {
    var lat = position.lat();
    var lng = position.lng();
    return new google.maps.LatLngBounds(
        Math.min(this._left, lng),
        Math.max(this._right, lng),
        Math.min(this._bottom, lat),
        Math.max(this._top, lat)
    );
};
google.maps.geometry.spherical.computeDistanceBetween = function(from, to) {
    var latDifference = to.lat() - from.lat();
    var lngDifference = to.lng() - from.lng();
    return Math.sqrt(latDifference*latDifference + lngDifference*lngDifference);
};
google.maps.geometry.spherical.computeHeading = function(from, to) {
    return Math.atan2(to.lat() - from.lat(), to.lng() - from.lng());
};
google.maps.geometry.spherical.computeOffset = function(from, distance, heading) {
    return new google.maps.LatLng(
        from.lat() + distance * Math.sin(heading),
        from.lng() + distance * Math.cos(heading)
    );
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
