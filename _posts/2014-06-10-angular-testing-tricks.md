---
layout: post
title: Angular Unit Testing Tricks 
tags: angularjs, javascript
---

Last two days I was trying to integrate a testing system for our angular codebase. I've played with Karma before and choose it again. The configuration and installation of karma isn't so hard. It has many plugins which makes easier to integrate testing frameworks such as Jasmine. But I won't go over the installation process I will directly dive into writing tests. You can find many tutorials about installation and configuration of karma and jasmine together.

All the links to the documentation pages located under the article.

## Before writing the tests, make sure you separate your controllers and services
It is important to make sure your codebase well separated into controllers, services, and/or directives. Writing complex code will make hard to write tests. In the project which I'm working on right now, I've started with the extracting all API related codes from controller into a new service. I belive the controllers shouldn't include any data related code or any $http, $cookie calls, they all belongs to service layer. And this makes easier to writing unit tests for controllers.

## Make sure to install angular-mocks
Angular mocks comes with bunch of helper functions to write angular tests easier. If you gonna write tests for angular first install it, and make sure to add it to your *files list* of karma. Im not sure how many utilities comes with ngMocks but I've used **module**, **inject** and **$httpBackend** methods.

## Writing the first test!
{% highlight javascript %}
// myController.js
angular.module('myApp.controllers')
.controller('myController', function ($scope) {
  $scope.sum = function (a, b) {
    // Stupid condition to make testing more detailed
    if (a < 0) {
      return -1;
    }

    return a + b;
  };
});
{% endhighlight %}

Writing unit tests for such a simple controller is very easy as you can guess. But if you haven't write any tests for angular before you might be asking how to reach the $scope inside of the controller. ngMocks provide some helpers for it. Let's see how to do;

{% highlight javascript %}
// myController.spec.js
describe("myController", function () {
  var ctrl, scope;

  // the magic happens here
  beforeEach(function () {
    // tell the module we're working on
    module("myApp.controllers");

    // create the controller
    inject(function ($controller, $rootScope) {
      scope = $rootScope.$new();
      ctrl = $controller('myController', {
        $scope: scope
      });
    });
  });

  describe("sum", function () {
    it("should return sum of a and b", function () {
      expect(scope.sum(1, 5)).toEqual(6);
      expect(scope.sum(5, 5)).toEqual(10);
    });

    it("should return -1 when a is negative", function () {
      expect(scope.sum(-10, 5)).toEqual(-1);
      expect(scope.sum(5, -5)).toEqual(0); // returns -1 only when a is negative
    });
  });
});
{% endhighlight %}

It is important to implement the creation of controller in a beforeEach block. The controller (so the scope) will be recreated for every test. We don't want to affected by other tests' side effects. We use **module** for telling where our controller belongs to. It helps to **inject** helper to work properly. After that we use **inject** for accessing angular's services like **$controller** and **rootScope**. And then we create our empty scope as a child of $rootScope. **$controller** function creates a new controller instance with the given **$scope**. After that we have access to controller and it's scope. And we wrote tests like any other tests. This example doesn't much cover the corner cases like http requests or angualar's promises. Next we gonna write a simple test for a simple service which makes http calls.

## Testing services which includes http requests
When writing unit tests you shouldn't really make the ajax calls. Because we are not interested with outer world, we're testing only our service functionality and we don't want to deal with API's errors or network errors. Angular has a nice service called **$httpBackend** which emulates the http requests with given options. $httpBackend supports all kind of http request methods and allows us to define the response for these emulated requests. Also it supports for failing cases, we can say a request gives 400 error, 500, etc. There are some must haves for using $httpBackend, like verifying there is no outstanding requests, or flushing it to make requests done. Just like controller test we gonna add some magic to our beforeEach block to access $httpBackend. After the controller example you can guess how we do it.

{% highlight javascript %}
// myService.js
angular.module('myApp.services')
.service('myService', function ($http, $q) {
  // let's assume our api is doesn't fit into REST
 
  this.updatePost = function (post) {
    var q;

    if (typeof post.id === 'undefined') {
      q = $q.defer();
      q.reject();
      return q.promise;
    }
    
    return $http.put('/api/updatePost', post)
    .catch(function () {
      return "System failure!";
    });
  };
});

// myService.spec.js
describe("myService", function () {
  // INFO: we need rootScope for testing with angular promises!
  var $httpBackend, myService, $rootScope;

  // shortcut usage of module()
  beforeEach(module('myApp.services'));

  // shortcut usage of inject helper
  // WARNING: you can't use module() in inject
  // INFO: you can use _dependency_ format to avoid naming collisions
  beforeEach(inject(function ($injector, _myService_, _$rootScope_) {
    // we use $injector to get access $httpBackend
    $httpBackend = $injector.get('$httpBackend');
    myService = _myService_;
    $rootScope = _$rootScope_;
  });

  // verifying there is no outstanding operation for $httpBackend
  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe("updatePost", function () {
    it("should reject if the post doesn't have an id", function () {
      // we need a spying function to test a specific function called or not
      var _catch = jasmine.createSpy("_catch");
      var _then  = jasmine.createSpy("_then");

      // a post without id field
      var post = {};

      myService.updatePost(post)
      .then(_then)
      .catch(_catch);

      // MUST HAVE call for promises run!!!
      $rootScope.$digest();

      expect(_then).not.toHaveBeenCalled();
      expect(_catch).toHaveBeenCalled();
    });

    it("should make a PUT request", function () {
      var _then = jasmine.createSpy("_then");
      
      var post = {id: 1};

      // INFO: make sure the ajax call made
      $httpBackend.expectPUT('/api/updatePost', {
        id: 1
      });

      myService.updatePost(post)
      .then(_then);

      $httpBackend.flush();
      $rootScope.$digest(); // for promises again
      
      expect(_then).toHaveBeenCalled();
    });
  });
});
{% endhighlight %}

There is two very important trick to things work. First **$rootScope.$digest()**, if you don't call it promises never been resolved, and your callbacks never run and tests will fail. When writing your application there is no need to call $digest except special cases. Angular handles the call automatically. But in testing environment you have to call it yourself. Second important thing is calling **$httpBackend.flush()**. Unless you call flush, http requests doesn't fire. And your expectation will fail, but angular gives an error to warn us about there is waiting requests. And also we're making sure there is no outstanding expectataions or requests for $httpBackend. We put that verification into **afterEach()** block to verify that after every test.

## Testing controllers with depends on services 
My next article will cover testing the controllers which depends on other services which makes http requests. Also I will cover how to mock our service to test our controller.

Reference documents:
- [Karma.js](http://karma-runner.github.io)
- [Jasmine](http://jasmine.github.io/2.0/introduction.html)
- [angular-mocks](https://code.angularjs.org/1.2.17/docs/api/ngMock)
- [$httpBackend](https://code.angularjs.org/1.2.17/docs/api/ngMock/service/$httpBackend)
