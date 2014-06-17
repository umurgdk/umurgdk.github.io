---
layout: post
title: Angular Services and Effective Caching
tags: angularjs, javascript, ngMemo
---

For a while I was memoizing/caching all the api related methods in my angular services. And if the function finds a memoized value creates a dummy defferred object and immediately return it's promise with value inside. But this way of caching values ineffective because what if our data changes too often. How to decide to force the service to make real requests to the api instead of returning cached values. Even if we find a proper way to decide it, how to avoid showing ugly loading indicator. I'm caching values because I want to show results instantly.

**There are two main goals;**

* I want to show results immediately!
* I want to get most updated data!

**deferred.notify(data)**

Angular's promises are really good (yeah sometimes jerky). Many people who uses angular knows about ```deferred.notify()```, but always people talking about it as progress. Most examples are based on file uploading and other progress bar related operations.

**Using defferred.notify() as early response**

If I want to get instant results and most updated data in same time, I have to return some cached value immediately, but I shouldn't break the process. So the service method should continue with making ajax requests. ```notify```'s main responsibility is giving updates about the running process. And they are handled before the defferred's actual resolve. It is a good place to send our cached values. 

As a start let's say I have simple service named ```myApi``` and a method named ```getMessage(id)```. getMessage method, calls an API end point to retrive requested message. I will explain later why myApi service depends on ```$timeout```.

```coffeescript
angular.module 'myApp'
.service 'myApi', ($q, $http, $timeout) ->
  @getMessage = (id) =>
    return $http.get "/messages/#{id}"
    .then (response) =>
      return response.data
```

First let's create a cach object to save retrived objects into it. Also my service method should return a dummy deffered object if any cached values found. 

```coffeescript
@messageCache = {}
@getMessage = (id) =>
  # Look for a cached object and return immediately if find any
  if @messagesCache[id]
    deferred = $q.defer()
    deferred.resolve(@messagesCache[id])
    return deferred.promise

  return $http.get "/messages/#{id}"
  .then (response) =>
    @messageCache[id] = response.data
    return response.data
```

This way to giving cached results are ineffective as I said before. As you can see if there are any cached values already, the method will return early and the API request won't made. Our first goal (**I want to show results immediately!**) accomplished. But we don't have the most updated data.

Time to use ```defferred.notify()``` to complete both of my goals. But now our method will create a new deferred object anyway. And I have to call ```defferred.resolve(data)``` in my $http callback.

**IMPORTANT UGLY HACK: angular's promises are jerk! We can use ```deferred.resolve();``` just before returning the deferred's promise. But we can't use ```deferred.notify()```, we have to call notify on the next process tick _timeout(fn, 0)_**

```coffeescript 
@messageCache = {}
@getMessage = (id) =>
  deferred = $q.defer()

  # Look for a cached object and call notify if there is
  if @messagesCache[id]
    # Ugly timeout hack :(
    $timeout( -> deferred.notify(@messagesCache[id]), 0)

  # Make ajax request in any case!
  $http.get "/messages/#{id}"
  .then (response) =>
    @messageCache[id] = response.data
    deferred.resolve(response.data)

  return deferred.promise
```

Yeah I complete both of my goals. I have instant results which updated bit later on. I really don't like $timeout hack but I have to use it until angular make ```notify``` work like ```resolve```. And the controller part is pretty simple, just use ```notifyCallback``` parameter for getting cached values. Controller usage is not so pretty, because we have to give a callback both _resolve_ and _notify_.

```coffeescript
angular.module 'myApp'
.controller 'myCtrl', (myApi) ->
  myApi.getMessage(10)
  .then (message) ->
    # most updated data comes from defferred.resolve
    $scope.message = message
  , (err) ->
  , (message) -> #notify callback
    # cached value, this callback will be called ~instanly
    $scope.message = message
```

This is a common way to add caching on services. I think it wouldn't be nice to write these checks and timeouts for all methods again and again. Good news is I started to work on an angular plugin. And it will handle caching/memoizing service methods, and also you will be able to use only one handler for both _notify_ and _resolve_.