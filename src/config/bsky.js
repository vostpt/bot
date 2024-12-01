const {
  BSKY_HANDLE,
  BSKY_PASS,
  BSKY_REPOHANDLE,
} = process.env;

const bskyKeys = {
  reference: 'main',
  screenName: BSKY_HANDLE,
  keys: {
    bsky_handle: BSKY_HANDLE,
    bsky_password: BSKY_PASS,
    bsky_repohandle: BSKY_REPOHANDLE,
  },
};


module.exports = {
  bskyKeys
}
