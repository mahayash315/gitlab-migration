var request = require('./api');

/** GitLab Api v2 **/
var APIv2 = function(baseUrl, privateToken) {
	// constructor
	this.baseUrl = baseUrl;
	this.privateToken = privateToken;
};


/* --- User -- */
APIv2.prototype.getUsers = function(page, perPage) {
	page = page || 1;
	perPage = perPage || 20;

	return request.get(this.baseUrl + '/users')
				  .query({
				  	'private_token': this.privateToken,
				  	'page': page,
				  	'per_page': perPage
				  })
				  .set('Accept', 'application/json')
				  .asObservable();
};

APIv2.prototype.getAllUsers = function() {
	var self = this, page = 0, retrieve = function(allItems) {
		return self.getUsers(++page)
			.map(function(res) { return res.body; })
			.flatMap(function(items) { return (items.length > 0) ? retrieve(allItems.concat(items)) : allItems.concat(items); });
	};
	return retrieve([]);
};

APIv2.prototype.getUser = function(userId) {
	return request.get(this.baseUrl + '/users/' + userId)
				  .query({
				  	'private_token': this.privateToken
				  })
				  .set('Accept', 'application/json')
				  .asObservable();
};

APIv2.prototype.addUser = function(user) {
	return request.post(this.baseUrl + '/users')
				  .query({
				  	'private_token': this.privateToken
				  })
				  .send(user)
				  .set('Accept', 'application/json')
				  .asObservable();
};


/* --- User SSH Key -- */
APIv2.prototype.getUserSSHKeys = function(userId, page, perPage) {
	page = page || 1;
	perPage = perPage || 20;

	return request.get(this.baseUrl + '/users/' + userId + '/keys')
				  .query({
				  	'private_token': this.privateToken,
				  	'page': page,
				  	'per_page': perPage
				  })
				  .set('Accept', 'application/json')
				  .asObservable();
};

APIv2.prototype.getAllUserSSHKeys = function(userId) {
	var self = this, page = 0, retrieve = function(allItems) {
		return self.getUserSSHKeys(userId, ++page)
			.map(function(res) { return res.body; })
			.flatMap(function(items) { return (items.length > 0) ? retrieve(allItems.concat(items)) : allItems.concat(items); });
	};
	return retrieve([]);
};

APIv2.prototype.getUserSSHKey = function(userId, keyId) {
	return request.get(this.baseUrl + '/users/' + userId + '/keys/' + keyId)
				  .query({
				  	'private_token': this.privateToken
				  })
				  .set('Accept', 'application/json')
				  .asObservable();
};

APIv2.prototype.addUserSSHKey = function(user, key) {
	return request.post(this.baseUrl + '/users' + userId + '/keys')
				  .query({
				  	'private_token': this.privateToken
				  })
				  .send(key)
				  .set('Accept', 'application/json')
				  .asObservable();
};


/* --- Project -- */
APIv2.prototype.getProjects = function(page, perPage) {
	page = page || 1;
	perPage = perPage || 20;

	return request.get(this.baseUrl + '/projects')
				  .query({
				  	'private_token': this.privateToken,
				  	'page': page,
				  	'per_page': perPage
				  })
				  .set('Accept', 'application/json')
				  .asObservable();
};

APIv2.prototype.getAllProjects = function() {
	var self = this, page = 0, retrieve = function(allItems) {
		return self.getProjects(++page)
			.map(function(res) { return res.body; })
			.flatMap(function(items) { return (items.length > 0) ? retrieve(allItems.concat(items)) : allItems.concat(items); });
	};
	return retrieve([]);
};

APIv2.prototype.getProject = function(projectId) {
	return request.get(this.baseUrl + '/projects/' + projectId)
				  .query({
				  	'private_token': this.privateToken
				  })
				  .set('Accept', 'application/json')
				  .asObservable();
};

APIv2.prototype.addProject = function(project) {
	return request.post(this.baseUrl + '/projects')
				  .query({
				  	'private_token': this.privateToken
				  })
				  .send(project)
				  .set('Accept', 'application/json')
				  .asObservable();
};


/* --- Project Member -- */
APIv2.prototype.getProjectMembers = function(projectId, page, perPage) {
	page = page || 1;
	perPage = perPage || 20;

	return request.get(this.baseUrl + '/projects/' + projectId + '/members')
				  .query({
				  	'private_token': this.privateToken,
				  	'page': page,
				  	'per_page': perPage
				  })
				  .set('Accept', 'application/json')
				  .asObservable();
};

APIv2.prototype.getAllProjectMembers = function(projectId) {
	var self = this, page = 0, retrieve = function(allItems) {
		return self.getProjectMembers(projectId, ++page)
			.map(function(res) { return res.body; })
			.flatMap(function(items) { return (items.length > 0) ? retrieve(allItems.concat(items)) : allItems.concat(items); });
	};
	return retrieve([]);
};

APIv2.prototype.getProjectMember = function(projectId, userId) {
	return request.get(this.baseUrl + '/projects/' + projectId + '/members/' + userId)
				  .query({
				  	'private_token': this.privateToken
				  })
				  .set('Accept', 'application/json')
				  .asObservable();
};

APIv2.prototype.addProjectMember = function(projectId, member) {
	return request.post(this.baseUrl + '/projects/' + projectId + '/members')
				  .query({
				  	'private_token': this.privateToken
				  })
				  .send(member)
				  .set('Accept', 'application/json')
				  .asObservable();
};


/* --- Project Snippet -- */
APIv2.prototype.getProjectSnippets = function(projectId, page, perPage) {
	page = page || 1;
	perPage = perPage || 20;

	return request.get(this.baseUrl + '/projects/' + projectId + '/snippets')
				  .query({
				  	'private_token': this.privateToken,
				  	'page': page,
				  	'per_page': perPage
				  })
				  .set('Accept', 'application/json')
				  .asObservable();
};

APIv2.prototype.getAllProjectSnippets = function(projectId) {
	var self = this, page = 0, retrieve = function(allItems) {
		return self.getProjectSnippets(projectId, ++page)
			.map(function(res) { return res.body; })
			.flatMap(function(items) { return (items.length > 0) ? retrieve(allItems.concat(items)) : allItems.concat(items); });
	};
	return retrieve([]);
};

APIv2.prototype.getProjectSnippet = function(projectId, snippetId) {
	return request.get(this.baseUrl + '/projects/' + projectId + '/snippets/' + snippetId)
				  .query({
				  	'private_token': this.privateToken
				  })
				  .set('Accept', 'application/json')
				  .asObservable();
};

APIv2.prototype.getProjectSnippetContent = function(projectId, snippetId) {
	return request.get(this.baseUrl + '/projects/' + projectId + '/snippets/' + snippetId + "/raw")
				  .query({
				  	'private_token': this.privateToken
				  })
				  .set('Accept', 'text/plain')
				  .asObservable();
};

APIv2.prototype.addProjectSnippet = function(projectId, snippet) {
	return request.post(this.baseUrl + '/projects/' + projectId + '/snippets')
				  .query({
				  	'private_token': this.privateToken
				  })
				  .send(snippet)
				  .set('Accept', 'application/json')
				  .asObservable();
};


/* --- Project Issues -- */
APIv2.prototype.getProjectIssues = function(projectId, page, perPage) {
	page = page || 1;
	perPage = perPage || 20;

	return request.get(this.baseUrl + '/projects/' + projectId + '/issues')
				  .query({
				  	'private_token': this.privateToken,
				  	'page': page,
				  	'per_page': perPage
				  })
				  .set('Accept', 'application/json')
				  .asObservable();
};

APIv2.prototype.getAllProjectIssues = function(projectId) {
	var self = this, page = 0, retrieve = function(allItems) {
		return self.getProjectIssues(projectId, ++page)
			.map(function(res) { return res.body; })
			.flatMap(function(items) { return (items.length > 0) ? retrieve(allItems.concat(items)) : allItems.concat(items); });
	};
	return retrieve([]);
};

APIv2.prototype.getProjectIssue = function(projectId, issueId) {
	return request.get(this.baseUrl + '/projects/' + projectId + '/issues/' + issueId)
				  .query({
				  	'private_token': this.privateToken
				  })
				  .set('Accept', 'application/json')
				  .asObservable();
};

APIv2.prototype.addProjectIssue = function(projectId, issue) {
	return request.post(this.baseUrl + '/projects/' + projectId + '/issues')
				  .query({
				  	'private_token': this.privateToken
				  })
				  .send(issue)
				  .set('Accept', 'application/json')
				  .asObservable();
};


/* --- Project Milestones -- */
APIv2.prototype.getProjectMilestones = function(projectId, page, perPage) {
	page = page || 1;
	perPage = perPage || 20;

	return request.get(this.baseUrl + '/projects/' + projectId + '/milestones')
				  .query({
				  	'private_token': this.privateToken,
				  	'page': page,
				  	'per_page': perPage
				  })
				  .set('Accept', 'application/json')
				  .asObservable();
};

APIv2.prototype.getAllProjectMilestones = function(projectId) {
	var self = this, page = 0, retrieve = function(allItems) {
		return self.getProjectMilestones(projectId, ++page)
			.map(function(res) { return res.body; })
			.flatMap(function(items) { return (items.length > 0) ? retrieve(allItems.concat(items)) : allItems.concat(items); });
	};
	return retrieve([]);
};

APIv2.prototype.getProjectMilestone = function(projectId, milestoneId) {
	return request.get(this.baseUrl + '/projects/' + projectId + '/milestones/' + milestoneId)
				  .query({
				  	'private_token': this.privateToken
				  })
				  .set('Accept', 'application/json')
				  .asObservable();
};

APIv2.prototype.addProjectMilestone = function(projectId, milestone) {
	return request.post(this.baseUrl + '/projects/' + projectId + '/milestones')
				  .query({
				  	'private_token': this.privateToken
				  })
				  .send(milestone)
				  .set('Accept', 'application/json')
				  .asObservable();
};

module.exports = APIv2;