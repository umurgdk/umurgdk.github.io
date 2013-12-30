---
layout: post
title: A Weekend With Elixir
---

For a long time i've been wanting to dive into elixir. Finally found some time and write some code. First, if you don't know [elixir](http://www.elixir-lang.org) is a programming language which compiles to same erlang vm bytecode. Just think like how any other JVM languages compiles into jvm bytecode. And this means you have full access to erlang's environment. 
<!-- Elixir and erlang share same semantics because of that reading erlang documents or using any erlang libraries doesn't hurt you. -->

After a weekend i have to say **it was awesome**. I choose to make a chat server application as a learning project. I thought it shouldn't be much hard to write. And it shouldn't hehe :P

**Let's make a chat server in elixir together.**

## Installation
You need to install [erlang](http://www.erlang.org/) programming language first. And then you can install elixir. There is **homebrew** packages for both of them if you are using **OS X**. I will continue with os x, it shouldn't be harder to install both of them on neighter linux nor windows.

```
# brew installs erlang automatically as a dependency
$ brew install elixir
```

## Creating a project with mix

Elixir comes with a handy toolkit named **mix**. It can create projects, build and run them for you and even manage the dependencies. You will love mix after a while. Let's create a project named **tutorial** with mix and see what it creates and try to describe them.

***!!! name of the project is important project's root directory's name and the project configuration should match.***

```
$ mix new tutorial

* creating README.md
* creating .gitignore
* creating mix.exs
* creating lib
* creating lib/tutorial.ex
* creating lib/tutorial
* creating lib/tutorial/supervisor.ex
* creating test
* creating test/test_helper.exs
* creating test/tutorial_test.exs

Your mix project was created successfully.
You can use mix to compile it, test it, and more:

    cd tutorial
    mix compile
    mix test

Run `mix help` for more information.
```

**mix.exs**
: is our project file. mix toolkit reads that file everytime when you want to run a task. It includes some basic information about your project like name, version, language version and also the libraries as dependencies. We will return that file later, no need to going deep with it.

**lib/**
: directory is our source files location. Yeah unusually they choose to name as lib instead of src. I don't know the reasons. Anyway we write our elixir codes in here. Mix already creates a **supervisor.ex** and **tutorial.ex**. I will explain some conventions later. After @HashNuke mentioned **lib/** was choosen because you can use **src/** dir for erlang source code if you really need it.

**test/**
: mix create a folder for testing in default. You can write down your tests into there. mix also can run your tests with ```mix test```.

## Where the application starts to work? Behaviours?

Ok if you try to run ```mix run``` you just saw compilation messages and nothing happened. Actually our application was run but there is nothing to see and halted at the end. Our application is defined in **lib/tutorial.ex**.

```elixir
defmodule Tutorial do
  use Application.Behaviour

  # See http://elixir-lang.org/docs/stable/Application.Behaviour.html
  # for more information on OTP Applications
  def start(_type, _args) do
    Tutorial.Supervisor.start_link
  end
end
```

Ok here is our Tutorial module definition. In the first line we say this module following the rules define in Application.Behaviour. This means you have to define some specific functions to behave like an application, like ```start```. There are many other behaviours in elixir, we will see some of them. 

There is two way to add behaviour to your module. First one is like on tutorial.ex and the second one is using ```@behaviour :application``` directive. There are differencies between of them. Usage of @behaviour directive is like marking your module to follow up some rules. And the compiler warns you when you missed something to follow ```@behaviour```. And ```use Application.Behaviour``` is doing something different in background. ```use``` directive defines some of the functions described in ```@hebaviour``` as defaults. So you only need to write the parts of the behaviour which concerns you. 

The Supervisor is another topic we will return it back. For a now enough to know it supervising our application against to craches and restart them.

You can write your codes before ```Tutorial.Supervisor.start_link```, for example:

```elixir
# file lib/tutorial.ex
def start(_type, _args) do
  IO.puts "Hello World"
  Tutorial.Supervisor.start_link
end
```

Now if you run ```mix run``` it will compile again and run the program now you should see the Hello World on the  screen.

## A webserver, what about Cowboy?

Our goal was implementing a chat server. We use browser as a client via **[websockets](http://www.html5rocks.com/en/tutorials/websockets/basics/)**. So we need a web server right? I choose a webserver implementation from erlang named [cowboy](https://github.com/extend/cowboy). You can check [ninenines](http://ninenines.eu/) for other erlang libraries. And here is the [guide for cowboy](http://ninenines.eu/docs/en/cowboy/HEAD/guide/). There is also [dynamo](https://github.com/dynamo/dynamo) library implemented in elixir, but it doesn't support for websockets yet.

With help of **mix** installing 3rd party libraries are so easy. We will just add them as dependencies and mix handle the rest of it. Let's make modifications on ```mix.exs```:

```elixir
#file mix.exs
defmodule Tutorial.Mixfile do
  use Mix.Project
    
  ...

  defp deps do
    [{:cowboy, "0.9.0",[github: "extend/cowboy", tag: "0.9.0"]}]
  end
end
```

Yes! As you guess mix can work with github repositories. For getting dependencies you should run ```mix deps.get```

```
$ mix deps.get

* Getting cowboy (git://github.com/extend/cowboy.git)
Cloning into '/Users/umurgedik/Documents/playground/elixir/tutorial/deps/cowboy'...
...
...
```

Mix automatically fetch and install all your dependencies under ```deps/``` folder under your project root. It also fetch **dependencies of cowboy** automatically.

When using mix for dependency management you don't need anything like import or require, all handled automatically with mix. You just use your libraries as you want.

After you install the dependencies let's start a webserver when our application starts.

```elixir
#file lib/tutorial.ex

def start(_type, _args) do
  # defining dispatch. think like routes
  dispatch = :cowboy_router.compile([
    # list({URIHost, list({URIPath, Handler, Opts})})
    {:_, [
      {"/", Tutorial.HelloWorldHandler, []}
    ]}
  ])

  # starting cowboy web server
  :cowboy.start_http(:http, 100,
                     [port: 8080],
                     [env: [dispatch: dispatch]])

  Tutorial.Supervisor.start_link
end
```

*NOTE: when using erlang modules from elixir just write module name as an atom. So when you use them put a colon front of it*

Here we see two functions from **cowboy** and **cowboy_router** modules. As you guess ```:cowboy.start_http``` starts our webserver with given options. If you do some web programmin before dispatch value doesn't look so strange. We just define our router with ```:cowboy_router.compile```. You can think ```:_``` as like a wildcard to accepts connections for any host. We will run ```Tutorial.HelloWorldHandler``` for users who come to visit "/" in our server.

We need to write our handler now. If you remember we've talked about **behaviours** before. Our handler also needs to follow some rules defined from ```:cowboy_handler``` behaviour. Because of we're using an **erlang module** we have to add **behaviours** with ```@behaviour(name)``` directive! Just create a file named ```hello_world_handler.ex``` under ```lib/tutorial```.

```elixir
#file lib/tutorial/hello_world_handler.ex
defmodule Tutorial.HelloWorldHandler do
  @behaviour :cowboy_http_handler

  def init(_transport, req, _opts) do
    {:ok, req, []}
  end

  def handle(req, state) do
    :cowboy_req.reply(200, [], "Hello World", req)
    {:ok, req, state}
  end

  def terminate(_reason, _req, _state), do: :ok 
  
end
```

There are three functions have defined in our module, **init/3**, **handle/2**, **terminate/3**. Init function will be called on start of every request, and then handle will be called with ```req``` and ```state```. ```req``` contains information about incoming request and ```state``` points to whatever you returned in ```init/3``` function. And then finally ```terminate/3``` function called after handle. The flow is **init/3**, **handle/2**, **terminate/3**. 

In our hello world example ```init3``` function doesn't do much work, it only defining initial state as ```[]```. There is more than that you can do with init, will see soon. On ```handle/2``` side we simply replying our request, with returning code 200(success) and empty headers with content "hello world". ```:cowboy_req.reply/4``` funcion wants current request at the end. After we sent our reply we return current req and state again. 

Let's run our webserver. But now we should pass an additional argument to mix for preventing halt after start. 

```
$ mix run --no-halt
```

Now you can open [http://localhost:8080](http://localhost:8080) in your browser, and you should be see the hello world message. If something goes wrong please check your codes for any typo or syntax error, and also check for 8080 port is empty.

## Long Live Websockets!

We just wrote a simple http handler to handle common http requests. Our handler initialized for every request and then terminated right after sending reply. After now we need more than that, we need to keep connection open to transport messages over it. We need to keep state in time. Websockets will work for us to do these. Writing websocket handlers on cowboy not so different than writing http handlers.

Create a file named ```websocket_handler.ex``` under ```lib/tutorial``` directory.

```elixir
#file websocket_handler.ex
defmodule Tutorial.SocketHandler do
  @behaviour :cowboy_websocket_handler

  def init({:tcp, :http}, _req, _opts) do
    {:upgrade, :protocol, :cowboy_websocket}
  end

  def websocket_init(_transport, req, _opts) do
    {:ok, req, []}
  end

  def websocket_handle({:text, msg}, req, state) do
    {:reply, {:text, msg}, req, state}
  end
      
  def websocket_handle(_data, req, state) do
    {:ok, req, state}
  end

  def websocket_info(msg, req, state) do
    {:ok, req, state}
  end
  
  def websocket_terminate(_reason, _req, _state), do: :ok

end
```

As you can see we use ```@behaviour :cowboy_websocket_handler``` and this behaviour needs some functions to be defined. I write them just as place holders above. Before start to fill in the blanks just look at the differences between http_handler and a websocket_handler. We see same ```init/3``` from http_handler and also ```websocket_init/3```, ```websocket_handle/3``` and ```websocket_terminate``` not so look different from http_handler versions. There is only ```websocket_info/3``` is different here, we back to it soon.

Websocket handler's lifecycle is bit different from http version. Each request use its own handler, this means handler doesn't shared between requests even they come from same source. Every request for http_handler init, handle, and terminate called in order. But on the websocket side the request only sent at the beginning on communication, after connection messages start to be sent. Our connection won't die. And same handler shared between messages sent over same connection. Websocket's life cycle can be like init, websocket_init, websocket_handle, websocket_handle, websocket_handle, websocket_terminate. websocket_handle calls can be much more. 

First we need to upgrade our request to websocket it happening in ```init/3``` function.

```elixir
#file lib/tutorial/websocket_handler.ex
def init({:tcp, :http}, _req, _opts) do
  {:upgrade, :protocol, :cowboy_websocket}
end
```

After upgrade cowboy process our request as websocket and then it call ```websocket_init``` to initialize handler, it looks like init function as we defined in hello_world_handler.

```elixir
#file lib/tutorial/websocket_handler.ex
def websocket_init(_transport, req, _opts) do
  {:ok, req, []}
end
```

Definition of websocket_terminate is just like http_handler's terminate. It just returns ```:ok```. Of course you can add whatever you want here like logging terminated sockets.

```elixir
#file lib/tutorial/websocket_handler.ex
def websocket_terminate(_reason, _req, _state), do: :ok
```

Our websocket handler behaves like an **echo server**. When the message arrives to our handler it will send it back as it is.

```elixir
#file lib/tutorial/websocket_handler.ex
def websocket_handle({:text, msg}, req, state) do
  {:reply, {:text, msg}, req, state}
end
```

websocket_handle's first definition only accepts **text** messages as you can see on pattern matching. This handle function will be called on every text message comes from client (keep in mind our state and request will be shared between handle calls. Because we don't close the connection until we want or something wrong happened). websocket_handle returns ```{:reply, {:text, msg}, req, state}```. If you are returning ```:reply```, a message will be sent to client. If you don't want to send a message back you can use ```{:ok, req, state}```. If you wondering what are the other possible returning values are you can read from [cowboy's source code](https://github.com/extend/cowboy/blob/master/src/cowboy_websocket_handler.erl#L69) easily, and see the other reply formats at [here](https://github.com/extend/cowboy/blob/master/src/cowboy_websocket.erl#L35).

websocket_handle's second definition (pattern matching) is just a fallback mechanism for other type of messages which possible to come from client. We just say ```:ok``` and ignore them.

```elixir
#file lib/tutorial/websocket_handler.ex
def websocket_handle(_data, req, state) do
  {:ok, req, state}
end
```

Conwoy automatically creates new processes for each request. When using websockets our connection keeps alive so our **process keeps alive** this means we can send message from other erlang processes like ***chat_server*** we build soon. We can handle such messages with **websocket_info/** (keep in mind these messages are different from messages which sent by user). We just ignore these messages for a now, we return back after implemented chat server.

```elixir
#file lib/tutorial/websocket_handler.ex
def websocket_info(msg, req, state) do
  {:ok, req, state}
end
```

Our websocket handler is ready to use, let's add it to cowboy's routes.

```elixir
#file lib/tutorial.ex
def start(_type, _args) do
  dispatch = :cowboy_router.compile([
    # {URIHost, list({URIPath, Handler, Opts})}
    {:_, [
      {"/", Tutorial.HelloWorldHandler, []},
      {"/socket", Tutorial.WebsocketHandler, []}
    ]}
  ])

  {:ok, _} = :cowboy.start_http(:http, 100,
                                [port: 8080],
                                [env: [dispatch: dispatch]])

  Tutorial.Supervisor.start_link
end
```

If everything looks ok run the project again with ```mix run --no-halt``` I've prepared a simple [web page for testing](http://jsfiddle.net/EAVvQ/25/) our websocket handler, we will add our html files later in our project. If everything goes right, you should be able to see ```> CONNECTED``` message on jsfidddle.

<a href="{{site.url}}/assets/a-weekend-with-elixir/js-fiddle-first-ss.png" class="fancy" title="Jsfiddle screen shot for demo page!">
  <img src="{{site.url}}/assets/a-weekend-with-elixir/js-fiddle-first-ss.png" alt="Jsfiddle screen shot">
</a>

If you enter some message to input box end press enter you will see our server replied it with same exact message you just sent. At this moment we've built the interaction between client and server over websockets. After now we start to shape our chat server with multiple rooms, joining and leaving functionalities and broadcasting messages to other users who sharing same room with each other.

## Join, Talk, Leave! This is our ChatServer! I mean GenServer!

Our clients will send three different messages; ```join```, ```talk```, and ```leave```, of course *they can send any type of messages* but at least we will considere about three of them. These three special messages causing state to be changed and inform the necessary users about the action. But how do our socket handler functions know other clients? Is there any way to send messages from our handler to others? I don't know maybe the answer can be "yes" but, in my opinion they should be totally separated from each other and they don't need to know anything about the other ones. We can solve this problem with building a simple central server(our chat server) to keep connected clients' lists and also for transfering the messages between them. We will keep the list separated by each room. There is no need to transfer messages between different rooms this makes things easier.

We need a separate process to live from begginning to end. And there should be a way to send and get messages. Erlang OTP describes our need as gen_server(generic server) behaviour. And it has many similiarities with websocket handlers we just wrote. The initialization part, a message handler, and termination it looks like all same, but little different details. 