const {
    FACEBOOK_TOKEN_VOSTPT,
} = process.env;

const facebookKeys = [{
    reference: 'main',
    pageName: 'VOSTPTia',
    fetchPosts: true,
    keys: {
        access_token: FACEBOOK_TOKEN_VOSTPT,
    },
}];

module.exports = {
    facebookKeys,
    defaultReference: 'main'
};