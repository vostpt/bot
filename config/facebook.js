const {
    FACEBOOK_TOKEN_VOSTPT,
    FACEBOOK_TOKEN_VOSTPTia,
} = process.env;

const facebookKeys = [{
    reference: 'main',
    pageName: 'VOSTPT',
    fetchPosts: false,
    keys: {
        access_token: FACEBOOK_TOKEN_VOSTPT,
    },
}, {
    reference: 'main-test',
    pageName: 'VOSTPTia',
    fetchPosts: true,
    keys: {
        access_token: FACEBOOK_TOKEN_VOSTPTia,
    },
}];

module.exports = {
    facebookKeys,
    defaultReference: 'main-test'
};