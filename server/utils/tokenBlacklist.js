var blacklist = {};

function addToBlacklist(userId) {
  blacklist[userId.toString()] = Date.now();
}

function isBlacklisted(userId, tokenIssuedAt) {
  var key = userId.toString();
  if (!blacklist[key]) return false;
  return blacklist[key] > tokenIssuedAt * 1000;
}

function cleanup() {
  var now = Date.now();
  var maxAge = 7 * 24 * 60 * 60 * 1000;
  var keys = Object.keys(blacklist);
  for (var i = 0; i < keys.length; i++) {
    if (now - blacklist[keys[i]] > maxAge) {
      delete blacklist[keys[i]];
    }
  }
}

setInterval(cleanup, 60 * 60 * 1000);

module.exports = { addToBlacklist, isBlacklisted };
