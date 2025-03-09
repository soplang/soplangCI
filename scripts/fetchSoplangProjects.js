const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

const JSON_FILE = 'data/community_projects.json';
const LATEST_PROJECT_FILE = 'data/latest_project.txt';
const GITHUB_API_URL = 'https://api.github.com/search/repositories?q=soplang in:name,description,readme';
const TOKEN = process.env.SAT; // Must have correct scopes

const fetchSoplangProjects = async () => {
    try {
        const headers = TOKEN ? { Authorization: `token ${TOKEN}` } : {};
        console.log("🔑 Using token:", TOKEN ? "Provided (masked)" : "None");

        const response = await axios.get(GITHUB_API_URL, { headers });

        // Check if the response is valid
        if (!response.data || !response.data.items) {
            throw new Error("GitHub API returned an empty or invalid response.");
        }

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
            const latestProject = newProjects[0].name;
            fs.writeFileSync(JSON_FILE, JSON.stringify([...projects, ...newProjects], null, 2));
            fs.writeFileSync(LATEST_PROJECT_FILE, latestProject);
            console.log(`✅ Added new project: ${latestProject}`);
        } else {
            console.log("⚡ No new projects found.");
        }
    } catch (error) {
        console.error(`❌ Failed to fetch projects: ${error.message}`);
        
        // Additional debug info:
        if (error.response) {
            console.error("🌐 Status:", error.response.status);
            console.error("🌐 Status Text:", error.response.statusText);
            console.error("🌐 Response Data:", error.response.data);
        } else {
            console.error("❓ No response from GitHub, possibly network error.");
        }
    }
};

fetchSoplangProjects();
