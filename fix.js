const fs = require('fs');
let code = fs.readFileSync('components/features/leaderboard/LeaderboardTab.tsx', 'utf8');
code = code.replace('            )}\n         )}', '            )}\n           </>\n         )}');
fs.writeFileSync('components/features/leaderboard/LeaderboardTab.tsx', code);
console.log("Done");
