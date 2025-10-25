console.log("API_BASE =", window.API_BASE);

document.addEventListener("DOMContentLoaded", () => {
  const readerBtn = document.getElementById("readerBtn");
  const authorBtn = document.getElementById("authorBtn");
  const userListContainer = document.querySelector(".acounts-container .row");
  console.log("Container found?", !!userListContainer);
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Bạn chưa đăng nhập!");
    window.location.href = "formlogin.html";
    return;
  }

  // --- Hàm lấy danh sách tất cả người dùng ---
  async function fetchAllUsers() {
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Không thể tải danh sách người dùng");
      const data = await res.json();
      console.log("Fetched raw data:", data);
      return Array.isArray(data) ? data : data.data || [];
    } catch (err) {
      console.error("Fetch users error:", err);
      return [];
    }
  }

  // --- Hàm xóa người dùng ---
  async function deleteUser(userId) {
    if (!confirm("Bạn có chắc chắn muốn xóa người dùng này?")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Xóa thất bại");
      alert("Đã xóa người dùng thành công!");
      loadUsers(currentRole);
    } catch (err) {
      console.error("Delete error:", err);
      alert("Không thể xóa người dùng này.");
    }
  }

  // --- Hàm render danh sách người dùng ---
  function renderUsers(users, role) {
    userListContainer.innerHTML = "";
    const filtered = users.filter((u) => u.role === role);

    if (filtered.length === 0) {
      userListContainer.innerHTML = `<p class="text-center text-muted">Không có ${
        role === "reader" ? "độc giả" : "tác giả"
      } nào.</p>`;
      return;
    }

    filtered.forEach((u) => {
      const card = document.createElement("div");
      card.className = "col-12 col-md-6 col-lg-4 mb-3";
      card.innerHTML = `
        <div class="card bg-dark text-light border border-secondary">
          <div class="card-body">
            <h5 class="card-title">${u.fullName || u.username}</h5>
            <p class="card-text small text-muted mb-1"><strong>Email:</strong> ${
              u.email || "N/A"
            }</p>
            <p class="card-text small text-muted"><strong>Role:</strong> ${
              u.role
            }</p>
            <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${
              u.id
            }">
              <i class="fa-solid fa-trash"></i> Xóa
            </button>
          </div>
        </div>
      `;
      userListContainer.appendChild(card);
    });

    // Gắn sự kiện xóa
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => deleteUser(btn.dataset.id));
    });
  }

  // --- Load user theo role ---
  let currentRole = "reader";
  async function loadUsers(role) {
    const users = await fetchAllUsers();
    console.log("All users fetched:", users);
    renderUsers(users, role);
  }

  // --- Sự kiện nút lọc ---
  readerBtn.addEventListener("click", () => {
    readerBtn.classList.add("active");
    authorBtn.classList.remove("active");
    currentRole = "reader";
    loadUsers("reader");
  });

  authorBtn.addEventListener("click", () => {
    authorBtn.classList.add("active");
    readerBtn.classList.remove("active");
    currentRole = "author";
    loadUsers("author");
  });

  // --- Tải mặc định ---
  loadUsers("reader");
});
