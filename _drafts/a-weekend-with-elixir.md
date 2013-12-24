---
layout: post
title: A Weekend With Elixir
---

For a long time i've been wanting to dive into elixir. Finally found some time and write some code. First, if you don't know [elixir](http://www.elixir-lang.org) is a programming language which compiles to same erlang vm bytecode. Just think like how any other JVM languages compiles into jvm bytecode. And this means you have full access to erlang's environment. Elixir and erlang share same semantics because of that reading erlang documents or using any erlang libraries doesn't hurt you.

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
: directory is our source files location. Yeah unusually they choose to name as lib instead of src. I don't know the reasons. Anyway we write our elixir codes in here. Mix already creates a **supervisor.ex** and **tutorial.ex**. I will explain some conventions later.

**test/**
: mix create a folder for testing in default. You can write down your tests into there. mix also can run your tests with **mix test**.

## Where the application starts to work? Behaviours?

Ok if you try to run **mix run** you just saw compilation messages and nothing happened. Actually our application was run but there is nothing to see and halted at the end. Our application is defined in **lib/tutorial.ex**.

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

