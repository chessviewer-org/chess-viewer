const { execSync } = require('child_process');
const fs = require('fs');

// 1. Delete all existing v5.x tags (except v5.0.0 base)
try {
    const existingTags = execSync('git tag -l "v5.*"').toString().split('\n').filter(Boolean);
    const tagsToDelete = existingTags.filter(t => t !== 'v5.0.0');
    if (tagsToDelete.length > 0) {
        execSync(`git tag -d ${tagsToDelete.join(' ')}`, { stdio: 'ignore' });
    }
} catch(e) {}

// 2. Fetch all commits from v5.0.0 to HEAD
const commitsRaw = execSync('git log --reverse --format="%H|%ad|%s" --date=short v5.0.0..HEAD').toString();
const commits = commitsRaw.trim().split('\n').filter(Boolean).map(line => {
    const parts = line.split('|');
    return {
        hash: parts[0],
        date: parts[1],
        msg: parts.slice(2).join('|')
    };
});

function categorize(msg) {
    const lower = msg.toLowerCase();
    if (lower.includes('security') || lower.includes('vulnerabilit') || lower.includes('audit') || lower.includes('policy') || lower.includes('cve')) return 'Security';
    if (lower.startsWith('feat')) return 'Features';
    if (lower.startsWith('fix') || lower.includes('bug')) return 'Bug Fixes';
    if (lower.startsWith('docs')) return 'Documentation';
    return 'Maintenance & Chores';
}

let releases = [];
let currentBatch = [];
let currentMajor = 5;
let currentMinor = 0;
let currentPatch = 0;

for (let i = 0; i < commits.length; i++) {
    const c = commits[i];
    currentBatch.push(c);

    let shouldCut = false;
    const next = commits[i+1];
    
    const isMerge = c.msg.startsWith('Merge pull request') || c.msg.startsWith('Merge branch');
    
    // Hard boundaries for a release:
    // 1. A Merge commit usually signifies the end of a PR / feature / fix bundle.
    if (isMerge) {
        shouldCut = true;
    }
    // 2. If no merges, cut roughly every 15+ commits on a day boundary to prevent massive bloated tags
    else if (next && currentBatch.length >= 15 && c.date !== next.date) {
        shouldCut = true;
    }
    // 3. Always cut at the very end
    else if (!next) {
        shouldCut = true;
    }

    if (shouldCut && currentBatch.length > 0) {
        const hasFeat = currentBatch.some(x => categorize(x.msg) === 'Features');
        const hasSecurity = currentBatch.some(x => categorize(x.msg) === 'Security');
        
        if (hasFeat) {
            currentMinor++;
            currentPatch = 0;
        } else {
            currentPatch++;
        }
        
        const version = `v${currentMajor}.${currentMinor}.${currentPatch}`;
        
        releases.push({
            version,
            date: currentBatch[currentBatch.length - 1].date,
            targetHash: currentBatch[currentBatch.length - 1].hash,
            commits: [...currentBatch]
        });
        
        currentBatch = [];
    }
}

// 4. Generate Professional GitHub-flavored RELEASE_NOTES.md
let mdLines = ['# 📦 Release Notes\n'];

// We reverse so the newest release is at the top of the file
releases.reverse();

for (const rel of releases) {
    mdLines.push(`## [${rel.version}] - ${rel.date}\n`);
    
    const grouped = {
        'Security': [],
        'Features': [],
        'Bug Fixes': [],
        'Documentation': [],
        'Maintenance & Chores': []
    };
    
    for (const c of rel.commits) {
        grouped[categorize(c.msg)].push(c);
    }
    
    const sections = [
        { key: 'Security', icon: '🛡️ Security Updates' },
        { key: 'Features', icon: '🚀 Features' },
        { key: 'Bug Fixes', icon: '🐛 Bug Fixes' },
        { key: 'Documentation', icon: '📚 Documentation' },
        { key: 'Maintenance & Chores', icon: '🧹 Maintenance & Chores' }
    ];

    for (const sec of sections) {
        const group = grouped[sec.key];
        if (group.length > 0) {
            mdLines.push(`### ${sec.icon}`);
            group.forEach(c => {
                // Capitalize first letter of the commit message for professional look
                let cleanMsg = c.msg.charAt(0).toUpperCase() + c.msg.slice(1);
                mdLines.push(`* ${cleanMsg} (\`${c.hash.substring(0,7)}\`)`);
            });
            mdLines.push(''); // blank line
        }
    }
    mdLines.push('---\n');
}

fs.writeFileSync('RELEASE_NOTES.md', mdLines.join('\n'));

// 5. Create Git Tags
console.log(`Planned ${releases.length} optimized releases. Creating tags...`);

releases.reverse(); // tag in chronological order

releases.forEach(r => {
    try {
        execSync(`git tag -a ${r.version} -m "Release ${r.version}" ${r.targetHash}`);
    } catch(e) {
        console.error(`Error tagging ${r.version}:`, e.message);
    }
});

console.log(`\\nSuccess! Created ${releases.length} tags and generated a professional RELEASE_NOTES.md.`);