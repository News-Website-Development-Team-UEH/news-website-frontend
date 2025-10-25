/* -------------------- Helper -------------------- */
async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || res.statusText);
  }
  return data;
}
/* -------------------- Auth API -------------------- */
async function functionLogin(username, password) {
  const result = await fetchJson(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  saveAuthData(result.token, result.user);
  return result;
}

async function functionRegister(username, email, password, fullName) {
  const result = await fetchJson(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password, full_name: fullName }),
  });

  saveAuthData(result.token, result.user);
  return result;
}

// Hàm lưu trữ Token và User
function saveAuthData(token, user) {
  if (token) {
    localStorage.setItem("token", token);
  }
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  }
}
// kiểm tra role
function redirectByRole(user) {
  const role = user?.role?.toLowerCase() || "reader";
  if (role === "admin") {
    location.href = "formadmin.html";
  } else {
    location.href = "index.html";
  }
}

/* -------------------- UI Logic -------------------- */
document.addEventListener("DOMContentLoaded", () => {
  const loginTab = document.getElementById("loginTab");
  const registerTab = document.getElementById("registerTab");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const forgotForm = document.getElementById("forgotForm");
  const forgotPasswordLink = document.getElementById("forgotPasswordLink");
  const backToLoginLink = document.getElementById("backToLoginLink");
  const googleBtn = document.getElementById("googleBtn"); // Nút Google
  const messageBox = document.getElementById("message");

  // ---- Hàm hiển thị thông báo ----
  function showMessage(msg, type) {
    messageBox.textContent = msg;
    messageBox.className = `alert alert-${type}`;
    messageBox.classList.remove("d-none");

    // Tự động ẩn thông báo sau 5 giây
    setTimeout(() => {
      messageBox.classList.add("d-none");
    }, 5000);
  }
  // ---- Xử lý Callback từ Google ----
  function handleGoogleCallbackResult() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const userJson = urlParams.get("user");

    // Nếu không có token hoặc user thì bỏ qua
    if (!token || !userJson) return false;

    try {
      // Giải mã dữ liệu user (vì user bị encode trong URL)
      const decodedUser = decodeURIComponent(userJson);
      const user = JSON.parse(decodedUser);

      // Lưu token & user
      saveAuthData(token, user);

      console.log("Google login success:", user);

      // Điều hướng tùy theo role
      redirectByRole(user);

      // Trả true để dừng script
      return true;
    } catch (error) {
      console.error("Error parsing user info:", error);
      return false;
    }
  }

  // --- Xử lý login callback từ Google ---
  window.addEventListener("load", () => {
    const handled = handleGoogleCallbackResult();
    if (handled) {
      console.log("Đã xử lý Google login callback");
    }
  });

  // ---- Google Login ----
  googleBtn?.addEventListener("click", () => {
    // Redirect browser đến endpoint Google Auth của backend
    window.location.href = `${API_BASE}/auth/google`;
  });

  // ---- Tab chuyển form ----
  loginTab?.addEventListener("click", () => {
    loginForm.style.display = "block";
    registerForm.style.display = "none";
    forgotForm.style.display = "none";
    loginTab.style.color = "#ff4500";
    registerTab.style.color = "#999";
  });

  registerTab?.addEventListener("click", () => {
    loginForm.style.display = "none";
    registerForm.style.display = "block";
    forgotForm.style.display = "none";
    loginTab.style.color = "#999";
    registerTab.style.color = "#ff4500";
  });

  // ---- Quên mật khẩu ----
  forgotPasswordLink?.addEventListener("click", (e) => {
    e.preventDefault();
    loginForm.style.display = "none";
    forgotForm.style.display = "block";
  });

  backToLoginLink?.addEventListener("click", (e) => {
    e.preventDefault();
    forgotForm.style.display = "none";
    loginForm.style.display = "block";
  });

  // ---- Submit Login ----
  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    try {
      const res = await functionLogin(username, password);
      showMessage(res.message || "Đăng nhập thành công!", "success");
      setTimeout(() => redirectByRole(res.user), 1000);
    } catch (err) {
      showMessage(err.message, "danger");
    }
  });

  // ---- Submit Register ----
  registerForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("regUsername").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const fullName = document.getElementById("regFullName").value.trim();
    const password = document.getElementById("regPassword").value.trim();

    try {
      const res = await functionRegister(username, email, password, fullName);
      showMessage(res.message, "success");

      // chuyển sang login form sau khi đăng ký
      setTimeout(() => {
        registerForm.style.display = "none";
        loginForm.style.display = "block";
        loginTab.style.color = "#ff4500";
        registerTab.style.color = "#999";
      }, 1500);
    } catch (err) {
      showMessage(err.message, "danger");
    }
  });
});
