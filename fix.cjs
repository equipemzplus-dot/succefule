const fs = require('fs');
let text = fs.readFileSync('components/features/leaderboard/LeaderboardTab.tsx', 'utf8');
let lines = text.split(/\r?\n/);

lines.splice(231, 0, '           </>');

fs.writeFileSync('components/features/leaderboard/LeaderboardTab.tsx', lines.join('\n'));
console.log("Done");
