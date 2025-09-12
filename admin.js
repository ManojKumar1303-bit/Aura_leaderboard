// Admin panel functionality
class AdminPanel {
    constructor() {
        this.teams = [];
        this.isAuthenticated = false;
        this.initializeAdmin();
    }

    initializeAdmin() {
        // Wait for Firebase to be available
        if (typeof window.database === 'undefined') {
            setTimeout(() => this.initializeAdmin(), 100);
            return;
        }

        this.setupAuthStateListener();
        this.setupEventListeners();
    }

    setupAuthStateListener() {
        // Use Firebase Auth state listener
        window.onAuthStateChanged(window.auth, (user) => {
            if (user) {
                this.isAuthenticated = true;
                this.showAdminPanel();
                this.loadTeams();
            } else {
                this.isAuthenticated = false;
                this.showLoginForm();
            }
        });
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Add team form
        document.getElementById('addTeamForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddTeam();
        });

        // Update score form
        document.getElementById('updateScoreForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleUpdateScore();
        });

        // Persist increment toggle
        const incToggle = document.getElementById('incrementMode');
        if (incToggle) {
            const saved = localStorage.getItem('incrementMode');
            if (saved !== null) incToggle.checked = saved === 'true';
            incToggle.addEventListener('change', () => {
                localStorage.setItem('incrementMode', incToggle.checked ? 'true' : 'false');
            });
        }

        // Delete team form
        document.getElementById('deleteTeamForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleDeleteTeam();
        });
    }

    async handleLogin() {
        console.log('Login attempt started');
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');

        console.log('Email:', email, 'Password:', password);

        try {
            // Use Firebase Authentication
            await window.signInWithEmailAndPassword(window.auth, email, password);
            console.log('Login successful');
            this.isAuthenticated = true;
            this.showAdminPanel();
            this.loadTeams();
            errorDiv.textContent = '';
        } catch (error) {
            console.log('Login failed:', error.message);
            errorDiv.textContent = 'Invalid email or password. Please try again.';
        }
    }

    async handleLogout() {
        try {
            await window.signOut(window.auth);
            this.isAuthenticated = false;
            this.showLoginForm();
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    showLoginForm() {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('adminPanel').style.display = 'none';
    }

    showAdminPanel() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
    }

    loadTeams() {
        const teamsRef = window.ref(window.database, 'teams');
        
        window.onValue(teamsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                this.teams = Object.entries(data).map(([id, team]) => ({
                    id,
                    name: team.name,
                    score: team.score || 0
                }));
                
                this.updateTeamSelects();
                this.renderTeamsDisplay();
            } else {
                this.teams = [];
                this.updateTeamSelects();
                this.renderTeamsDisplay();
            }
        });
    }

    updateTeamSelects() {
        const updateSelect = document.getElementById('updateTeamSelect');
        const deleteSelect = document.getElementById('deleteTeamSelect');
        
        const options = this.teams.map(team => 
            `<option value="${team.id}">${team.name} (${team.score} points)</option>`
        ).join('');
        
        updateSelect.innerHTML = '<option value="">Choose a team...</option>' + options;
        deleteSelect.innerHTML = '<option value="">Choose a team...</option>' + options;
    }

    renderTeamsDisplay() {
        const display = document.getElementById('teamsDisplay');
        
        if (this.teams.length === 0) {
            display.innerHTML = '<div class="empty-message">No teams registered yet</div>';
            return;
        }

        const teamsHtml = this.teams.map(team => `
            <div class="team-card">
                <div class="team-info">
                    <h4>${team.name}</h4>
                    <span class="team-score">${team.score} points</span>
                </div>
            </div>
        `).join('');

        display.innerHTML = teamsHtml;
    }

    async handleAddTeam() {
        const teamName = document.getElementById('teamName').value.trim();
        const initialScore = parseInt(document.getElementById('initialScore').value) || 0;

        if (!teamName) {
            alert('Please enter a team name');
            return;
        }

        try {
            const teamsRef = window.ref(window.database, 'teams');
            const newTeamRef = window.push(teamsRef);
            await window.set(newTeamRef, {
                name: teamName,
                score: initialScore
            });

            // Clear form
            document.getElementById('teamName').value = '';
            document.getElementById('initialScore').value = '0';
            
            alert('Team added successfully!');
        } catch (error) {
            console.error('Error adding team:', error);
            alert('Error adding team. Please try again.');
        }
    }

    async handleUpdateScore() {
        const teamId = document.getElementById('updateTeamSelect').value;
        const deltaScore = parseInt(document.getElementById('newScore').value);
        let incrementMode = true;
        const incEl = document.getElementById('incrementMode');
        if (incEl) {
            incrementMode = incEl.checked;
        } else {
            const saved = localStorage.getItem('incrementMode');
            if (saved !== null) incrementMode = saved === 'true';
        }

        if (!teamId) {
            alert('Please select a team');
            return;
        }

        if (isNaN(deltaScore)) {
            alert('Please enter a valid score');
            return;
        }

        try {
            const teamRef = window.ref(window.database, `teams/${teamId}`);
            const team = this.teams.find(t => t.id === teamId);
            const current = team ? (team.score || 0) : 0;
            const updatedTotal = incrementMode ? (current + deltaScore) : deltaScore;
            await window.update(teamRef, { score: updatedTotal });
            
            // Clear form
            document.getElementById('updateTeamSelect').value = '';
            document.getElementById('newScore').value = '';
            
            alert(`Score updated successfully! New total: ${updatedTotal}`);
        } catch (error) {
            console.error('Error updating score:', error);
            alert('Error updating score. Please try again.');
        }
    }

    async handleDeleteTeam() {
        const teamId = document.getElementById('deleteTeamSelect').value;

        if (!teamId) {
            alert('Please select a team to delete');
            return;
        }

        const team = this.teams.find(t => t.id === teamId);
        if (!team) {
            alert('Team not found');
            return;
        }

        if (!confirm(`Are you sure you want to delete "${team.name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const teamRef = window.ref(window.database, `teams/${teamId}`);
            await window.remove(teamRef);
            
            // Clear form
            document.getElementById('deleteTeamSelect').value = '';
            
            alert('Team deleted successfully!');
        } catch (error) {
            console.error('Error deleting team:', error);
            alert('Error deleting team. Please try again.');
        }
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AdminPanel();
});
