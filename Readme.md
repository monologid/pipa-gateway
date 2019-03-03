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
You can also put prefix in the environment variables. It really useful if you have multiple server environments (DEV, STAGING, PROD, etc.) and each enviroment have different prefix. To achive that, you have to add prefix in enviroment variable begin with `PIPA_GATEWAY_PREFIX_`. 
Example:
```bash
PIPA_GATEWAY_PREFIX_EXAMPLE=/example
```
```json
{
  "domain": {
    "sample": "http://example.com" 
  },
  "prefix": "${prefix.go_example}",
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

### Set `domain` from Enviroment Variables
In a real world, you may need to have multiple server enviroments (DEV, STAGING, PROD, etc.)
If we define the `domain` inside the `json file`, we can only have 1 enviroment.
So, to cater the issue, you have to define the `domain` in the `enviroment variables` instead.

Every environment variable which starts with `PIPA_GATEWAY_DOMAIN_` will be added to `domain` object. 

Example of `.env` file:
```bash
const domainObject = {
  "PIPA_GATEWAY_DOMAIN_SAMPLE": "http://example.com",
  "PIPA_GATEWAY_DOMAIN_TESTING": "http://testing.com"
}  
```

Note: if you defined `domain` both in the `json file` and `environment variables`, the one defined in `json file` will be replaced. 


### Code Example

You can try to run the code example in `example` folder.

### License

[Apache-2.0](LICENSE)

### Contributors
[Faris](https://github.com/madebyais)

[Septiyan Andika](https://github.com/septiyanandika)

[Habib Ridho](https://github.com/habibridho)
