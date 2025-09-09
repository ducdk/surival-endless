class ApiClient {
  constructor() {
    // In Docker environment, use service name instead of localhost
    const isDocker = window.location.hostname === 'localhost' && window.location.port === '8080';
    this.baseUrl = isDocker ? 'http://localhost:3000/api' : 'http://localhost:3000/api';
    this.token = localStorage.getItem('authToken');
  }

  async register(username, email, password) {
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    // Save token
    localStorage.setItem('authToken', data.token);
    this.token = data.token;
    
    return data;
  }

  async login(email, password) {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    // Save token
    localStorage.setItem('authToken', data.token);
    this.token = data.token;
    
    return data;
  }

  async getGameData() {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${this.baseUrl}/game-data`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch game data');
    }
    
    return data;
  }

  async updateGameData(gameData) {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${this.baseUrl}/game-data`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ gameData })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update game data');
    }
    
    return data;
  }

  logout() {
    localStorage.removeItem('authToken');
    this.token = null;
  }

  isAuthenticated() {
    return !!this.token;
  }
}

export default new ApiClient();
