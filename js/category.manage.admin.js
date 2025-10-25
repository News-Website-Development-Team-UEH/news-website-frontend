console.log("📂 category.manage.admin.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  // const API = window.API_BASE || "https://news-website-backend-05b8.onrender.com";
  const tableBody = document.getElementById("categoryTableBody");
  const addBtn = document.getElementById("addCategoryBtn");

  if (!token || !tableBody) return;

  /* --- Lấy danh mục --- */
  async function loadCategories() {
    tableBody.innerHTML = `<tr><td colspan="4" class="text-center">Đang tải...</td></tr>`;
    try {
      const res = await fetch(`${API}/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Không thể tải danh mục");
      const json = await res.json();
      const categories = json.data || json;

      if (!categories.length) {
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Không có danh mục nào</td></tr>`;
        return;
      }

      tableBody.innerHTML = "";
      categories.forEach(cat => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${cat.id}</td>
          <td>${cat.name}</td>
          <td>${cat.slug}</td>
          <td>
            <button class="btn btn-sm btn-outline-warning edit-btn" data-id="${cat.id}" data-name="${cat.name}">
              <i class="fa-solid fa-pen"></i> Sửa
            </button>
          </td>
        `;
        tableBody.appendChild(row);
      });

      attachEditEvents();
    } catch (err) {
      console.error("Load categories error:", err);
      tableBody.innerHTML = `<tr><td colspan="4" class="text-danger text-center">Lỗi khi tải danh mục.</td></tr>`;
    }
  }

  /* --- Tạo danh mục --- */
  async function createCategory(name) {
    const slug = name.trim().toLowerCase().replace(/\s+/g, "-");
    try {
      const res = await fetch(`${API}/admin/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, slug }),
      });
      if (!res.ok) throw new Error("Không thể tạo danh mục mới");
      alert("✅ Tạo danh mục thành công!");
      loadCategories();
    } catch (err) {
      console.error("Create category error:", err);
      alert("❌ Lỗi khi tạo danh mục mới");
    }
  }

  /* --- Cập nhật danh mục --- */
  async function updateCategory(id, newName) {
    try {
      const res = await fetch(`${API}/admin/categories/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newName }),
      });
      if (!res.ok) throw new Error("Không thể cập nhật danh mục");
      alert("✅ Cập nhật danh mục thành công!");
      loadCategories();
    } catch (err) {
      console.error("Update category error:", err);
      alert("❌ Lỗi khi cập nhật danh mục");
    }
  }

  /* --- Gắn sự kiện Sửa --- */
  function attachEditEvents() {
    document.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const oldName = btn.dataset.name;
        const newName = prompt("Nhập tên danh mục mới:", oldName);
        if (newName && newName.trim() && newName !== oldName) {
          updateCategory(id, newName.trim());
        }
      });
    });
  }

  /* --- Gắn sự kiện Thêm --- */
  addBtn.addEventListener("click", () => {
    const name = prompt("Nhập tên danh mục mới:");
    if (name && name.trim()) {
      createCategory(name.trim());
    }
  });

  loadCategories();
});
