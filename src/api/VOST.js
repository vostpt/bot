/* eslint-disable no-underscore-dangle,no-console,class-methods-use-this,eol-last */

const APIURL = 'https://api.vost.pt/v1/';

// Picking Axios after thorough review of Axios and node-fecth - Miguel Santos

const axios = require('axios').create({
  baseURL: APIURL,
  headers: {
    common: {
      'Content-Type': 'application/vnd.api+json',
      accept: 'application/vnd.api+json',
      Authorization: '',
    },
  },
});


class Auth {
  constructor(auth) {
    if (auth == null) {
      this.email = '';
      this.password = '';
    } else {
      this.email = auth.email;
      this.password = auth.password;
      this.__login();
      setInterval(this.__refreshToken.bind(this), auth.refreshRate);
    }
  }

  async __refreshToken() {
    if (this.email === '') {
      return;
    }

    try {
      const response = await axios.get('/auth/refresh');
      axios.defaults.headers.common.Authorization = `Bearer ${response.meta.access_token}`;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 401:
            // We attempt to login again
            if (await this.__login() === false) {
              throw new Error('Unauthorised');
            }
            return;
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }

  async __login() {
    if (this.email === '') {
      return false;
    }

    try {
      const response = await axios.post('/auth', {
        email: this.email,
        password: this.password,
        access_token: '',
      });
      axios.defaults.headers.common.Authorization = `Bearer ${response.meta.access_token}`;
      return true;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 403:
            return false;
          case 422:
            throw new Error('Unprocessable Entity');
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }

  async verify() {
    if (this.email === '') {
      return false;
    }

    try {
      const response = await axios.get('/auth/verify');
      if (response.status === 201) {
        return true;
        // eslint-disable-next-line no-else-return
      } else if (await this.__login() === true) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 401:
            // We attempt to login again
            if (await this.__login() === false) {
              throw new Error('Unauthorised');
            }
            return true;
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }
}

class Users {
  async roles() {
    try {
      const response = await axios.get('/users/roles');
      return response.data;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 401:
            throw new Error('Unauthorised');
          case 403:
            throw new Error('Forbidden');
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }

  async get(page_number = 1, page_size = 50, ids = [], search = '', exact = 0, roles = ['administrator', 'moderator', 'contributor'], sort = 'created_at', order = 'desc') {
    try {
      const response = await axios.get('/users', {
        params: {
          page: {
            number: page_number,
            size: page_size,
          },
          ids,
          search,
          exact,
          roles,
          sort,
          order,
        },
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 401:
            throw new Error('Unauthorised');
          case 403:
            throw new Error('Forbidden');
          case 422:
            throw new Error('Unprocessable Entity');
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }

  async create(name, surname, email, password, passwordConfirmation) {
    try {
      const response = await axios.post('/users', {
        name,
        surname,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      if (response.status === 201) {
        return true;
      }
      return false;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 401:
            throw new Error('Unauthorised');
          case 403:
            throw new Error('Forbidden');
          case 422:
            throw new Error('Unprocessable Entity');
          case 429:
            throw new Error('Too Many Requests');
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }

  async view(id) {
    try {
      const response = await axios.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 401:
            throw new Error('Unauthorised');
          case 403:
            throw new Error('Forbidden');
          case 404:
            throw new Error('Not Found');
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }

  async update(id, name, surname, email, password, passwordConfirmation) {
    try {
      const response = await axios.patch(`/users/${id}`, {
        name,
        surname,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      if (response.status === 201) {
        return true;
      }
      return false;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 401:
            throw new Error('Unauthorised');
          case 403:
            throw new Error('Forbidden');
          case 404:
            throw new Error('Not Found');
          case 422:
            throw new Error('Unprocessable Entity');
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }
}

class Acronyms {
  async get(page_number = 1, page_size = 50, ids = [], search = '', exact = 0, sort = 'created_at', order = 'desc') {
    try {
      const response = await axios.get('/acronyms', {
        params: {
          page: {
            number: page_number,
            size: page_size,
          },
          ids,
          search,
          exact,
          sort,
          order,
        },
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 422:
            throw new Error('Unprocessable Entity');
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }

  async create(initials, meaning) {
    try {
      const response = await axios.post('/acronyms', {
        initials,
        meaning,
      });
      if (response.status === 201) {
        return true;
      }
      return false;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 401:
            throw new Error('Unauthorised');
          case 403:
            throw new Error('Forbidden');
          case 422:
            throw new Error('Unprocessable Entity');
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }

  async view(id) {
    try {
      const response = await axios.get(`/acronyms/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 404:
            throw new Error('Not Found');
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }

  async update(id, initials, meaning) {
    try {
      const response = await axios.patch(`/acronyms/${id}`, {
        initials,
        meaning,
      });
      if (response.status === 201) {
        return true;
      }
      return false;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 401:
            throw new Error('Unauthorised');
          case 403:
            throw new Error('Forbidden');
          case 404:
            throw new Error('Not Found');
          case 422:
            throw new Error('Unprocessable Entity');
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }

  async delete(id) {
    try {
      const response = await axios.delete(`/acronyms/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 401:
            throw new Error('Unauthorised');
          case 403:
            throw new Error('Forbidden');
          case 404:
            throw new Error('Not Found');
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }
}

class Events {
  async get(page_number = 1, page_size = 50, ids = [], search = '', exact = 0, types = [], parishes = [], latitude = null, longitude = null, radius = 10, sort = 'created_at', order = 'desc') {
    try {
      const response = await axios.get('/events', {
        params: {
          page: {
            number: page_number,
            size: page_size,
          },
          ids,
          search,
          exact,
          types,
          parishes,
          latitude,
          longitude,
          radius,
          sort,
          order,
        },
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 422:
            throw new Error('Unprocessable Entity');
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }

  async create(type, parish, name, description, latitude, longitude, startedAt, endedAt = null) {
    try {
      const response = await axios.post('/events', {
        type,
        parish,
        name,
        description,
        latitude,
        longitude,
        started_at: startedAt,
        ended_at: endedAt,
      });
      if (response.status === 201) {
        return true;
      }
      return false;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 401:
            throw new Error('Unauthorised');
          case 403:
            throw new Error('Forbidden');
          case 422:
            throw new Error('Unprocessable Entity');
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }

  async view(id) {
    try {
      const response = await axios.get(`/events/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 404:
            throw new Error('Not Found');
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }

  async update(id, type, parish, name, description, latitude, longitude, startedAt,
    endedAt = null) {
    try {
      const response = await axios.patch(`/events/${id}`, {
        type,
        parish,
        name,
        description,
        latitude,
        longitude,
        started_at: startedAt,
        ended_at: endedAt,
      });
      if (response.status === 201) {
        return true;
      }
      return false;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 401:
            throw new Error('Unauthorised');
          case 403:
            throw new Error('Forbidden');
          case 404:
            throw new Error('Not Found');
          case 422:
            throw new Error('Unprocessable Entity');
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }

  async delete(id) {
    try {
      const response = await axios.delete(`/events/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 401:
            throw new Error('Unauthorised');
          case 403:
            throw new Error('Forbidden');
          case 404:
            throw new Error('Not Found');
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }
}

class OccurrenceReports {
  async generate(page_number = 1, page_size = 50, ids = [], search = '', exact = 0, events = [], types = [], statuses = [], districts = [], counties = [], parishes = [], startedAt, endedAt, sort = 'created_at', order = 'desc') {
    try {
      const response = await axios.get('/occurrences/reports/generate', {
        params: {
          page: {
            number: page_number,
            size: page_size,
          },
          ids,
          search,
          exact,
          events,
          types,
          statuses,
          districts,
          counties,
          parishes,

          started_at: startedAt,
          ended_at: endedAt,
          sort,
          order,
        },
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 422:
            throw new Error('Unprocessable Entity');
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }

  async download(signature) {
    try {
      const response = await axios.get(`/occurrences/reports/${signature}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 404:
            throw new Error('Not Found');
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }
}

class Occurrences {
  constructor(auth = null) {
    this.Reports = new OccurrenceReports(auth);
  }

  async get(page_number = 1, page_size = 50, ids = [], search = '', exact = 0, events = [], types = [], statuses = [], districts = [], counties = [], parishes = [], latitude = null, longitude = null, radius = 10, startedAt, endedAt, sort = 'created_at', order = 'desc') {
    try {
      const response = await axios.get('/occurrences', {
        params: {
          page: {
            number: page_number,
            size: page_size,
          },
          ids,
          search,
          exact,
          events,
          types,
          statuses,
          districts,
          counties,
          parishes,
          latitude,
          longitude,
          radius,
          started_at: startedAt,
          ended_at: endedAt,
          sort,
          order,
        },
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 422:
            throw new Error('Unprocessable Entity');
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }

  async view(id) {
    try {
      const response = await axios.get(`/occurrences/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 404:
            throw new Error('Not Found');
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }

  async update(id, event) {
    try {
      const response = await axios.patch(`/occurrences/${id}`, {
        event,
      });
      if (response.status === 201) {
        return true;
      }
      return false;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 401:
            throw new Error('Unauthorised');
          case 403:
            throw new Error('Forbidden');
          case 404:
            throw new Error('Not Found');
          case 422:
            throw new Error('Unprocessable Entity');
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }

  async families(page_number = 1, page_size = 50, ids = [], search = '', exact = 0, sort = 'created_at', order = 'desc') {
    try {
      const response = await axios.get('/occurrences/families', {
        params: {
          page: {
            number: page_number,
            size: page_size,
          },
          ids,
          search,
          exact,
          sort,
          order,
        },
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 422:
            throw new Error('Unprocessable Entity');
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }

  async species(page_number = 1, page_size = 50, ids = [], search = '', exact = 0, families = [], sort = 'created_at', order = 'desc') {
    try {
      const response = await axios.get('/occurrences/species', {
        params: {
          page: {
            number: page_number,
            size: page_size,
          },
          ids,
          search,
          exact,
          families,
          sort,
          order,
        },
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 422:
            throw new Error('Unprocessable Entity');
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }

  async types(page_number = 1, page_size = 50, ids = [], search = '', exact = 0, species = [], sort = 'created_at', order = 'desc') {
    try {
      const response = await axios.get('/occurrences/types', {
        params: {
          page: {
            number: page_number,
            size: page_size,
          },
          ids,
          search,
          exact,
          species,
          sort,
          order,
        },
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 422:
            throw new Error('Unprocessable Entity');
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }

  async statuses(page_number = 1, page_size = 50, ids = [], search = '', exact = 0, sort = 'created_at', order = 'desc') {
    try {
      const response = await axios.get('/occurrences/statuses', {
        params: {
          page: {
            number: page_number,
            size: page_size,
          },
          ids,
          search,
          exact,
          sort,
          order,
        },
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 422:
            throw new Error('Unprocessable Entity');
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }
}

class Districts {
  async get(page_number = 1, page_size = 50, ids = [], search = '', exact = 0, sort = 'created_at', order = 'desc') {
    try {
      const response = await axios.get('/districts', {
        params: {
          page: {
            number: page_number,
            size: page_size,
          },
          ids,
          search,
          exact,
          sort,
          order,
        },
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 422:
            throw new Error('Unprocessable Entity');
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }

  async view(id) {
    try {
      const response = await axios.get(`/districts/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 404:
            throw new Error('Not Found');
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }
}

class Counties {
  async get(page_number = 1, page_size = 50, ids = [], search = '', exact = 0, districts = [], sort = 'created_at', order = 'desc') {
    try {
      const response = await axios.get('/counties', {
        params: {
          page: {
            number: page_number,
            size: page_size,
          },
          ids,
          search,
          exact,
          districts,
          sort,
          order,
        },
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 422:
            throw new Error('Unprocessable Entity');
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }

  async view(id) {
    try {
      const response = await axios.get(`/counties/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 404:
            throw new Error('Not Found');
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }
}

class Parishes {
  async get(page_number = 1, page_size = 50, ids = [], search = '', exact = 0, counties = [], sort = 'created_at', order = 'desc') {
    try {
      const response = await axios.get('/parishes', {
        params: {
          page: {
            number: page_number,
            size: page_size,
          },
          ids,
          search,
          exact,
          counties,
          sort,
          order,
        },
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 422:
            throw new Error('Unprocessable Entity');
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }

  async view(id) {
    try {
      const response = await axios.get(`/parishes/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 404:
            throw new Error('Not Found');
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }
}

class IPMA {
  static async warnings() {
    try {
      const response = await axios.get('/ipma/warnings');
      return response.data;
    } catch (error) {
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }
}

class Weather {
  async observations(page_number = 1, page_size = 50, ids = [], search = '', exact = 0, districts = [], counties = [], parishes = [], stations = [], timestamp_from = '', timestamp_to = '', sort = 'created_at', order = 'desc') {
    try {
      const response = await axios.get('/weather/observations', {
        params: {
          page: {
            number: page_number,
            size: page_size,
          },
          ids,
          search,
          exact,
          districts,
          counties,
          parishes,
          stations,
          timestamp_from,
          timestamp_to,
          sort,
          order,
        },
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 422:
            throw new Error('Unprocessable Entity');
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }

  async observation(id) {
    try {
      const response = await axios.get(`/weather/observations/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 404:
            throw new Error('Not Found');
          default:
        }
      }
      throw new Error(`VOST API ERROR: ${error}`);
    }
  }
}

class API {
  constructor(auth = null) {
    this.Auth = new Auth(auth);
    this.Users = new Users();
    this.Acronyms = new Acronyms();
    this.Events = new Events();
    this.Occurrences = new Occurrences();
    this.Districts = new Districts();
    this.Counties = new Counties();
    this.Parishes = new Parishes();
    this.IPMA = new IPMA();
    this.Weather = new Weather();
  }
}


function createInstance(auth = null) {
  return new API(auth);
}

const vost = createInstance();
vost.create = function create(auth) {
  return createInstance(auth);
};

module.exports = vost;