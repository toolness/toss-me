## Quick Start

```
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
