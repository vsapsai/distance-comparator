// Empty namespace-like structure.
var google = {
    maps: {
        event: {},
        geometry: {
            spherical: {}
        }
    }
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
    var i;
    for (i = 0; i < methods.length; i++) {
        mockedClass.prototype[methodName] = function(args) {
            this.spy[methodName].apply(this.spy, arguments);
        }
    }
    return mockedClass;
};
