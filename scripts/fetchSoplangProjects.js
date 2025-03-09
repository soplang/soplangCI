import fs from 'fs';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const JSON_FILE = 'data/community_projects.json';
const LATEST_PROJECT_FILE = 'data/latest_project.txt';
const GITHUB_API_URL = 'https://api.github.com/search/repositories?q=soplang';
const TOKEN = process.env.SAT;

const fetchSoplangProjects = async () => {
    try {
        const headers = TOKEN ? { Authorization: `token ${TOKEN}` } : {};
        const response = await axios.get(GITHUB_API_URL, { headers });

        let projects = [];
        if (fs.existsSync(JSON_FILE)) {
            projects = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
        }

        const newProjects = response.data.items
            .map(repo => ({
                name: repo.name,
                owner: repo.owner.login,
                url: repo.html_url,
                description: repo.description || "No description",
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                contributors: repo.watchers_count,
                creator: repo.owner.login,
                created_at: repo.created_at,
                last_updated: repo.updated_at,
                language: repo.language,
            }))
            .filter(repo => !projects.some(p => p.url === repo.url));

        if (newProjects.length > 0) {
            const latestProject = newProjects[0].name; // Take the most recent project

            fs.writeFileSync(JSON_FILE, JSON.stringify([...projects, ...newProjects], null, 2));
            fs.writeFileSync(LATEST_PROJECT_FILE, latestProject);
            
            console.log(`✅ Added new project: ${latestProject}`);
        } else {
            console.log("⚡ No new projects found.");
        }
    } catch (error) {
        console.error(`❌ Failed to fetch projects: ${error.message}`);
    }
};

fetchSoplangProjects();
