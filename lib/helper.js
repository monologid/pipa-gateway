/*
*
*   This file contains helper method
*   for the main library.
*
*/

"use strict";

var _ = require("lodash");

module.exports = {
  /*
  *   generateUrl
  *
  *   Params
  *   @url    string    URL string
  *   @params obj       Object parameters
  */

  generateUrl: function(domain, url, params) {
    var self = this;

    _.forOwn(params, function(value_param, key_param) {
      url = url.replace(`:${key_param}`, value_param);
    });

    var dollarCurlies = self.getWordsBetweenDollarCurlies(url);
    dollarCurlies.forEach(function(item) {
      var domainName = item.split(".")[1];
      url = url.replace("${" + item + "}", domain[domainName]);
    });

    return url;
  },

  /*
  *   getWordsBetweenCurlies
  *
  *   Params
  *   @str    string    Text string
  */

  getWordsBetweenCurlies: function(str) {
    var results = [],
      re = /{([^}]+)}/g,
      text;

    while ((text = re.exec(str))) {
      results.push(text[1]);
    }

    return results;
  },

  /*
  *   getWordsBetweenDollarCurlies
  *
  *   Params
  *   @str    string    Text string
  */

  getWordsBetweenDollarCurlies: function(str) {
    var results = [],
      re = /\${([^}]+)}/g,
      text;

    while ((text = re.exec(str))) {
      results.push(text[1]);
    }

    return results;
  },

  /*
  *   removeDefaultHeaders
  *
  *   Params
  *   @headers    obj    Header object
  */

  removeDefaultHeaders: function(headers) {
    delete headers.host;
    delete headers["accept-encoding"];
    delete headers["accept-language"];
    delete headers["if-none-match"];
    delete headers["content-length"];

    return headers;
  },

  constructDomainObjectFromEnvironmentVariables: function() {
    const prefix = 'PIPA_GATEWAY_DOMAIN_'

    let domain = {}

    for (var key in process.env) {
      if (key.startsWith(prefix)) {
        var newKey = key.replace(prefix, '').toLowerCase();
        domain[newKey] = process.env[key]
      }
    }

    return domain
  }
};
