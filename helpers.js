const request = require('request-promise');

const slack = (api, data={}, method='POST') => {
  return request({
        method : 'POST',
        uri: `https://slack.com/api/${api}`,
        form: data,
        headers: {
           'content-type': 'application/x-www-form-urlencoded' 
        }
      });
};

const getUserName = (userName) => {
  
};

exports.slack = slack;