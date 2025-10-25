document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || !user) {
    handleLogout();
    return;
  }

  if (window.__profileInitialized) return;
  window.__profileInitialized = true;

  const userService = new UserService(API_BASE, token);
  const profilePage = new ProfilePage(userService);
  const authorHandler = new AuthorApplicationHandler();
  const authorInfoHandler = new AuthorInfoHandler(userService);

  window.profilePageInstance = profilePage;
  window.authorInfoHandlerInstance = authorInfoHandler;

  try {
    await profilePage.init();

    if (!window.__authorHandlerInit) {
      authorHandler.init();
      window.__authorHandlerInit = true;
    }
    if (!window.__authorInfoInit) {
      authorInfoHandler.init();
      window.__authorInfoInit = true;
    }

  } catch (error) {
    console.error(error);
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
      messageDiv.textContent = 'Có lỗi khi tải trang. Vui lòng thử lại sau.';
      messageDiv.className = 'alert alert-danger show';
    }
  }
});
