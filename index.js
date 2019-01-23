const got    = require("got");
const chalk  = require('chalk');
const os     = require('os');
const fs 	 = require('fs');
const shell  = require('shelljs');

var config = {};
// Retrieve our api token from the environment variables.
config.token = process.env.GHTOKEN;
config.baseurl = 'https://github.ncsu.edu/api/v3';

if( !config.token ) {
	console.log(chalk`{red.bold GHTOKEN is not defined!}`);
	process.exit(1);
}

if (!shell.which('git')) {
	shell.echo('Sorry, this script requires git');
	shell.exit(1);
}

// Configure our headers to use our token when making REST api requests.
const headers =
{
    'Accept': 'application/vnd.github.v3+json',
	'Content-Type':'application/json',
	'Authorization': 'token ' + config.token
};

class GitHubProvider {

	async clone() {
		let response = await got.get(`${config.baseurl}/user/repos?per_page=100`, { headers: headers, json:true })
							 .catch(err => console.error(`getOrganizations ${err}`));
							 
		if( !response || !response.body ) 
			return;

		// Create directory to store github repos
		if (!fs.existsSync("Archive")){
			fs.mkdirSync("Archive");
		}
		shell.cd("Archive");


		for( let repo of response.body) {
			var dir = `./${repo.full_name.split('/'[0])}`;

			if (!fs.existsSync(dir)){
				fs.mkdirSync(dir);
			}
			shell.cd(dir);

			if (shell.exec(`git clone https://${config.token}@${repo.clone_url.replace("https://", "")}`).code !== 0) {
				shell.echo(`Error: Git clone failed on repo ${repo.full_name}`);
				shell.exit(1);
			}

			shell.cd("../");

			console.log(`Cloned ${repo.full_name}`);
		}
    }
}

async function run() {
	let client = new GitHubProvider();

	// Current limitation: Only clones first 100 repos
	await client.clone();
}


// Run workshop code...
(async () => {
	await run();
})();
