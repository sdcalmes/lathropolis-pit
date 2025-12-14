# Sleeper Custom Losers Bracket

A retro sports scoreboard-themed web application for managing custom losers brackets in Sleeper fantasy football leagues, featuring live scoring, manual matchup creation, and win/loss tracking.

## Features

- **Live Scoring**: Fetches real-time scores from Sleeper API during playoff weeks
- **Sleeper API Integration**: Automatically fetches your league data, teams, and rosters
- **Manual Bracket Creation**: Create custom matchups for your 6-team losers bracket
- **Win/Loss Tracking**: Track playoff wins and losses for each team (not tracked by Sleeper)
- **Shareable Links**: Generate unique URLs to share your bracket with leaguemates
- **Auto-Save**: Automatically saves your bracket to browser localStorage
- **Retro Design**: Bold scoreboard-inspired aesthetic with animated elements
- **Responsive Design**: Works on desktop and mobile devices

## How to Use

### 1. Open the Application

Simply open `index.html` in your web browser. You can:
- Double-click the file to open it in your default browser
- Or, for local development, run a simple HTTP server:
  ```bash
  # Using Python 3
  python3 -m http.server 8000

  # Using Python 2
  python -m SimpleHTTPServer 8000

  # Using Node.js (with http-server installed)
  npx http-server
  ```
  Then navigate to `http://localhost:8000`

### 2. Load Your League

1. Enter your Sleeper League ID in the input field
2. Click "Load League"
3. The app will fetch your league data from the Sleeper API

**Finding Your League ID:**
- Go to your league on Sleeper's website
- Look at the URL: `https://sleeper.com/leagues/LEAGUE_ID/...`
- Copy the numeric ID

### 3. Select Teams

1. Click on 6 teams to include in your losers bracket
2. Selected teams will be highlighted
3. Once 6 teams are selected, the "Create Bracket" button will appear

### 4. Build Your Bracket

1. Click "Build Bracket" to open the bracket builder
2. Select the playoff week for your matchups (defaults to current week)
3. For each round, click "+ ADD MATCHUP" to create a new matchup
4. Select the two teams for each matchup from the dropdowns
5. You can create multiple rounds:
   - **Round 1 (Quarterfinals)**: Initial matchups
   - **Round 2 (Semifinals)**: Winners from Round 1
   - **Round 3 (Finals)**: Championship game
6. Click "Save & View Bracket" when finished - scores will automatically load

### 5. View Live Scores

1. Live scores automatically display for each matchup when available
2. Scores for the current week will pulse/animate to show they're live
3. Click the refresh button (↻) to manually update scores
4. Scores are displayed prominently next to each team name in large golden numbers

### 6. Track Wins/Losses

1. In the bracket view, click the "WIN" button next to the team that won each matchup
2. The winning team will be highlighted with a green indicator
3. Team records automatically update and are displayed in the standings section below
4. Use this to track which teams finished where in your losers bracket

### 7. Share Your Bracket

1. Click the "SHARE" button
2. Copy the generated URL from the modal
3. Share it with your leaguemates via text, email, or your league chat
4. Anyone with the link can view and update the bracket

## Features Explained

### Live Scoring
The app fetches live scores from Sleeper during playoff weeks:
- Automatically loads scores when viewing the bracket
- Click the refresh button to get the latest scores
- Scores for the current week pulse to indicate live updates
- Works for any playoff week you configure in your bracket

### Automatic Data Fetching
The app uses the Sleeper API to fetch:
- Current NFL week and playoff schedule
- League information (name, season, playoff settings)
- All rosters and teams
- Team owners and metadata
- Regular season records
- Live matchup scores for playoff weeks

### Manual Matchup Creation
Unlike Sleeper's built-in brackets, you have complete control:
- Create any matchup combination
- Add as many or as few rounds as needed
- Edit matchups at any time

### Win/Loss Tracking
Track playoff performance separately from regular season:
- Each team starts with 0-0 record in the bracket
- Click "Win" buttons to record game results
- Records update automatically
- View sorted standings by wins/losses

### Shareable Links
The entire bracket state is encoded in the URL:
- All matchups and results are preserved
- Anyone with the link can view the exact bracket state
- Changes made by anyone are reflected for all viewers
- No backend or database required

### Data Persistence
Your bracket is saved in two ways:
1. **Browser localStorage**: Automatically saves your work
2. **URL sharing**: Encode the entire state in a shareable link

## Technical Details

### Technology Stack
- Pure HTML, CSS, and JavaScript (no frameworks)
- Sleeper API for league data and live scoring
- Google Fonts (Teko and JetBrains Mono)
- CSS animations and grain texture effects
- Base64 encoding for shareable URLs
- LocalStorage for auto-save

### Design
- **Retro sports scoreboard aesthetic** with dark theme
- Electric yellow (#FFD700) and cyan (#00F0FF) accent colors
- Animated grain texture overlay
- Bold typography using Teko (display) and JetBrains Mono (scores/data)
- Glowing effects on interactive elements
- Pulsing animations for live scores

### Browser Compatibility
Works in all modern browsers:
- Chrome
- Firefox
- Safari
- Edge

### API Rate Limits
The Sleeper API has a rate limit of ~1000 calls per minute. This app makes:
- 4 API calls when loading a league (league data, rosters, users, NFL state)
- 1 API call per playoff week when fetching scores
- Additional calls only when manually refreshing scores
- All calls are cached in localStorage to minimize API usage

## Troubleshooting

### League won't load
- Double-check the League ID is correct
- Make sure you have an internet connection
- Check browser console for errors (F12 → Console tab)

### Teams not showing up
- Ensure the league has active rosters
- Try refreshing the page and re-entering the League ID

### Share link doesn't work
- Make sure you copied the entire URL
- Try opening in a private/incognito window
- Check that the link includes the `?data=` parameter

### Bracket data lost
- Check if localStorage is enabled in your browser
- Try using the share link feature to preserve state
- Some browsers clear localStorage when closing

## Example Workflow

1. Enter league ID: `1233854577510465536`
2. Load league (automatically fetches teams and current week)
3. Select bottom 6 teams (or any 6 teams you want)
4. Click "Build Bracket"
5. Select playoff week for matchups
6. Add 2 matchups for Round 1
7. Add 1 matchup for Round 2 (semifinals)
8. Add 1 matchup for Round 3 (finals)
9. Save & view bracket (scores automatically load)
10. Watch live scores update during games
11. Click refresh button to get latest scores
12. Mark winners as games complete using WIN buttons
13. Share link with league

## Screenshots

The app features a bold retro scoreboard design with:
- Dark background with subtle grain texture
- Electric yellow highlights and glowing effects
- Large, readable scores in monospace font
- Animated elements and smooth transitions
- Clean, organized bracket layout

## Support

If you encounter any issues or have questions:
1. Check the browser console for error messages
2. Verify your Sleeper League ID is correct
3. Make sure you're using a modern, updated browser

## Credits

Built using the [Sleeper API](https://docs.sleeper.com/)
