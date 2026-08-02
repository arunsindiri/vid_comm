const dns = require('dns');
const orig = dns.lookup;
dns.lookup = function(host, opts, cb) {
  if (typeof opts === 'function') { cb = opts; opts = {}; }
  const v4 = { ...opts, family: 4 };
  return orig.call(dns, host, v4, cb);
};
dns.setDefaultResultOrder('ipv4first');
