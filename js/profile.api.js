function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'formlogin.html';
}

class UserService {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async request(path, method, body = null) {
    const res = await fetch(this.baseUrl + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: body ? JSON.stringify(body) : null
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${res.status}`);
    }
    return await res.json();
  }

  getProfile() { return this.request('/reader/profile', 'GET'); }
  updateProfile(data) { return this.request('/reader/profile', 'PUT', data); }
  getFollowedCategories() { return this.request('/reader/followed-categories', 'GET'); }
  unfollowCategory(categoryId) { return this.request('/reader/unfollow-category', 'POST', { categoryId }); }
}
