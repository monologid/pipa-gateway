# PIPA GATEWAY

>  PIPA GATEWAY A api gateway, proxy, or orchestrator  extension for ExpressJS.

### Why PIPA

> The idea of PIPA GATEWAY is about how to create api gateway, proxy, or orchestrator  easy-way, readable in expressjs. PIPA GATEWAY  will forward your request body, headers, and query string to services. 

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

var pipaGateway = new PipaGateway(app, 'config.json', 'middleware');
pipaGateway.open();

app.listen(9000);

```

### How-To

There are 3 type process in pipa gateway, `proxy`, `parallel` and `chain`.

#### PROXY
Proxy type will forward your request to services.
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
Parallel type will request pararel to multilple services.
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
            "url": "https://jsonplaceholder.typicode.com/post"
          }
        ]
    }
}
```

#### Chain
Chain type will request chain to multilple services, next request will process after previous request successfully, and can set parameter to next request from value previous request 
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


### Code Example

You can try to run the code example in `example` folder.

### License

  [MIT](LICENSE) 
