// Application State
const state = {
    leagueId: null,
    leagueData: null,
    rosters: [],
    users: [],
    teams: [],
    selectedTeams: [],
    currentWeek: null,
    playoffWeek: null,
    matchupScores: {}, // { week: { rosterId: points } }
    bracket: {
        round1: [],
        round2: [],
        round3: []
    },
    roundWeeks: { // Maps rounds to weeks
        round1: null,
        round2: null,
        round3: null
    },
    teamRecords: {} // { teamId: { wins: 0, losses: 0 } }
};

// DOM Elements
const elements = {
    leagueIdInput: document.getElementById('league-id'),
    loadLeagueBtn: document.getElementById('load-league-btn'),
    leagueInfo: document.getElementById('league-info'),
    leagueName: document.getElementById('league-name'),
    leagueSeason: document.getElementById('league-season'),
    currentWeekDisplay: document.getElementById('current-week'),
    leagueBadge: document.getElementById('league-badge'),

    setupSection: document.getElementById('setup-section'),
    teamSelectionSection: document.getElementById('team-selection-section'),
    teamList: document.getElementById('team-list'),
    createBracketBtn: document.getElementById('create-bracket-btn'),
    selectedCount: document.getElementById('selected-count'),

    bracketBuilderSection: document.getElementById('bracket-builder-section'),
    playoffWeekSelect: document.getElementById('playoff-week-select'),
    round1Matchups: document.getElementById('round-1-matchups'),
    round2Matchups: document.getElementById('round-2-matchups'),
    round3Matchups: document.getElementById('round-3-matchups'),
    addRound1Matchup: document.getElementById('add-round-1-matchup'),
    addRound2Matchup: document.getElementById('add-round-2-matchup'),
    addRound3Matchup: document.getElementById('add-round-3-matchup'),
    saveBracketBtn: document.getElementById('save-bracket-btn'),

    bracketViewSection: document.getElementById('bracket-view-section'),
    bracketDisplay: document.getElementById('bracket-display'),
    teamRecordsDisplay: document.getElementById('team-records'),
    editBracketBtn: document.getElementById('edit-bracket-btn'),
    shareBracketBtn: document.getElementById('share-bracket-btn'),
    refreshScoresBtn: document.getElementById('refresh-scores-btn'),

    shareModal: document.getElementById('share-modal'),
    shareLink: document.getElementById('share-link'),
    copyLinkBtn: document.getElementById('copy-link-btn'),
    copyBtnText: document.getElementById('copy-btn-text'),
    closeModalBtn: document.getElementById('close-modal-btn'),

    loading: document.getElementById('loading')
};

// Sleeper API Functions
async function fetchNFLState() {
    const response = await fetch('https://api.sleeper.app/v1/state/nfl');
    if (!response.ok) throw new Error('Failed to fetch NFL state');
    return await response.json();
}

async function fetchLeagueData(leagueId) {
    const response = await fetch(`https://api.sleeper.app/v1/league/${leagueId}`);
    if (!response.ok) throw new Error('Failed to fetch league data');
    return await response.json();
}

async function fetchRosters(leagueId) {
    const response = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`);
    if (!response.ok) throw new Error('Failed to fetch rosters');
    return await response.json();
}

async function fetchUsers(leagueId) {
    const response = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/users`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return await response.json();
}

async function fetchMatchups(leagueId, week) {
    const response = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`);
    if (!response.ok) throw new Error('Failed to fetch matchups');
    return await response.json();
}

// Initialize teams from league data
function initializeTeams() {
    state.teams = state.rosters.map(roster => {
        const user = state.users.find(u => u.user_id === roster.owner_id);
        return {
            id: roster.roster_id,
            name: user?.metadata?.team_name || user?.display_name || `Team ${roster.roster_id}`,
            ownerId: roster.owner_id,
            ownerName: user?.display_name || 'Unknown',
            wins: roster.settings.wins || 0,
            losses: roster.settings.losses || 0,
            pointsFor: roster.settings.fpts || 0
        };
    });
}

// Load league data
async function loadLeague() {
    const leagueId = elements.leagueIdInput.value.trim();

    if (!leagueId) {
        alert('Please enter a league ID');
        return;
    }

    showLoading(true);

    try {
        state.leagueId = leagueId;

        // Fetch all data in parallel
        const [leagueData, rosters, users, nflState] = await Promise.all([
            fetchLeagueData(leagueId),
            fetchRosters(leagueId),
            fetchUsers(leagueId),
            fetchNFLState()
        ]);

        state.leagueData = leagueData;
        state.rosters = rosters;
        state.users = users;
        state.currentWeek = nflState.week;

        initializeTeams();

        // Display league info
        elements.leagueName.textContent = state.leagueData.name;
        elements.leagueSeason.textContent = state.leagueData.season;
        elements.currentWeekDisplay.textContent = state.currentWeek;
        elements.leagueBadge.textContent = `${state.leagueData.sport.toUpperCase()} // ${state.leagueData.season}`;
        elements.leagueInfo.classList.remove('hidden');

        // Populate playoff week selector
        populateWeekSelector();

        // Show team selection
        displayTeamSelection();
        elements.teamSelectionSection.classList.remove('hidden');

        // Save to localStorage
        saveToLocalStorage();

    } catch (error) {
        console.error('Error loading league:', error);
        alert('Failed to load league. Please check the league ID and try again.');
    } finally {
        showLoading(false);
    }
}

// Populate week selector with playoff weeks
function populateWeekSelector() {
    const playoffStart = state.leagueData.settings.playoff_week_start || 15;
    const currentWeek = state.currentWeek;

    elements.playoffWeekSelect.innerHTML = '<option value="">Select playoff week</option>';

    for (let week = playoffStart; week <= 18; week++) {
        const option = document.createElement('option');
        option.value = week;
        option.textContent = `Week ${week}${week === currentWeek ? ' (Current)' : ''}`;
        if (week === currentWeek) {
            option.selected = true;
            state.playoffWeek = week;
        }
        elements.playoffWeekSelect.appendChild(option);
    }
}

// Display team selection
function displayTeamSelection() {
    elements.teamList.innerHTML = '';

    // Sort teams by points for (or another metric)
    const sortedTeams = [...state.teams].sort((a, b) => b.pointsFor - a.pointsFor);

    sortedTeams.forEach(team => {
        const card = document.createElement('div');
        card.className = 'team-card';
        card.dataset.teamId = team.id;

        const isSelected = state.selectedTeams.some(t => t.id === team.id);
        if (isSelected) {
            card.classList.add('selected');
        }

        card.innerHTML = `
            <h4>${team.name}</h4>
            <p>OWNER: ${team.ownerName}</p>
            <p class="team-record">${team.wins}-${team.losses}</p>
            <p style="color: var(--text-muted); font-size: 0.7rem; margin-top: 0.5rem;">PF: ${team.pointsFor.toFixed(1)}</p>
        `;

        card.addEventListener('click', () => toggleTeamSelection(team, card));
        elements.teamList.appendChild(card);
    });

    updateSelectionCounter();
}

// Update selection counter
function updateSelectionCounter() {
    if (elements.selectedCount) {
        elements.selectedCount.textContent = state.selectedTeams.length;
    }
}

// Toggle team selection
function toggleTeamSelection(team, cardElement) {
    const index = state.selectedTeams.findIndex(t => t.id === team.id);

    if (index > -1) {
        // Deselect
        state.selectedTeams.splice(index, 1);
        cardElement.classList.remove('selected');
    } else {
        // Select (max 6 teams)
        if (state.selectedTeams.length >= 6) {
            alert('You can only select 6 teams for the losers bracket');
            return;
        }
        state.selectedTeams.push(team);
        cardElement.classList.add('selected');
    }

    updateSelectionCounter();

    // Show/hide create bracket button
    if (state.selectedTeams.length === 6) {
        elements.createBracketBtn.classList.remove('hidden');
    } else {
        elements.createBracketBtn.classList.add('hidden');
    }

    saveToLocalStorage();
}

// Create bracket builder interface
function createBracketBuilder() {
    elements.teamSelectionSection.classList.add('hidden');
    elements.bracketBuilderSection.classList.remove('hidden');

    // Render empty matchup builders
    renderMatchupBuilder('round1');
    renderMatchupBuilder('round2');
    renderMatchupBuilder('round3');
}

// Render matchup builder for a round
function renderMatchupBuilder(round) {
    const container = document.getElementById(`${round.replace(/(\d)/, '-$1')}-matchups`);
    const matchups = state.bracket[round];

    container.innerHTML = '';

    matchups.forEach((matchup, index) => {
        const matchupEl = createMatchupElement(round, matchup, index);
        container.appendChild(matchupEl);
    });
}

// Create a matchup element for builder
function createMatchupElement(round, matchup, index) {
    const div = document.createElement('div');
    div.className = 'matchup';

    const availableTeams = getAvailableTeamsForRound(round, index);

    div.innerHTML = `
        <div class="matchup-header">
            <span class="matchup-number">MATCH ${index + 1}</span>
            <button class="remove-matchup" data-round="${round}" data-index="${index}">REMOVE</button>
        </div>
        <select class="team-select" data-round="${round}" data-index="${index}" data-position="team1">
            <option value="">Select Team 1</option>
            ${availableTeams.map(team => `
                <option value="${team.id}" ${matchup.team1 === team.id ? 'selected' : ''}>
                    ${team.name}
                </option>
            `).join('')}
        </select>
        <div class="matchup-vs">VS</div>
        <select class="team-select" data-round="${round}" data-index="${index}" data-position="team2">
            <option value="">Select Team 2</option>
            ${availableTeams.map(team => `
                <option value="${team.id}" ${matchup.team2 === team.id ? 'selected' : ''}>
                    ${team.name}
                </option>
            `).join('')}
        </select>
    `;

    // Event listeners for selects
    const selects = div.querySelectorAll('.team-select');
    selects.forEach(select => {
        select.addEventListener('change', handleTeamSelection);
    });

    // Event listener for remove button
    const removeBtn = div.querySelector('.remove-matchup');
    removeBtn.addEventListener('click', handleRemoveMatchup);

    return div;
}

// Get available teams for a round (not already in use in that round at the same index)
function getAvailableTeamsForRound(round, currentIndex) {
    const usedTeamIds = new Set();
    state.bracket[round].forEach((matchup, index) => {
        if (index !== currentIndex) {
            if (matchup.team1) usedTeamIds.add(matchup.team1);
            if (matchup.team2) usedTeamIds.add(matchup.team2);
        }
    });

    return state.selectedTeams.filter(team => !usedTeamIds.has(team.id));
}

// Handle team selection in matchup builder
function handleTeamSelection(event) {
    const select = event.target;
    const round = select.dataset.round;
    const index = parseInt(select.dataset.index);
    const position = select.dataset.position;
    const teamId = parseInt(select.value);

    if (!state.bracket[round][index]) {
        state.bracket[round][index] = { team1: null, team2: null, winner: null, week: null };
    }

    state.bracket[round][index][position] = teamId || null;
    saveToLocalStorage();

    // Re-render to update available teams
    renderMatchupBuilder(round);
}

// Handle remove matchup
function handleRemoveMatchup(event) {
    const round = event.target.dataset.round;
    const index = parseInt(event.target.dataset.index);

    state.bracket[round].splice(index, 1);
    saveToLocalStorage();
    renderMatchupBuilder(round);
}

// Add matchup to round
function addMatchup(round) {
    const week = state.playoffWeek || state.currentWeek;
    state.bracket[round].push({ team1: null, team2: null, winner: null, week: week });
    renderMatchupBuilder(round);
    saveToLocalStorage();
}

// Save and view bracket
function saveBracket() {
    // Validate that all matchups have both teams selected
    for (const round in state.bracket) {
        const matchups = state.bracket[round];
        for (const matchup of matchups) {
            if (!matchup.team1 || !matchup.team2) {
                alert('Please complete all matchups before saving');
                return;
            }
            if (matchup.team1 === matchup.team2) {
                alert('A team cannot play against itself');
                return;
            }
        }
    }

    // Set week for each matchup based on playoff week selector
    const selectedWeek = parseInt(elements.playoffWeekSelect.value) || state.currentWeek;
    for (const round in state.bracket) {
        state.bracket[round].forEach(matchup => {
            if (!matchup.week) {
                matchup.week = selectedWeek;
            }
        });
    }

    elements.bracketBuilderSection.classList.add('hidden');
    elements.bracketViewSection.classList.remove('hidden');

    // Fetch scores and render
    refreshScores();
    saveToLocalStorage();
}

// Refresh scores from Sleeper API
async function refreshScores() {
    showLoading(true);

    try {
        const weeks = new Set();

        // Collect all weeks from bracket
        for (const round in state.bracket) {
            state.bracket[round].forEach(matchup => {
                if (matchup.week) {
                    weeks.add(matchup.week);
                }
            });
        }

        // Fetch matchups for each week
        for (const week of weeks) {
            const matchups = await fetchMatchups(state.leagueId, week);

            // Store scores by roster_id
            if (!state.matchupScores[week]) {
                state.matchupScores[week] = {};
            }

            matchups.forEach(matchup => {
                state.matchupScores[week][matchup.roster_id] = matchup.points || 0;
            });
        }

        saveToLocalStorage();
        renderBracketView();

    } catch (error) {
        console.error('Error fetching scores:', error);
        alert('Failed to fetch scores. Displaying bracket without live scores.');
        renderBracketView();
    } finally {
        showLoading(false);
    }
}

// Get score for a team in a specific week
function getTeamScore(teamId, week) {
    if (week && state.matchupScores[week] && state.matchupScores[week][teamId] !== undefined) {
        return state.matchupScores[week][teamId];
    }
    return null;
}

// Render bracket view
function renderBracketView() {
    elements.bracketDisplay.innerHTML = '';

    // Render each round
    const roundNames = {
        round1: 'QUARTERFINALS',
        round2: 'SEMIFINALS',
        round3: 'FINALS'
    };

    ['round1', 'round2', 'round3'].forEach((round) => {
        if (state.bracket[round].length === 0) return;

        const roundDiv = document.createElement('div');
        roundDiv.className = 'bracket-round';

        roundDiv.innerHTML = `<h4>${roundNames[round]}</h4>`;

        state.bracket[round].forEach((matchup, matchupIndex) => {
            const matchupDiv = createBracketMatchupElement(round, matchup, matchupIndex);
            roundDiv.appendChild(matchupDiv);
        });

        elements.bracketDisplay.appendChild(roundDiv);
    });

    // Update and render team records
    updateTeamRecords();
    renderTeamRecords();
}

// Create bracket matchup element for viewing
function createBracketMatchupElement(round, matchup, matchupIndex) {
    const div = document.createElement('div');
    div.className = 'bracket-matchup';

    const team1 = state.selectedTeams.find(t => t.id === matchup.team1);
    const team2 = state.selectedTeams.find(t => t.id === matchup.team2);

    const score1 = getTeamScore(matchup.team1, matchup.week);
    const score2 = getTeamScore(matchup.team2, matchup.week);

    const hasScores = score1 !== null && score2 !== null;
    const isLive = matchup.week === state.currentWeek;

    div.innerHTML = `
        <div class="bracket-team ${matchup.winner === matchup.team1 ? 'winner' : matchup.winner === matchup.team2 ? 'loser' : ''}"
             data-round="${round}" data-matchup="${matchupIndex}" data-team="${matchup.team1}">
            <span class="team-name">${team1?.name || 'TBD'}</span>
            ${hasScores ? `<span class="team-score ${isLive ? 'score-live' : ''}">${score1.toFixed(2)}</span>` : ''}
            <button class="win-btn ${matchup.winner === matchup.team1 ? 'active' : ''}">WIN</button>
        </div>
        <div class="bracket-team ${matchup.winner === matchup.team2 ? 'winner' : matchup.winner === matchup.team1 ? 'loser' : ''}"
             data-round="${round}" data-matchup="${matchupIndex}" data-team="${matchup.team2}">
            <span class="team-name">${team2?.name || 'TBD'}</span>
            ${hasScores ? `<span class="team-score ${isLive ? 'score-live' : ''}">${score2.toFixed(2)}</span>` : ''}
            <button class="win-btn ${matchup.winner === matchup.team2 ? 'active' : ''}">WIN</button>
        </div>
    `;

    // Add event listeners to win buttons
    const winBtns = div.querySelectorAll('.win-btn');
    winBtns.forEach(btn => {
        btn.addEventListener('click', handleWinClick);
    });

    return div;
}

// Handle win button click
function handleWinClick(event) {
    const btn = event.target;
    const teamDiv = btn.closest('.bracket-team');
    const round = teamDiv.dataset.round;
    const matchupIndex = parseInt(teamDiv.dataset.matchup);
    const teamId = parseInt(teamDiv.dataset.team);

    const matchup = state.bracket[round][matchupIndex];

    // Toggle winner
    if (matchup.winner === teamId) {
        // Unset winner
        matchup.winner = null;
    } else {
        // Set winner
        matchup.winner = teamId;
    }

    // Update team records
    updateTeamRecords();

    saveToLocalStorage();
    renderBracketView();
}

// Update team records based on bracket results
function updateTeamRecords() {
    // Initialize with regular season records
    state.selectedTeams.forEach(team => {
        state.teamRecords[team.id] = {
            wins: team.wins || 0,
            losses: team.losses || 0,
            playoffWins: 0,
            playoffLosses: 0
        };
    });

    // Count playoff wins and losses from bracket (each counts as 2)
    for (const round in state.bracket) {
        state.bracket[round].forEach(matchup => {
            if (matchup.winner) {
                const loserId = matchup.team1 === matchup.winner ? matchup.team2 : matchup.team1;

                state.teamRecords[matchup.winner].playoffWins++;
                state.teamRecords[loserId].playoffLosses++;
            }
        });
    }

    // Add playoff records (multiplied by 2) to regular season
    state.selectedTeams.forEach(team => {
        const record = state.teamRecords[team.id];
        record.totalWins = record.wins + (record.playoffWins * 2);
        record.totalLosses = record.losses + (record.playoffLosses * 2);
    });
}

// Calculate remaining playoff weeks
function getRemainingPlayoffWeeks() {
    const totalPlayoffWeeks = 3;

    // Count how many rounds have at least one winner
    let completedRounds = 0;
    for (const round in state.bracket) {
        const hasWinner = state.bracket[round].some(matchup => matchup.winner);
        if (hasWinner) {
            completedRounds++;
        }
    }

    return Math.max(0, totalPlayoffWeeks - completedRounds);
}

// Check if team is eligible for last place
function isEligibleForLastPlace(team, lastPlaceTeam, remainingWeeks) {
    const teamRecord = state.teamRecords[team.id];
    const lastPlaceRecord = state.teamRecords[lastPlaceTeam.id];

    // N = 2 * remaining weeks (since each playoff game counts as 2)
    const N = 2 * remainingWeeks;

    // Team is eligible if within N losses of last place team
    // Eligible if: teamLosses >= lastPlaceLosses - N
    return teamRecord.totalLosses >= lastPlaceRecord.totalLosses - N;
}

// Render team records
function renderTeamRecords() {
    elements.teamRecordsDisplay.innerHTML = '';

    // Sort teams by total wins (descending), then by total losses (ascending)
    const sortedTeams = [...state.selectedTeams].sort((a, b) => {
        const aRecord = state.teamRecords[a.id];
        const bRecord = state.teamRecords[b.id];
        if (bRecord.totalWins !== aRecord.totalWins) {
            return bRecord.totalWins - aRecord.totalWins;
        }
        return aRecord.totalLosses - bRecord.totalLosses;
    });

    // Find last place team (most losses / fewest wins)
    const lastPlaceTeam = [...sortedTeams].sort((a, b) => {
        const aRecord = state.teamRecords[a.id];
        const bRecord = state.teamRecords[b.id];
        if (bRecord.totalLosses !== aRecord.totalLosses) {
            return bRecord.totalLosses - aRecord.totalLosses;
        }
        return aRecord.totalWins - bRecord.totalWins;
    })[0];

    const remainingWeeks = getRemainingPlayoffWeeks();

    sortedTeams.forEach((team, index) => {
        const record = state.teamRecords[team.id];
        const isEligible = isEligibleForLastPlace(team, lastPlaceTeam, remainingWeeks);

        const card = document.createElement('div');
        card.className = 'record-card';
        if (isEligible) {
            card.classList.add('last-place-eligible');
        }

        card.innerHTML = `
            <div class="record-info">
                <div class="record-rank">#${index + 1}</div>
                <h4>${team.name}</h4>
                ${isEligible ? '<div class="eligibility-badge">LAST PLACE ELIGIBLE</div>' : ''}
            </div>
            <div class="record-details">
                <p class="record-stats">${record.totalWins}-${record.totalLosses}</p>
                <p class="record-breakdown">${record.wins}-${record.losses} + ${record.playoffWins * 2}-${record.playoffLosses * 2}</p>
            </div>
        `;
        elements.teamRecordsDisplay.appendChild(card);
    });
}

// Edit bracket
function editBracket() {
    elements.bracketViewSection.classList.add('hidden');
    elements.bracketBuilderSection.classList.remove('hidden');
}

// Share bracket
function shareBracket() {
    const shareableState = {
        leagueId: state.leagueId,
        selectedTeamIds: state.selectedTeams.map(t => t.id),
        bracket: state.bracket,
        teamRecords: state.teamRecords
    };

    const encoded = btoa(JSON.stringify(shareableState));
    const url = `${window.location.origin}${window.location.pathname}?data=${encoded}`;

    elements.shareLink.value = url;
    elements.shareModal.classList.remove('hidden');
}

// Copy link to clipboard
function copyLink() {
    elements.shareLink.select();
    elements.shareLink.setSelectionRange(0, 99999); // For mobile

    try {
        document.execCommand('copy');
        elements.copyBtnText.textContent = 'COPIED!';
        setTimeout(() => {
            elements.copyBtnText.textContent = 'COPY';
        }, 2000);
    } catch (err) {
        // Fallback for modern browsers
        navigator.clipboard.writeText(elements.shareLink.value).then(() => {
            elements.copyBtnText.textContent = 'COPIED!';
            setTimeout(() => {
                elements.copyBtnText.textContent = 'COPY';
            }, 2000);
        });
    }
}

// Close modal
function closeModal() {
    elements.shareModal.classList.add('hidden');
}

// Show/hide loading spinner
function showLoading(show) {
    if (show) {
        elements.loading.classList.remove('hidden');
    } else {
        elements.loading.classList.add('hidden');
    }
}

// Save state to localStorage
function saveToLocalStorage() {
    try {
        const saveState = {
            leagueId: state.leagueId,
            leagueData: state.leagueData,
            rosters: state.rosters,
            users: state.users,
            teams: state.teams,
            selectedTeams: state.selectedTeams,
            currentWeek: state.currentWeek,
            playoffWeek: state.playoffWeek,
            matchupScores: state.matchupScores,
            bracket: state.bracket,
            teamRecords: state.teamRecords
        };
        localStorage.setItem('sleeperBracket', JSON.stringify(saveState));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

// Load state from localStorage
function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('sleeperBracket');
        if (saved) {
            const saveState = JSON.parse(saved);
            Object.assign(state, saveState);

            if (state.leagueData) {
                elements.leagueIdInput.value = state.leagueId;
                elements.leagueName.textContent = state.leagueData.name;
                elements.leagueSeason.textContent = state.leagueData.season;
                elements.currentWeekDisplay.textContent = state.currentWeek || '--';
                elements.leagueBadge.textContent = `${state.leagueData.sport.toUpperCase()} // ${state.leagueData.season}`;
                elements.leagueInfo.classList.remove('hidden');

                if (state.selectedTeams.length > 0) {
                    displayTeamSelection();
                    elements.teamSelectionSection.classList.remove('hidden');
                }

                // If bracket exists, show it
                if (state.bracket.round1.length > 0 || state.bracket.round2.length > 0 || state.bracket.round3.length > 0) {
                    elements.bracketViewSection.classList.remove('hidden');
                    renderBracketView();
                }

                // Populate week selector
                if (state.leagueData.settings) {
                    populateWeekSelector();
                }
            }
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
    }
}

// Load state from URL
async function loadFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const data = urlParams.get('data');

    if (data) {
        try {
            const decoded = JSON.parse(atob(data));

            // Load league data first
            showLoading(true);

            const [leagueData, rosters, users, nflState] = await Promise.all([
                fetchLeagueData(decoded.leagueId),
                fetchRosters(decoded.leagueId),
                fetchUsers(decoded.leagueId),
                fetchNFLState()
            ]);

            state.leagueId = decoded.leagueId;
            state.leagueData = leagueData;
            state.rosters = rosters;
            state.users = users;
            state.currentWeek = nflState.week;
            initializeTeams();

            // Set selected teams
            state.selectedTeams = decoded.selectedTeamIds.map(id =>
                state.teams.find(t => t.id === id)
            ).filter(Boolean);

            // Set bracket and records
            state.bracket = decoded.bracket;
            state.teamRecords = decoded.teamRecords;

            // Display
            elements.leagueIdInput.value = state.leagueId;
            elements.leagueName.textContent = state.leagueData.name;
            elements.leagueSeason.textContent = state.leagueData.season;
            elements.currentWeekDisplay.textContent = state.currentWeek;
            elements.leagueBadge.textContent = `${state.leagueData.sport.toUpperCase()} // ${state.leagueData.season}`;
            elements.leagueInfo.classList.remove('hidden');

            populateWeekSelector();

            elements.bracketViewSection.classList.remove('hidden');

            // Fetch scores and render
            await refreshScores();

            saveToLocalStorage();
            showLoading(false);

        } catch (error) {
            console.error('Error loading shared bracket:', error);
            alert('Failed to load shared bracket');
            showLoading(false);
        }
    }
}

// Initialize app
function init() {
    // Load from URL first (takes precedence)
    if (window.location.search.includes('data=')) {
        loadFromURL();
    } else {
        // Otherwise load from localStorage
        loadFromLocalStorage();
    }

    // Event listeners
    elements.loadLeagueBtn.addEventListener('click', loadLeague);
    elements.leagueIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loadLeague();
    });

    elements.createBracketBtn.addEventListener('click', createBracketBuilder);

    elements.addRound1Matchup.addEventListener('click', () => addMatchup('round1'));
    elements.addRound2Matchup.addEventListener('click', () => addMatchup('round2'));
    elements.addRound3Matchup.addEventListener('click', () => addMatchup('round3'));

    elements.playoffWeekSelect.addEventListener('change', (e) => {
        state.playoffWeek = parseInt(e.target.value);
        saveToLocalStorage();
    });

    elements.saveBracketBtn.addEventListener('click', saveBracket);
    elements.editBracketBtn.addEventListener('click', editBracket);
    elements.shareBracketBtn.addEventListener('click', shareBracket);
    elements.refreshScoresBtn.addEventListener('click', refreshScores);

    elements.copyLinkBtn.addEventListener('click', copyLink);
    elements.closeModalBtn.addEventListener('click', closeModal);

    // Close modal when clicking backdrop
    elements.shareModal.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal') || e.target.classList.contains('modal-backdrop')) {
            closeModal();
        }
    });
}

// Start the app
init();
