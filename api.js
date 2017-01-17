var Rx = require('rx');
var superagent = require('superagent');

/* rx extension */
superagent.Request.prototype.asObservable = function() {
	var self = this;
	return Rx.Observable.create(function(observable) {
		self.end(function(err, res) {
			if (err) {
				observable.onError(err);
			} else {
				observable.onNext(res);
				observable.onCompleted();
			}
		});
	});
};

module.exports = superagent;