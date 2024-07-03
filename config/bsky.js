const {
  BSKY_HANDLE,
  BSKY_PASS
} = process.env;

const bskyKeys = {
  reference: 'main',
  screenName: BSKY_HANDLE,
  keys: {
    bsky_handle: BSKY_HANDLE,
    bsky_password: BSKY_PASS,
  },
};


module.exports = {
  bskyKeys
}
