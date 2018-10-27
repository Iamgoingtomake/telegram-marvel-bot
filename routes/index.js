var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('Marvel bot funcionando :v');
});

module.exports = router;
