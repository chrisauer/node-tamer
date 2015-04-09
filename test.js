var Tamer = new require('./index.js');
var tamer = new Tamer('192.168.59.103:2181');

tamer.start()
  .then(function () {
    var cache = tamer
      .newPathChildrenCache('/environment');

    cache.start()
      .then(function () {
        console.log('cache started');
        console.log('done');

        setInterval(function () {
          cache
            .get('auth_connector_service_url')
            .then(function (d) {
              console.log(''+d);
            });
        }, 1000);
      });
  });
