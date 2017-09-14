/*
*
*   This file contains
*   the main class of PipaGateway.
*
*/

'use strict';

var fs = require('fs');
var path = require('path');
var request = require('request');
var _ = require('lodash');
var async = require('async');
var helper = require('./helper');

module.exports = PipaGateway;

function PipaGateway (app, opts) {
  this.app = app;
  this.configPath = opts.configPath || '';
  this.middlewarePath = process.cwd() + '/' + opts.middlewarePath || '';
  this.domain = {};
}

/*
*   readConfig
*   Read the API gateway config.
*
*   Params
*   @filepath   string    Full path of the config file.
*/
PipaGateway.prototype.readConfig = function (filepath, cb) {
  fs.readFile(filepath, function (err, data) {
    if (err) return cb(err);

    try {
      cb(null, JSON.parse(data));
    } catch (e) {
      cb({ message: 'Failed to parse config file.', err: e });
    }
  });
};

/*
*   open
*   Run the PipaGateway
*/
PipaGateway.prototype.open = function () {
  var self = this;

  this.readConfig(this.configPath, function (err, configData) {
    if (err) {
      console.log('\x1b[31m%s\x1b[0m',  err.message);
      console.log('\x1b[31m%s\x1b[0m',  err.err);
      return;
    }

    if (configData.domain)
      self.domain = configData.domain;

    _.forOwn(configData.routes, function (val, key) {
      self.__init__routes(key, val);
    });
  });
};

/*
*   __init__routes
*   Initialize routes.
*
*   Params
*   @methodPath   string    Contains method and path url
*   @config       obj       Contains config
*/
PipaGateway.prototype.__init__routes = function (methodPath, config) {
  var self = this;
  var httpMethod = methodPath.trim().split(' ')[0].toLowerCase();
  var endpoint = methodPath.trim().split(' ')[1].toLowerCase();

  var middlewares = [];
  var type = (config && config.type) ? config.type : 'default';

  switch (type) {
    case 'proxy':
      middlewares.push(self.__route__handler.proxy(self.domain, httpMethod, config));
      break;
    case 'parallel':
      middlewares.push(self.__route__handler.parallel(self.domain, httpMethod, config));
      break;
    case 'chain':
      middlewares.push(self.__route__handler.chain(self.domain, httpMethod, config));
      break;
    default:
      config.middlewares.forEach(function (item) {
        if (item.trim().split('.').length > 1) {
          var fileName = item.trim().split('.')[0];
          var functionName = item.trim().split('.')[1];
          middlewares.push(require(path.join(self.middlewarePath, fileName))[functionName]);
        }
      });
  }

  this.app[httpMethod](endpoint, middlewares);
};


/*
*   __route__handler
*   Handle route based on `type`.
*/
PipaGateway.prototype.__route__handler = {

  /*
  *   proxy
  *   Direct call to a service.
  */

  proxy: function (domain, httpMethod, config) {
    return function (req, res, next) {
      var method = httpMethod.toUpperCase();

      var opts = {
        method: method,
        uri: helper.generateUrl(domain, config.services.url, req.params),
        headers: helper.removeDefaultHeaders(req.headers),
        json: true
      };

      if (method === 'GET')
        opts.qs = req.query;
      else
        opts.body = req.body;

      request(opts, function (err, response, body) {
        if (err)
          return res.status(err.statusCode).send(err.response.body);

        res.status(response.statusCode).send(body);
      });
    };
  },

  /*
  *   parallel
  *   Call multiple services in one time.
  */

  parallel: function (domain, httpMethod, config) {
    return function (req, res, next) {
      var worker = {};
      var method = httpMethod.toUpperCase();

      config.services.forEach(function (item) {
        worker[item.name] = function (cb) {
          var opts = {
            method: method,
            uri: helper.generateUrl(domain, item.url, req.params),
            headers: helper.removeDefaultHeaders(req.headers),
            json: true
          };

          if (method === 'GET')
            opts.qs = req.query;
          else
            opts.body = req.body;

          request(opts, function (err, response, body) {
            if (err)
              return cb(null, { statusCode: err.statusCode || 500, err: err.response.body });

            cb(null, { statusCode: response.statusCode || 200, body: body });
          });
        };
      });

      async.parallel(worker, function (err, result) {
        var data = {};
        for (var key in result) {
          data[key] = result[key].body;
        }

        res.send(data);
      });
    };
  },

  /*
  *   Chain
  *   Call mutliple services one-by-one.
  */

  chain: function (domain, httpMethod, config) {
    return function (req, res, next) {
      var worker = [];

      config.services.forEach(function (item) {
        worker.push(function (data, cb) {
          var url = item.url;

          if (!cb) {
            cb = data;
            data = {};
          } else {
            helper.getWordsBetweenCurlies(url).forEach(function(word){
              let replacementValue = _.get(data, word) || '';
              url = url.replace("{"+word+"}", replacementValue);
            });

            if(item.body){
              _.forOwn(item.body, function(value, key) {
                var curlies = helper.getWordsBetweenCurlies(value);

                if (curlies != null)
                  item.body[key]= _.get(data, curlies[0]) || '';
              });

              _.extend(req.body, item.body);
            }
          }

          var method = httpMethod.toLowerCase();

          var opts = {
            method: method,
            uri: helper.generateUrl(domain, item.url, req.params),
            headers: helper.removeDefaultHeaders(req.headers),
            json: true
          };

          if (method === 'GET')
            opts.qs = req.query;
          else
            opts.body = req.body;

          request(opts, function (err, response, body) {
            if (err)
              return cb(null, { statusCode: err.statusCode, err: err.response.body });

            cb(null, { statusCode: response.statusCode, body: body });
          });
        });
      });

      async.waterfall(worker, function (err, result) {
        if (result.err)
          return res.status(result.statusCode).send(result);

        res.status(result.statusCode).send(result);
      });
    };
  }

};
