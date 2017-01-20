/* Api v2 to v3 converter */
var Converter = { // an object that has static methods
	// converts name (e.g. "Masayuki Hayashi") to username (e.g. "masayuki.hayashi")
	convertUsername: function(name) {
		return name.toLowerCase().replace(' ', '.');
	},

	// converts a User (v2 to v3)
	convertUser: function(v2User, password) {
		return {
			"id": v2User.id,
			"email": v2User.email,
			"password": password,
			"username": Converter.convertUsername(v2User.name),
			"name": v2User.name,
			"skype": v2User.skype,
			"linkedin": v2User.linkedin,
			"twitter": v2User.twitter,
			//"website_url": ,
			//"organization": ,
			//"projects_limit": ,
			//"extern_uid": ,
			//"provider": ,
			"bio": v2User.bio,
			//"location": ,
			//"admin": ,
			//"can_create_group": ,
			"confirm": false,
			"external": false
		};
	},

	// converts a User's ssh key (v2 to v3)
	convertUserSSHKey: function(v2Key) {
		return {
			"title": v2Key.title,
			"key": v2Key.key
		};
	},

	// converts a Project (v2 to v3)
	convertProject: function(v2Project, v3User) {
		return {
			"user_id": v3User.id,
			"name": v2Project.code,
			"path": v2Project.path,
			//"namespace_id": ,
			"description": v2Project.description,
			"issues_enabled": v2Project.issues_enabled,
			"merge_requests_enabled": v2Project.merge_requests_enabled,
			//"builds_enabled": ,
			"wiki_enabled": v2Project.wiki_enabled,
			//"snippets_enabled": ,
			//"container_registry_enabled": ,
			//"shared_runners_enabled": ,
			"public": (!v2Project.private),
			"visibility_level": (!v2Project.private) ? 10 : 0,
			//"import_url": ,
			//"public_builds": ,
			//"only_allow_merge_if_build_succeeds": ,
			//"only_allow_merge_if_all_discussions_are_resolved": ,
			//"lfs_enabled": ,
			//"request_access_enabled":
		};
	},

	// converts a Project Member (v2 to v3)
	convertProjectMember: function(v2ProjectMember, v3User) {
		return {
			"user_id": v3User.id,
			"access_level": v2ProjectMember.access_level,
			//"expires_at":
		};
	},

	// converts a Project Snippet (v2 to v3)
	convertProjectSnippet: function(v2ProjectSnippet, v2ProjectSnippetContent) {
		return {
			"title": v2ProjectSnippet.title,
			"file_name": v2ProjectSnippet.file_Name,
			"code": v2ProjectSnippetContent,
			"visibility_level": 20
		};
	},

	// converts a Project Issue (v2 to v3)
	convertProjectIssue: function(v2ProjectIssue, v3AuthorUser, v3AssigneeUser, v3Milestone) {
		return {
			"title": v2ProjectIssue.title,
			"description": v2ProjectIssue.description,
			//"confidential": ,
			"author_id": (v3AuthorUser != null) ? v3AuthorUser.id : null,
			"assignee_id": (v3AssigneeUser != null) ? v3AssigneeUser.id : null,
			"milestone_id": (v3Milestone != null) ? v3Milestone.id : null,
			"labels": (v2ProjectIssue.labels != null) ? v2ProjectIssue.labels.join(',') : null,
			"created_at": v2ProjectIssue.created_at,
			//"due_date": ,
		};
	},

	// converts a Project Milestone (v2 to v3)
	convertProjectMilestone: function(v2ProjectMilestone) {
		return {
			"title": v2ProjectMilestone.title,
			"description": v2ProjectMilestone.description,
			"due_date": v2ProjectMilestone.due_date
		};
	}
};

module.exports = Converter;