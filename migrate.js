var Rx = require('rx');
var APIv2 = require('./apiv2');
var APIv3 = require('./apiv3');
var Converter = require('./converter');
var simpleGit = require("simple-git");

// init
var apiv2 = new APIv2("http://git.itolab.nitech.ac.jp/gitlab/api/v2", "**PRIVATE TOKEN**");
var apiv3 = new APIv3("https://gitlab.itolab.nitech.ac.jp/api/v3", "**PRIVATE TOKEN**");
var gitrootv2 = "git@annonay.itolab.nitech.ac.jp:";

// helper
/** find difference between two arrays and return [arr1, arr2, arr1arr2IndexMap, (arr2 - arr1)] */
function diff(arr1, arr2, equals_fn, map_fn) {
	equals_fn = equals_fn || function (o1, o2) { return o1 == o2; };
	map_fn = map_fn || function (o1, o2, idx1, idx2) { return [idx1, idx2]; };

	var tmpArr2 = [].concat(arr2);
	var map = {}, diffItems = [];
	arr1.forEach(function(o1, idx1) {
		var idx2 = tmpArr2.findIndex(function(o2) { return equals_fn(o1, o2); });
		var o2 = (idx2 >= 0) ? tmpArr2.splice(idx2, 1)[0] : null;
		var entry = map_fn(o1, o2, idx1, idx2);
		map[entry[0]] = entry[1];
		if (idx2 == -1) {
			diffItems.push(o1);
		}
	});

	return [arr1, arr2, map, diffItems];
}


/**
 * Migrate users (v2 to v3) and return the mapping of v2User to v3User
 */
function migrateUsers() {
	return Rx.Observable.create(function(observable) {
		var result = {
			'v2Users': [],
			'v3Users': [],
			'v2v3UserIdMap': {},
			'newUsers': []
		}

		console.log("====== migrating users ======");

		Rx.Observable.zip(apiv2.getAllUsers().toArray(), apiv3.getAllUsers().toArray())
			// create mapping from v2User to v3User based on username
			.flatMap(function (val) {
				// val = [[v2User1, v2User2, ...], [v3User1, v3User2, ...]]
				var res = diff(val[0], val[1], function(v2User, v3User) {
					return (v2User.name == v3User.name || v2User.name == v3User.username || Converter.convertUsername(v2User.name) == v3User.username || v2User.email == v3User.email);
				}, function(v2User, v3User, idx1, idx2) {
					return [v2User.id, (v3User != null) ? v3User.id : null];
				});

				result['v2Users'] = res[0];
				result['v3Users'] = res[1];
				result['v2v3UserIdMap'] = res[2];
				result['newUsers'] = res[3];

				return result['newUsers'];
			})
			// add interval
			.zip(Rx.Observable.interval(1000), function(a, b) { return a; })
			// and if any of v2User is lacking, create them
			.flatMap(function(newUser) {
				console.log("creating user " + newUser.name);
				return apiv3.addUser(Converter.convertUser(newUser, "yourpass"))
					.map(function(res) { return res.body; })
					.doOnNext(function(createdUser) {
						result["v3Users"].push(createdUser);
						result["v2v3UserIdMap"][newUser.id] = createdUser.id;
					});
			})
			.doOnNext(function(createdUser) {
				console.log("created user " + createdUser.name + " as " + createdUser.username);
			})
			.toArray()
			.subscribe(
				function(createdUsers) {
					observable.onNext(result);
					observable.onCompleted();
				},
				function(err) {
					observable.onError(err);
				}
			);
	});
}

/**
 * Migrate projects (v2 to v3) and return the mapping of v2Project to v3Project
 */
function migrateProjects(migrateUsersResult) {
	var v2Users = migrateUsersResult["v2Users"];
	var v3Users = migrateUsersResult["v3Users"];
	var v2v3UserIdMap = migrateUsersResult["v2v3UserIdMap"];

	return Rx.Observable.create(function(observable) {
		var result = {
			"v2Projects": [],
			"v3Projects": [],
			"v2v3ProjectIdMap": {},
			"newProjects": []
		};

		console.log("====== migrating projects ======");

		Rx.Observable.zip(apiv2.getAllProjects().toArray(), apiv3.getAllProjects().toArray())
			// create mapping from v2Project to v3Project based on project title
			.flatMap(function(val) {
				var res = diff(val[0], val[1], function(v2Project, v3Project) {
					return (v2Project.name == v3Project.name && v2v3UserIdMap[v2Project.owner.id] == v3Project.owner.id);
				}, function(v2Project, v3Project) {
					return [v2Project.id, (v3Project != null) ? v3Project.id : null];
				});

				result["v2Projects"] = res[0];
				result["v3Projects"] = res[1];
				result["v2v3ProjectIdMap"] = res[2];
				result["newProjects"] = res[3];

				return result["newProjects"];
			})
			// add interval
			.zip(Rx.Observable.interval(30000), function(a, b) { return a; })
			// and if any of v2Project is lacking, create them
			.flatMap(function(newProject) {
				console.log("creating project " + newProject.name);
				var v3User = v3Users.find(function(user) { return (user.id == v2v3UserIdMap[newProject.owner.id]); });

				// create new project
				return apiv3.addProject(Converter.convertProject(newProject, v3User))
					.map(function(res) { return res.body; })
					.doOnNext(function(createdProject) {
						result["v3Projects"].push(createdProject);
						result["v2v3ProjectIdMap"][newProject.id] = createdProject.id;
					})
					.doOnNext(function(createdProject) {
						console.log("created project " + createdProject.name + ", path = " + createdProject.path);
					})
					.delay(2000)
					// migrate project members
					.flatMap(function(createdProject) {
						console.log("[" + createdProject.name +"] migrating members");
						return apiv2.getAllProjectMembers(newProject.id)
							// map each v2User to v3User
							.map(function(v2ProjectMember) { 
								var v3MemberUser = v3Users.find(function(user) { return (user.id == v2v3UserIdMap[v2ProjectMember.id]); });
								return Converter.convertProjectMember(v2ProjectMember, v3MemberUser);
							})
							.zip(Rx.Observable.interval(500), function(a, b) { return a; })
							// add project member to the new project
							.flatMap(function(v3ProjectMember) {
								var v3MemberUser = v3Users.find(function(user) { return (user.id == v3ProjectMember.user_id); });
								console.log("[" + createdProject.name +"] adding user '" + v3MemberUser.name + "' to member");
								return apiv3.addProjectMember(createdProject.id, v3ProjectMember);
							})
							.toArray()
							.map(function(createdMembers) {
								return createdProject;
							});
					})
					.delay(2000)
					// migrate project snippets
					.flatMap(function(createdProject) {
						console.log("[" + createdProject.name +"] migrating snippets");
						return apiv2.getAllProjectSnippets(newProject.id)
							.flatMap(function(v2ProjectSnippet) {
								// retrieve content
								return apiv2.getProjectSnippetContent(newProject.id, v2ProjectSnippet.id)
									// convert to v3 snippet
									.map(function(v2ProjectSnippetContent) {
										return Converter.convertProjectSnippet(v2ProjectSnippet, v2ProjectSnippetContent);
									});
							})
							.zip(Rx.Observable.interval(500), function(a, b) { return a; })
							.flatMap(function(v3ProjectSnippet) {
								console.log("[" + createdProject.name +"] creating snippet '" + v3ProjectSnippet.title + "'");
								return apiv3.addProjectSnippet(createdProject.id, v3ProjectSnippet);
							})
							.toArray()
							.map(function(createdSnippets) {
								return createdProject;
							});
					})
					.delay(2000)
					// migrate project milestones
					.flatMap(function(createdProject) {
						console.log("[" + createdProject.name +"] migrating milestones");
						return apiv2.getAllProjectMilestones(newProject.id)
							.map(function(v2ProjectMilestone) {
								return Converter.convertProjectMilestone(v2ProjectMilestone);
							})
							.zip(Rx.Observable.interval(500), function(a, b) { return a; })
							.flatMap(function(v3ProjectMilestone) {
								console.log("[" + createdProject.name +"] creating milestone '" + v3ProjectMilestone.title + "'");
								return apiv3.addProjectMilestone(createdProject.id, v3ProjectMilestone);
							})
							.toArray()
							.map(function(createdMilestones) {
								return createdProject;
							});
					})
					.delay(2000)
					// migrate project issues
					.flatMap(function(createdProject) {
						console.log("[" + createdProject.name +"] migrating issues");
						return apiv2.getAllProjectIssues(newProject.id)
							.map(function(v2ProjectIssue) {
								var v3AuthorUser = v3Users.find(function(user) { return (user.id == v2v3UserIdMap[v2ProjectIssue.author.id]); });
								var v3AssigneeUser = v3Users.find(function(user) { return (user.id == v2v3UserIdMap[v2ProjectIssue.assignee.id]); });
								var v3Milestone = { id: (v2ProjectIssue.milestone != null) ? v2ProjectIssue.milestone.id : null }; // FIXME: should be obtained properly
								return Converter.convertProjectIssue(v2ProjectIssue, v3AuthorUser, v3AssigneeUser, v3Milestone);
							})
							.zip(Rx.Observable.interval(500), function(a, b) { return a; })
							.flatMap(function(v3ProjectIssue) {
								console.log("[" + createdProject.name +"] creating issue '" + v3ProjectIssue.title + "'");
								return apiv3.addProjectIssue(createdProject.id, v3ProjectIssue)
									.catch(function(error) {
										console.error("[" + createdProject.name +"] ERROR creating issue " + v3ProjectIssue.title + ": " + error);
										return Rx.Observable.just(v3ProjectIssue);
									});
							})
							.toArray()
							.map(function(createdIssues) {
								return createdProject;
							});
					})
					// migrate repository
					.flatMap(function(createdProject) {
						console.log("[" + createdProject.name +"] migrating repository");
						return migrateRepository(newProject, createdProject)
							.catch(function(error) {
								console.error("[" + createdProject.name +"] ERROR migrating repository: " + error);
								return Rx.Observable.just(null);
							})
							.map(function() {
								return createdProject;
							});
					});
			})
			.toArray()
			.subscribe(
				function(createdProjects) {
					observable.onNext(result);
					observable.onCompleted();
				},
				function(err) {
					observable.onError(err);
				}
			);
	});
}

/**
 * Migrate git repository (v2 to v3)
 */
function migrateRepository(v2Project, v3Project) {
	return Rx.Observable.create(function(observable) {
		var repositoryName = v2Project.code;
		var v2Url = gitrootv2 + v2Project.path + ".git";
		var v3Url = v3Project.ssh_url_to_repo;

		simpleGit()
	        .then(function() {
	        	console.log("::: Cloning from " + v2Url);
	        })
			.clone(v2Url, repositoryName, ["--mirror"])
	        .then(function() {
	        	console.log("::: Cloned as '" + repositoryName + "'");
	        })
			.cwd(repositoryName)
	        .then(function() {
	        	console.log("::: Pushing to " + v3Url);
	        })
			.push(v3Url, "--mirror")
			.then(function(err, res) {
				if (err != null) {
					observable.onError(err);
				} else {
					observable.onNext(res);
					observable.onCompleted();	
				}
			});
	});
}

migrateUsers()
	.doOnNext(function(result) {
		console.log(result['v2v3UserIdMap']);
	})
	.flatMap(function(result) {
		return migrateProjects(result);
	})
	.subscribe(
		function (result) {
			console.log(result['v2v3ProjectIdMap']);
		}, 
		function(err) {
			console.error(err);
		}
	);
