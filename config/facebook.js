const {
    FACEBOOK_TOKEN_VOSTPT,
    FACEBOOK_TOKEN_RALLY,
} = process.env;

const facebookKeys = [{
    reference: 'main',
    pageName: 'VOSTPT',
    fetchPosts: true,
    keys: {
        access_token: FACEBOOK_TOKEN_VOSTPT,
    },
},
{
    reference: 'rally',
    pageName: 'VOSTPTia',
    fetchPosts: true,
    keys: {
        access_token: FACEBOOK_TOKEN_RALLY,
    },
}];

module.exports = {
    facebookKeys,
    defaultReference: 'main'
};
