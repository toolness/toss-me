This is a simple HTML5 app that lets users toss temporary
files between devices.

<img src="https://raw.githubusercontent.com/toolness/toss-me/master/static/toss-me.gif">

## Quick Start

```
git clone https://github.com/toolness/toss-me.git
cd toss-me
npm install
DEBUG= node app.js
```

## Environment Variables

**Note:** When an environment variable is described as representing a
boolean value, if the variable exists with *any* value (even the empty
string), the boolean is true; otherwise, it's false.

* `DEBUG` represents a boolean value. Setting this to true makes the server
  always regenerate bundled source code every request, among other things.

* `PORT` is the port that the server binds to. Defaults to 3000.

* `USERPASS` is an optional setting of the form *username:password*. If
  set, the entire server is protected by HTTP Basic Authentication
  and requires the given username and password to access.

## Limitations

The files are temporarily stored on the filesystem. In
fact, they're not actually deleted--it's just assumed the
process is running on a Heroku dyno that will eventually spin
down.

The app is also not [12-factor][] compliant: it should only
run as a single, stateful process, and cannot scale out
via the process model.

  [12-factor]: http://12factor.net/
