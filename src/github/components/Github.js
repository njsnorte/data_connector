import GithubObject from './GithubObject';
import Issues from './Issues';
import Pulls from './Pulls';
import Traffic from './Traffic';

"use strict";

const ISSUE = 'issues';
const PULL_REQUEST = 'pulls';
const TRAFFIC = 'traffic';

/**
 * Factory.
 */
const Github = {

  create(type, auth = {}, base = 'https://api.github.com/') {
    switch (type) {
      case ISSUE:
        return new Issues(auth, base);
        break;
      case PULL_REQUEST:
        return new Pulls(auth, base);
        break;
      case TRAFFIC:
        return new Traffic(auth, base);
        break;
      default:
        return new GithubObject(auth, base);
        break;
    }
  }
};

export default Github;

// Private helper functions.
