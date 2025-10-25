// const API_BASE = "http://localhost:3000";

/* -------------------- Helper lấy role từ token -------------------- */
function getRoleFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || null;
  } catch {
    return null;
  }
}

/* -------------------- Render danh mục -------------------- */
function renderCategories(categories) {
  const container = document.getElementById("categories");
  if (!container) return;

  if (!Array.isArray(categories) || categories.length === 0) {
    container.innerHTML = "<span>Không có danh mục nào</span>";
    return;
  }

  container.innerHTML = categories
    .map(
      (c) => `
      <label class="category">
        <input type="checkbox" name="categories" value="${c.id}" data-name="${c.name}">
        <span>${c.name}</span>
      </label>
    `
    )
    .join("");

  document
    .querySelectorAll("input[name='categories']")
    .forEach((cb) => cb.addEventListener("change", checkForm));
}

/* -------------------- Kiểm tra form -------------------- */
function checkForm() {
  const titleInput = document.getElementById("title");
  const descInput = document.getElementById("desc");
  const contentInput = document.getElementById("content");
  const createBtn = document.querySelector(".btn__create--story");

  const isFilled =
    titleInput.value.trim() &&
    descInput.value.trim() &&
    contentInput.value.trim();
  const isCategoryChecked =
    document.querySelectorAll("input[name='categories']:checked").length > 0;

  if (isFilled && isCategoryChecked) {
    createBtn.disabled = false;
    createBtn.removeAttribute("title");
  } else {
    createBtn.disabled = true;
    createBtn.setAttribute("title", "Vui lòng điền đầy đủ thông tin");
  }
}

/* -------------------- Upload ảnh hoặc nhập link -------------------- */
document
  .getElementById("coverInput")
  .addEventListener("change", function (event) {
    const file = event.target.files[0];
    const preview = document.getElementById("coverPreview");

    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        preview.src = e.target.result;
        preview.style.display = "block";
        document.getElementById("coverUrl").value = "";
      };
      reader.readAsDataURL(file);
    }
  });

document.getElementById("coverUrl").addEventListener("input", function (e) {
  const url = e.target.value.trim();
  const preview = document.getElementById("coverPreview");
  if (url) {
    preview.src = url;
    preview.style.display = "block";
    document.getElementById("coverInput").value = "";
  } else {
    preview.style.display = "none";
  }
});

/* -------------------- Main -------------------- */
document.addEventListener("DOMContentLoaded", async () => {
  const titleInput = document.getElementById("title");
  const descInput = document.getElementById("desc");
  const contentInput = document.getElementById("content");
  const createBtn = document.querySelector(".btn__create--story");
  const coverPreview = document.getElementById("coverPreview");

  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get("edit"); // 👉 nếu có thì đang ở chế độ chỉnh sửa
  const token = localStorage.getItem("token");
  const role = getRoleFromToken();

  createBtn.disabled = true;

  [titleInput, descInput, contentInput].forEach((input) =>
    input.addEventListener("input", checkForm)
  );

  /* -------------------- Load danh mục -------------------- */
  try {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error("Không thể tải danh mục");
    const json = await res.json();
    const categories = json.data || json;
    renderCategories(categories);
  } catch (err) {
    console.error("❌ Lỗi khi tải danh mục:", err);
  }

  /* -------------------- Nếu là CHỈNH SỬA thì tải bài viết -------------------- */
  if (editId) {
    try {
      const res = await fetch(`${API_BASE}/author/articles/${editId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Không thể tải bài viết để chỉnh sửa");
      const article = await res.json();

      // ✅ Gán dữ liệu vào form
      titleInput.value = article.title || "";
      descInput.value = article.description || "";
      contentInput.value = article.content || "";
      if (article.image_url) {
        coverPreview.src = article.image_url;
        coverPreview.style.display = "block";
      }

      // ✅ Đánh dấu danh mục chính và phụ
      setTimeout(() => {
        document.querySelectorAll("input[name='categories']").forEach((cb) => {
          const id = parseInt(cb.value, 10);
          if (id === article.main_category_id) cb.checked = true;
          if (article.sub_categories?.includes(id)) cb.checked = true;
        });
        checkForm();
      }, 500);

      document.querySelector(".page-title").textContent = "Chỉnh sửa bài viết";
      createBtn.textContent = "Cập nhật bài viết";
      createBtn.disabled = false;
    } catch (err) {
      console.error("❌ Lỗi khi tải bài viết:", err);
      alert("Không thể tải dữ liệu bài viết!");
    }
  }

  /* -------------------- Gửi bài viết (POST hoặc PUT) -------------------- */
  createBtn.addEventListener("click", async () => {
    if (createBtn.disabled) return;

    const checked = Array.from(
      document.querySelectorAll("input[name='categories']:checked")
    );
    if (!checked.length) return alert("Vui lòng chọn ít nhất một danh mục");

    const main_category_id = parseInt(checked[0].value, 10);
    const sub_categories = checked.slice(1).map((c) => parseInt(c.value, 10));

    const title = titleInput.value.trim();
    const description = descInput.value.trim();
    const content = contentInput.value.trim();
    const image_url =
      document.getElementById("coverUrl").value.trim() ||
      coverPreview.src ||
      "";

    const status = role === "admin" ? "published" : "pending";
    const route = role === "admin" ? "/admin/articles" : "/author/articles";

    const data = {
      title,
      description,
      content,
      main_category_id,
      sub_categories,
      image_url,
      status,
    };

    try {
      const method = editId ? "PUT" : "POST";
      const endpoint = editId
        ? `${API_BASE}${route}/${editId}`
        : `${API_BASE}${route}`;

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok) {
        alert(
          editId
            ? "✅ Cập nhật bài viết thành công!"
            : "✅ Tạo bài viết thành công!"
        );
        window.location.href = "authorinfo.html";
      } else {
        console.error("❌ Lỗi server:", result);
        alert(result.message || "Không thể lưu bài viết!");
      }
    } catch (err) {
      console.error("❌ Lỗi kết nối:", err);
      alert("Không kết nối được server.");
    }
  });
});
