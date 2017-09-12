'use strict';

var fs = require('fs');
var path = require('path');
var request = require('request');
var _ = require('lodash');
var async = require('async');

function PipaGateway (app, config,middleware) {
    this.app = app;
    this.config = config;
    this.middleware = middleware;
}


PipaGateway.prototype = {

    open: function () {
        var self = this;
        this.readConfig(this.config,function(err,routes){
            if(err){
                console.log('\x1b[31m%s\x1b[0m',  err.message);
                console.log('\x1b[31m%s\x1b[0m',  err.err);
            }else{
                _.forOwn(routes, function(value, key) {
                    self.__create__routes(key,value);
                });
            }
        })
    },
    readConfig: function (path, cb) {
        var self = this;
        try{
            var obj = JSON.parse(fs.readFileSync(path, 'utf8'));
            cb(null,obj);
        }catch(err){
            cb({message:'error parsing config',err:err},null);
        }
    },

    __create__routes: function (key,item) {
        var self = this;
        var method = key.trim().split(' ')[0].toLowerCase();
        var endpoint = key.trim().split(' ')[1].toLowerCase();  
        var routerMiddelwares =[];
        if(item.middlewares){
            item.middlewares.forEach(function(middlewareName){
                var fileName = middlewareName.trim().split('.')[0];
                var functionName = middlewareName.trim().split('.')[1];
                routerMiddelwares.push(require(path.join(self.middlewareBasePath(), fileName))[functionName]);                
            })
        }
        if(item.type=="proxy"){
            routerMiddelwares.push(
                self.__handling__proxy(method,item)
            )

        }else if(item.type=="parallel"){
            routerMiddelwares.push(
                self.__handling__parallel(method,item)
            )
        }else if(item.type=="chain"){
            routerMiddelwares.push(
                self.__handling__chain(method,item)
            )
        }

        this.__endpoint__handler(method,endpoint,routerMiddelwares);
    },

    __endpoint__handler: function (method, endpoint, routerMiddelwares) {
        this.app[method](endpoint, routerMiddelwares);
    
    },

    middlewareBasePath: function () {
        return process.cwd() + '/' + this.middleware;
    },

    __handling__proxy: function (method,item) {
        let self = this;
        return function (req, res, next) {
          if(method=="get") {
            self.___get__request(item.service.url,req.headers,req.params,req.query,function (error, response, body) {
                if(error){
                     res.status(error.statusCode).send(error.response.body);
                }else{
                    res.status(response.statusCode).send(body);
                }
            });
          }else{
            self.___post_put_delete__request(method,item.service.url,req.headers,req.params,req.body,function (error, response, body) {
                if(error){
                     res.status(error.statusCode).send(error.response.body);
                }else{
                    res.status(response.statusCode).send(body);
                }
            });
          }
        }
    },

    __handling__parallel: function (method,item) {
        let self = this;
        return function (req, res, next) {
          let workers = {};
          if(method=="get") {
                item.services.forEach(function(service){
                    workers[service.name]= function(cb){
                         self.___get__request(service.url,req.headers,req.params,req.query,function (error, response, body) {
                            if(error){
                                let errorBody = error.response.body || {}
                                cb(null,errorBody);
                            }else{
                               cb(null,body);
                            }
                        });  
                    }
                });           
          }else{ 
                item.services.forEach(function(service){
                    workers[service.name]= function(cb){
                         self.___post_put_delete__request(service.url,req.headers,req.params,req.body,function (error, response, body) {
                            if(error){
                                let errorBody = error.response.body || {}
                                cb(null,errorBody);
                            }else{
                               cb(null,body);
                            }
                        });  
                    }
                });
            }

            async.parallel(workers,function(error,results){
                if(error){
                    res.status(500).send({});
                }else{
                    res.status(200).send(results);
                }
            });
        }
    },

    __handling__chain: function (method,item) {
        let self = this;
        return function (req, res, next) {
            let workers = [];
            if(method=="get") {
                item.services.forEach(function(service){
                    workers.push(function(data,cb){
                        var url = service.url;
                        if(!cb){
                            cb =data;
                            data ={};
                        }else{
                            self._getWordsBetweenCurlies(url).forEach(function(item){
                                let replacementValue = _.get(data, item) || '';
                                url = url.replace("{"+item+"}",replacementValue);
                            });

                        }
                        self.___get__request(url,req.headers,req.params,req.query,function (error, response, body) {
                            if(error){
                                let errorBody = error.response.body || {}
                                cb(null,errorBody);
                            }else{
                               data[service.name] = body;
                               cb(null,data);
                            }
                        });  
                    });
                });
            }else{
                item.services.forEach(function(service){
                    workers.push(function(data,cb){
                        var url = service.url;
                        if(!cb){
                            cb =data;
                            data ={};
                        }else{
                            self._getWordsBetweenCurlies(url).forEach(function(item){
                                let replacementValue = _.get(data, item) || '';
                                url = url.replace("{"+item+"}",replacementValue);
                            });

                            if(service.body){
                                _.forOwn( service.body, function(value, key) {
                                    var curlies = self._getWordsBetweenCurlies(value);
                                    if(curlies!=null){
                                        service.body[key]= _.get(data, curlies[0]) || '';
                                    }
                                })
                                _.extend(req.body,service.body);
                            }
                        }
                    
                        self.___post_put_delete__request(url,req.headers,req.params,req.body,function (error, response, body) {
                            if(error){
                                let errorBody = error.response.body || {}
                                cb(null,errorBody);
                            }else{
                               data[service.name] = body;
                               cb(null,data);
                            }
                        });  
                    });
                });
            }

            async.waterfall(workers,function(error,results){
                if(error){
                    console.log(error);
                    res.status(500).send({});
                }else{
                    res.status(200).send(results);
                }
            });
        };
    },
    
    ___get__request: function (uri,headers,params,qs,cb){

        _.forOwn(params, function(value_param, key_param) {
               uri =  uri.replace(`:${key_param}`,value_param);
        });
        delete headers.host;
        delete headers['accept-encoding'];
        delete headers['accept-language'];
        delete headers['if-none-match'];
        delete headers['content-length'];
        var options = {
            method:'GET',
            uri: uri,
            qs:qs,
            headers:headers,
            json: true 
        };
        request(options,cb);
    },


    ___post_put_delete__request: function (method,uri,headers,params,body,cb){
        _.forOwn(params, function(value_param, key_param) {
               uri =  uri.replace(`:${key_param}`,value_param);
        });
        delete headers.host;
        delete headers['accept-encoding'];
        delete headers['accept-language'];
        delete headers['if-none-match'];
        delete headers['content-length'];
        var options = {
            method:method.toUpperCase(),
            uri: uri,
            body:body,
            headers:headers,
            json: true 
        };
        request(options,cb);
    },

    _getWordsBetweenCurlies : function(str) {
      var results = [], re = /{([^}]+)}/g, text;

      while(text = re.exec(str)) {
        results.push(text[1]);
      }
      return results;
    }
}


module.exports = PipaGateway;