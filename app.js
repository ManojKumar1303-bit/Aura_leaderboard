// Leaderboard functionality
class Leaderboard {
    constructor() {
        this.teams = [];
        this.initializeLeaderboard();
    }

    initializeLeaderboard() {
        // Wait for Firebase to be available
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
                this.teams = Object.entries(data).map(([id, team]) => ({
                    id,
                    name: team.name,
                    score: team.score || 0
                }));
                
                // Sort teams by score (descending)
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
        const tbody = document.getElementById('leaderboardBody');
        
        if (this.teams.length === 0) {
            this.renderEmptyState();
            return;
        }

        tbody.innerHTML = this.teams.map((team, index) => {
            const rank = index + 1;
            const medal = this.getMedalIcon(rank);
            
            return `
                <tr class="team-row">
                    <td class="rank">
                        <span class="rank-number">${rank}</span>
                        ${medal}
                    </td>
                    <td class="team-name">${team.name}</td>
                    <td class="score">${team.score}</td>
                </tr>
            `;
        }).join('');
    }

    renderEmptyState() {
        const tbody = document.getElementById('leaderboardBody');
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="3" class="empty-message">
                    <div class="empty-icon">🏆</div>
                    <div>No teams registered yet</div>
                </td>
            </tr>
        `;
    }

    renderErrorState() {
        const tbody = document.getElementById('leaderboardBody');
        tbody.innerHTML = `
            <tr class="error-row">
                <td colspan="3" class="error-message">
                    <div class="error-icon">⚠️</div>
                    <div>Error loading leaderboard. Please refresh the page.</div>
                </td>
            </tr>
        `;
    }

    getMedalIcon(rank) {
        switch (rank) {
            case 1:
                return '<span class="medal gold">🥇</span>';
            case 2:
                return '<span class="medal silver">🥈</span>';
            case 3:
                return '<span class="medal bronze">🥉</span>';
            default:
                return '';
        }
    }
}

// Initialize leaderboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Leaderboard();
});
