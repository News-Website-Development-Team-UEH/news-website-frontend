let allArticlesCache = [];

/* -------------------- Render Categories -------------------- */
function renderCategories(categories) {
  const container = document.getElementById("categoriesList");
  if (!container) return;

  if (!Array.isArray(categories) || categories.length === 0) {
    container.innerHTML = "<span>Không có danh mục nào</span>";
    return;
  }

  let html = `<button class="btn btn-outline-warning active" data-id="all">All</button>`;
  html += categories
    .map(
      (c) =>
        `<button class="btn btn-outline-warning" data-id="${c.id}">${c.name}</button>`
    )
    .join("");

  container.innerHTML = html;

  container.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      container
        .querySelectorAll("button")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const categoryId = btn.getAttribute("data-id");
      const searchInput = document.getElementById("search");
      if (searchInput) searchInput.value = "";

      if (categoryId === "all") {
        const allArticles = await fetchAllArticles();
        allArticlesCache = allArticles;
        renderAdminArticles(allArticles);
        document.title = "TheGRID - Tất cả bài báo";
      } else {
        const category = categories.find((c) => c.id == categoryId);
        if (category) document.title = `TheGRID - ${category.name}`;
        const articles = await fetchArticlesByCategory(categoryId);
        allArticlesCache = articles;
        renderAdminArticles(articles);
      }
    });
  });
}

/* -------------------- Render Articles -------------------- */
function renderAdminArticles(articles) {
  const section = document.querySelector(".articles-section");
  if (!section) return;

  if (!articles || articles.length === 0) {
    section.innerHTML = "<p style='color:#fff'>Không có bài báo nào</p>";
    return;
  }

  section.innerHTML = articles
    .map(
      (a) => `
    <article class="article d-flex justify-content-between align-items-start border-bottom border-secondary py-3"
             data-id="${a.id}" style="cursor:pointer;">
      <div class="article-content flex-grow-1">
        <div class="article-meta text-secondary small mb-1">
          ${a.author_name || "Unknown"} • ${new Date(
        a.created_at
      ).toLocaleDateString()}
        </div>
        <h3 class="article-title mb-2">${a.title}</h3>
        <p class="article-desc small text-light mb-2">${a.description || ""}</p>
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-warning edit-btn" data-id="${
            a.id
          }">
            <i class="fa-solid fa-pen"></i> Sửa
          </button>
          <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${
            a.id
          }">
            <i class="fa-solid fa-trash"></i> Xóa
          </button>
        </div>
      </div>
      <img class="article-image ms-3" src="${
        a.image_url || "default.jpg"
      }" alt="Article image"
           style="width:120px; height:80px; object-fit:cover; border-radius:5px;">
    </article>
  `
    )
    .join("");

  attachArticleActions();
}

/* -------------------- Attach Edit, Delete & View events -------------------- */
function attachArticleActions() {
  const editBtns = document.querySelectorAll(".edit-btn");
  const deleteBtns = document.querySelectorAll(".delete-btn");
  const articleItems = document.querySelectorAll(".article");

  // Sửa bài
  editBtns.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation(); // Không lan ra ngoài
      const id = btn.dataset.id;
      const newTitle = prompt("Nhập tiêu đề mới cho bài viết:");
      if (!newTitle) return;
      await updateArticle(id, newTitle);
    });
  });

  // Xóa bài
  deleteBtns.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation(); // Không lan ra ngoài
      const id = btn.dataset.id;
      if (confirm("Bạn có chắc muốn xóa bài viết này?")) {
        await deleteArticle(id);
      }
    });
  });

  // Click vào bài để xem chi tiết
  articleItems.forEach((article) => {
    article.addEventListener("click", (e) => {
      // Ngăn khi click vào nút bên trong
      if (e.target.closest(".edit-btn") || e.target.closest(".delete-btn")) return;
      const articleId = article.dataset.id;
      window.location.href = `articledetail.html?id=${articleId}`;
    });
  });
}

/* -------------------- Search -------------------- */
function setupSearch() {
  const searchInput = document.getElementById("search");
  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    const keyword = searchInput.value.trim().toLowerCase();
    if (!keyword) {
      renderAdminArticles(allArticlesCache);
      return;
    }

    const filtered = allArticlesCache.filter(
      (a) =>
        a.title.toLowerCase().includes(keyword) ||
        (a.description && a.description.toLowerCase().includes(keyword)) ||
        (a.author_name && a.author_name.toLowerCase().includes(keyword))
    );

    renderAdminArticles(filtered);
  });
}

/* -------------------- API calls -------------------- */
async function fetchCategories() {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error("Không lấy được danh mục");
    const result = await res.json();
    return Array.isArray(result) ? result : result.data || [];
  } catch (e) {
    console.error("Categories error:", e);
    return [];
  }
}

async function fetchArticlesByCategory(id) {
  try {
    const res = await fetch(`${API_BASE}/articles/category/${id}`);
    if (!res.ok) throw new Error("Không lấy được bài báo trong danh mục");
    const result = await res.json();
    return Array.isArray(result) ? result : result.data || [];
  } catch (e) {
    console.error("Articles error:", e);
    return [];
  }
}

async function fetchAllArticles() {
  try {
    const res = await fetch(`${API_BASE}/articles`);
    if (!res.ok) throw new Error("Không lấy được bài báo");
    const result = await res.json();
    return Array.isArray(result) ? result : result.data || [];
  } catch (e) {
    console.error("Articles error:", e);
    return [];
  }
}

/* -------------------- Admin: Update Article -------------------- */
async function updateArticle(articleId, newTitle) {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API_BASE}/admin/articles/${articleId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: newTitle }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      alert(data?.message || "Cập nhật bài viết thất bại!");
      return;
    }

    alert("✅ " + (data?.message || "Cập nhật bài viết thành công!"));
    const updated = await fetchAllArticles();
    allArticlesCache = updated;
    renderAdminArticles(updated);
  } catch (e) {
    console.error("Update error:", e);
    alert("Lỗi khi cập nhật bài viết.");
  }
}

/* -------------------- Admin: Delete Article -------------------- */
async function deleteArticle(articleId) {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API_BASE}/admin/articles/${articleId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      alert(data?.message || "Xóa bài viết thất bại!");
      return;
    }

    alert("🗑️ " + (data?.message || "Xóa bài viết thành công!"));
    const updated = await fetchAllArticles();
    allArticlesCache = updated;
    renderAdminArticles(updated);
  } catch (e) {
    console.error("Delete error:", e);
    alert("Không thể xóa bài viết.");
  }
}

/* -------------------- Init -------------------- */
async function initAdminPage() {
  const categories = await fetchCategories();
  renderCategories(categories);

  const allArticles = await fetchAllArticles();
  allArticlesCache = allArticles;
  renderAdminArticles(allArticles);

  setupSearch();
}

/* -------------------- DOMContentLoaded -------------------- */
document.addEventListener("DOMContentLoaded", initAdminPage);
