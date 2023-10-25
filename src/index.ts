import process from 'process';
import { Octokit } from '@octokit/core';
import axios from 'axios';
import axiosRetry from 'axios-retry';

axiosRetry(axios, {
	retries: 5,
	retryDelay: (retryCount) => {
		return retryCount * 1000;
	},
});

(async () => {
	console.log(`Start time: ${new Date().toISOString()}`);

	const partlist = ['banner-slider', 'topics-acgn', 'topics-weekly-bangumi', 'topics-vtubers', 'topics-music', 'topics-memes', 'topics-others'];

	async function getData(part: string): Promise<string> {
		const url = `https://storage.moegirl.org.cn/homeland/data/${part}.json`;
		const { data } = await axios.get(url);
		return data;
	}

	const octokit = new Octokit({
		auth: process.env.GITHUB_TOKEN,
	});
	const owner = 'moepad';
	const repo = 'zh-mainpage';
	const files: { path: string; content: string; }[] = [];

	try {
		const { data: { object: { sha } } } = await octokit.request('GET /repos/{owner}/{repo}/git/ref/heads/main', {
			owner,
			repo,
		});
		
		await Promise.all(partlist.map(async (part) => {
			const newData: string = JSON.stringify(await getData(part), null, '  ');
			files.push({ path: `data/${part}.json`, content: newData });
		}));

		const { data: tree } = await octokit.request('POST /repos/{owner}/{repo}/git/trees', {
			owner,
			repo,
			base_tree: sha,
			tree: files.map((file) => ({
				path: file.path,
				mode: '100644' as const,
				content: file.content,
			})),
		});

		const { data: commit } = await octokit.request('POST /repos/{owner}/{repo}/git/commits', {
			owner,
			repo,
			message: 'auto: test',
			tree: tree.sha,
			parents: [sha],
		});
	
		await octokit.request('PATCH /repos/{owner}/{repo}/git/refs/heads/main', {
			owner,
			repo,
			sha: commit.sha,
		});
	
		console.log('Successfully!');
	} catch (error) {
		console.error('Error:', error);
	}

	console.log(`End time: ${new Date().toISOString()}`);
})();