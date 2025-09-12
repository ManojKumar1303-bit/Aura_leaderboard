// Leaderboard functionality
class Leaderboard {
    constructor() {
        this.teams = [];
        this.initializeLeaderboard();
    }

    initializeLeaderboard() {
        if (typeof window.database === 'undefined') {
            setTimeout(() => this.initializeLeaderboard(), 100);
            return;
        }
        this.setupRealtimeListener();
    }

    setupRealtimeListener() {
        const teamsRef = window.ref(window.database, 'teams');
        
        window.onValue(teamsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                this.teams = Object.entries(data).map(([id, team]) => ({ id, name: team.name, score: team.score || 0 }));
                this.teams.sort((a, b) => b.score - a.score);
                this.renderLeaderboard();
            } else {
                this.teams = [];
                this.renderEmptyState();
            }
        }, (error) => {
            console.error('Error fetching teams:', error);
            this.renderErrorState();
        });
    }

    renderLeaderboard() {
        const podium = document.getElementById('podium');
        const pillList = document.getElementById('pillList');
        if (!podium || !pillList) return;

        if (this.teams.length === 0) {
            podium.innerHTML = this.getEmptyHTML('No teams registered yet');
            pillList.innerHTML = '';
            return;
        }

        const topThree = this.teams.slice(0, 3);
        const others = this.teams.slice(3);

        podium.innerHTML = this.renderPodium(topThree);
        pillList.innerHTML = others.map((team, index) => this.renderPillRow(team, index + 4)).join('');
    }

    renderPodium(topThree) {
        const [first, second, third] = [topThree[0], topThree[1], topThree[2]];
        return `
            <div class="podium-stage">
                <div class="dna-backdrop" aria-hidden="true"></div>
                <div class="podium-columns">
                    <div class="podium-col second">${second ? this.renderPodiumBlock(second, 2) : ''}</div>
                    <div class="podium-col first">${first ? this.renderPodiumBlock(first, 1) : ''}</div>
                    <div class="podium-col third">${third ? this.renderPodiumBlock(third, 3) : ''}</div>
                </div>
            </div>
        `;
    }

    renderPodiumBlock(team, rank) {
        return `
            <div class="podium-block rank-${rank}">
                <div class="place-badge">${rank}</div>
                <div class="podium-body">
                    <div class="team-name" style="font-size:1.6rem;">${team.name}</div>
                    <div class="spacer"></div>
                    <div class="score" style="font-size:2.6rem;">${team.score}</div>
                </div>
            </div>
        `;
    }

    renderPillRow(team, rank) {
        return `
            <div class="pill-row">
                <div class="pill-rank">${rank}.</div>
                <div class="pill-name">${team.name}</div>
                <div class="pill-score">${team.score}</div>
            </div>
        `;
    }

    getEmptyHTML(message) {
        return `
            <div class="empty-state">
                <div class="empty-message">${message}</div>
            </div>
        `;
    }

    renderEmptyState() {
        const podium = document.getElementById('podium');
        const pillList = document.getElementById('pillList');
        if (podium) podium.innerHTML = this.getEmptyHTML('No teams registered yet');
        if (pillList) pillList.innerHTML = '';
    }

    renderErrorState() {
        const podium = document.getElementById('podium');
        const pillList = document.getElementById('pillList');
        if (podium) podium.innerHTML = this.getEmptyHTML('Error loading leaderboard. Please refresh the page.');
        if (pillList) pillList.innerHTML = '';
    }

    getMedalIcon(rank) {
        switch (rank) {
            case 1: return '<span class="medal gold">🥇</span>';
            case 2: return '<span class="medal silver">🥈</span>';
            case 3: return '<span class="medal bronze">🥉</span>';
            default: return '';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => { new Leaderboard(); });
