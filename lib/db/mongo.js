var util = require('util'),
    Q = require('q'),
    mongoose = require('mongoose'),
    async = require('async');

var PackageSchema = new mongoose.Schema({
    name: String,
    url: String
});

var Package = mongoose.model('Package', PackageSchema);

var MongoDb = function (options) {
  options = options || {};
  options = util._extend(this.defaults, options);
  this.options = options;
  this.client = options.client || mongoose.connect('mongodb://' + options.host + ':' + options.port + '/' + options.database);
};

MongoDb.prototype = {
  defaults: {
      port: 27017,
      host: 'localhost',
      database: 'BowerRegistry'
  },

  // Find a package
  find: function (where) {
    where = where || {};

    var defer = Q.defer(),
        name = where.$match && where.$match.name ? {name: new RegExp(where.$match.name)} : where.name ? {name: where.name} : {},
        client = this.client;

      Package.find(name, function (err, docs) {
          if (err) {
              return defer.reject();
          }

          docs = docs.map(function (doc) {
              var retVal = {
                  name: doc.name,
                  url: doc.url
              };
              return retVal;
          });
          defer.resolve(docs);
      });
    return defer.promise;
  },

  // Add a package in the db
  add: function (pkg) {
    var defer = Q.defer(),
        client = this.client;

    Package.findOne({name: pkg.name}, function (err, doc) {
        if (err)
            return defer.reject;

        if (doc && doc.length)
            return defer.reject();

        var newPackage = new Package({
            name: pkg.name,
            url: pkg.url
        }).save(function (err) {
            if (err)
              return defer.reject();

            defer.resolve();
        });
    });
    return defer.promise;
  }
};

exports.MongoDb = MongoDb;