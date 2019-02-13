# PIPA GATEWAY [![codecov](https://codecov.io/gh/SeptiyanAndika/pipa-gateway/branch/master/graph/badge.svg)](https://codecov.io/gh/SeptiyanAndika/pipa-gateway)

> A NodeJS module to help you create an API Gateway in an easy way.

### Why PIPA GATEWAY

> The concept of PIPA GATEWAY is similar to PipaJS, to enable developer to create an orchestrator or an API Gateway or a proxy in easy way.

### Installation

```bash
$ npm install pipa-gateway

var express = require('express')
var app = express()
var PipaGateway = require('pipa-gateway');

// PipaGateway
// @param   object      Express app
// @param   string      File json config
// @param   string      Middleware folder

var pipaGateway = new PipaGateway(app, { configPath: 'config.json', middlewarePath: 'middleware' });
pipaGateway.open();

app.listen(9000);

```

### How-To

There are 3 features in pipa gateway, `proxy`, `parallel` and `chain`.

#### PROXY
`Proxy` will forward your request to services.
```json
{
   "GET /users": {
    "type": "proxy",
    "service":
      {
        "name": "users",
        "url": "https://jsonplaceholder.typicode.com/users"
      }
  },
  "GET /user/:id": {
    "type": "proxy",
    "middlewares":["Auth.ensureAuth"],
    "service":
      {
        "name": "user",
        "url": "https://jsonplaceholder.typicode.com/users/:id"
      }
  }
}
```

#### PARALLEL
`Parallel` will request parallel to multilple services.
```json
{
    "GET /parallel": {
        "type": "parallel",
        "services": [
          {
            "name": "user",
            "url": "https://jsonplaceholder.typicode.com/users"
          },
          {
            "name": "post",
            "url": "https://jsonplaceholder.typicode.com/posts"
          }
        ]
    }
}
```

#### Chain
`Chain` will request chain to multiple services, the next request will process after previous request successfully and can set parameter to the next request based on result on previous request.
```json
{
   "GET /chain/:id": {
    "type": "chain",
    "services": [
      {
        "name": "user",
        "url": "https://jsonplaceholder.typicode.com/users/:id"
      },
      {
        "name": "post",
        "url": "https://jsonplaceholder.typicode.com/posts?userId={user.id}",
        "body":{
          "userId":"{user.id}"
        }
      }
    ]
  }
}
```

### Prefix URL
If you need to add prefix, you can add `prefix` field in the configuration file. For example, this request from `http://example.com/my-prefix/users` will be proxied to `https://jsonplaceholder.typicode.com/users`
```json
{
  "domain": {
    "sample": "http://example.com"
  },
  "prefix": "/my-prefix",
  "routes": {
    "GET /users": {
      "type": "proxy",
      "service":
        {
          "name": "users",
          "url": "https://jsonplaceholder.typicode.com/users"
        }
    }
  }
}
```

### Code Example

You can try to run the code example in `example` folder.

### License

[Apache-2.0](LICENSE)

### Contributors
[Faris](https://github.com/madebyais)

[Septiyan Andika](https://github.com/septiyanandika)
