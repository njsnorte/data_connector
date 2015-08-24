var GitHubMeta = {};

/**
 * GitHub Comment (https://developer.github.com/v3/issues/comments/)
 */
GitHubMeta.getComment = function() {
  return {
    "id": "int",
    "url": "string",
    "html_url": "string",
    "body": "string",
    "user": this.getUser(),
    "created_at": "datetime",
    "updated_at": "datetime" 
  }
};

/**
 * GitHub Issue (https://developer.github.com/v3/issues/)
 */
GitHubMeta.getIssue = function() {
  return {
    "id": "int",
    "number": "int",
    "url": "string",
    "labels_url": "string",
    "comments_url": "string",
    "events_url": "string",
    "html_url": "string",
    "state": "string",
    "locked": "bool",
    "title": "string",
    "body": "string",
    "user": this.getUser(),
    "labels": "string", /*We only care about the name (unique identifier) of the labels.*/
    "assignee": this.getUser(),
    "milestone": this.getMilestone(),
    "comments": "int",
    "pull_request": this.getPullRequest(),
    "closed_at": "datetime",
    "created_at": "datetime",
    "updated_at": "datetime" 
  }  
};

/**
 * GitHub Label (https://developer.github.com/v3/issues/labels/)
 */
GitHubMeta.getLabel = function() {
  return {
    "url": "string",
    "name": "string",
    "color": "string" 
  }
};

/**
 * GitHub Milestone (https://developer.github.com/v3/issues/milestones/)
 */
GitHubMeta.getMilestone = function() {
  return {
    "url": "string",
    "html_url": "string",
    "labels_url": "string",
    "id": "int",
    "number": "int",
    "state": "string",
    "title": "string",
    "description": "string",
    "creator": this.getUser(),
    "open_issues": "int",
    "closed_issues": "int",
    "created_at": "datetime",
    "updated_at": "datetime",
    "closed_at": "datetime",
    "due_on": "datetime" 
  }
};

/**
 * GitHub Pull Request (https://developer.github.com/v3/pulls/)
 */
GitHubMeta.getPullRequest = function() {
  return {
    "id": "int",
    "url": "string",
    "html_url": "string",
    "diff_url": "string",
    "patch_url": "string",
    "issue_url": "string",
    "commits_url": "string",
    "review_comments_url": "string",
    "review_comment_url": "string",
    "comments_url": "string",
    "statuses_url": "string",
    "number": "int",
    "state": "string",
    "title": "string",
    "body": "string",
    "created_at": "datetime",
    "updated_at": "datetime",
    "closed_at": "datetime",
    "merged_at": "datetime",
    "head": {
      "label": "string",
      "ref": "string",
      "sha": "string",
      "user": this.getUser(),
      "repo": this.getRepository()
    },
    "base": {
      "label": "string",
      "ref": "string",
      "sha": "string",
      "user": this.getUser(),
      "repo": this.getRepository()
    },
    "_links": {
      "self": {
        "href": "string"
      },
      "html": {
        "href": "string"
      },
      "issue": {
        "href": "string"
      },
      "comments": {
        "href": "string"
      },
      "review_comments": {
        "href": "string"
      },
      "review_comment": {
        "href": "string"
      },
      "commits": {
        "href": "string"
      },
      "statuses": {
        "href": "string"
      }
    },
    "user": this.getUser() 
  }
};

/**
 * GitHub Repository (https://developer.github.com/v3/repos/)
 */
GitHubMeta.getRepository = function() {
  return {
    "id": "int",
    "owner": this.getUser(),
    "name": "string",
    "full_name": "string",
    "description": "string",
    "private": "bool",
    "fork": "bool",
    "url": "string",
    "html_url": "string",
    "archive_url": "string",
    "assignees_url": "string",
    "blobs_url": "string",
    "branches_url": "string",
    "clone_url": "string",
    "collaborators_url": "string",
    "comments_url": "string",
    "commits_url": "string",
    "compare_url": "string",
    "contents_url": "string",
    "contributors_url": "string",
    "downloads_url": "string",
    "events_url": "string",
    "forks_url": "string",
    "git_commits_url": "string",
    "git_refs_url": "string",
    "git_tags_url": "string",
    "git_url": "string",
    "hooks_url": "string",
    "issue_comment_url": "string",
    "issue_events_url": "string",
    "issues_url": "string",
    "keys_url": "string",
    "labels_url": "string",
    "languages_url": "string",
    "merges_url": "string",
    "milestones_url": "string",
    "mirror_url": "string",
    "notifications_url": "string",
    "pulls_url": "string",
    "releases_url": "string",
    "ssh_url": "string",
    "stargazers_url": "string",
    "statuses_url": "string",
    "subscribers_url": "string",
    "subscription_url": "string",
    "svn_url": "string",
    "tags_url": "string",
    "teams_url": "string",
    "trees_url": "string",
    "homepage": "string",
    "language": "string",
    "forks_count": "int",
    "stargazers_count": "int",
    "watchers_count": "int",
    "size": "int",
    "default_branch": "string",
    "open_issues_count": "int",
    "has_issues": "bool",
    "has_wiki": "bool",
    "has_pages": "bool",
    "has_downloads": "bool",
    "pushed_at": "datetime",
    "created_at": "datetime",
    "updated_at": "datetime",
    "permissions": {
      "admin": "bool",
      "push": "bool",
      "pull": "bool"
    } 
  }
};

/**
 * GitHub User (https://developer.github.com/v3/users/)
 */
GitHubMeta.getUser = function() {
  return {
    "login": "string",
    "id": "int",
    "avatar_url": "string",
    "gravatar_id": "string",
    "url": "string",
    "html_url": "string",
    "followers_url": "string",
    "following_url": "string",
    "gists_url": "string",
    "starred_url": "string",
    "subscriptions_url": "string",
    "organizations_url": "string",
    "repos_url": "string",
    "events_url": "string",
    "received_events_url": "string",
    "type": "string",
    "site_admin": "bool" 
  }
};
