import GithubObject from './GithubObject';
import Issues from './Issues';
import Pulls from './Pulls';
import Traffic from './Traffic';

/**
 * Make simple API calls to the Github API.
 */
class Github {
  /**
   * Static Constants.
   */
  static get ISSUE() {
    return 'issues';
  }
  static get PULL_REQUEST() {
    return 'pulls';
  }
  static get TRAFFIC() {
    return 'traffic';
  }

  /**
   * Initialize our Github API.
   *
   * @param {GithubObject.auth} [auth]
   *  The credentials used to authenticate with Github. If not provided
   *  requests will be made unauthenticated.
   * @param {string} [base]
   *  The base of the API url.
   */
  constructor(auth = {}, base = 'https://api.github.com/') {
    this._base = base;
    this._auth = auth;
  }

  /**
   * Make a request to Github to fetch the ratelimit(s).
   *
   * @return {Promise)
   *  The Promise for the rate limit request.
   */
  getRateLimit() {
    const api = new GithubObject(this._auth, this._base),
      url = this._base + 'rate_limit';
    return api.request(url);
  }

  /**
   * Get a wrapper around Github Issues.
   *
   * @return {Issues}
   */
  getIssues() {
    return new Issues(this._auth, this._base);
  }

  /**
   * Get a wrapper around Github Issues.
   *
   * @return {Pulls}
   */
  getPulls() {
    return new Pulls(this._auth, this._base);
  }

  /**
   * Get a wrapper around Github Traffic Stats.
   *
   * @return {Traffic}
   */
  getTraffic() {
    return new Traffic(this._auth, this._base);
  }

}

export default Github;

// Private helper functions.
