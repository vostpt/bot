const router = require('express').Router();
const { channels } = require('../../../config/bot');
const { validateToken } = require('../middleware');
const { client } = require('../../app');

router.use(validateToken);

router.post('/', async (req, res) => {
  const channel = channels.FUEL_CHANNEL_ID;
  const message = req.param('message');

  try {
    await client.channels.get(channel).send(message);
    res.json();
  } catch (e) {
    res.sendStatus(500);
  }
});

module.exports = router;
