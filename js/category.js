/* -------------------- Render Categories -------------------- */
function renderCategories(categories) {
    const container = document.getElementById("categoriesList");
    if (!container) return;

    if (!Array.isArray(categories) || categories.length === 0) {
        container.innerHTML = "<span>No categories available</span>";
        return;
    }

    container.innerHTML = categories.map(c => `
        <a href="formcategory.html?id=${c.id}" class="nav-link">${c.name}</a>
    `).join("");
}

/* -------------------- Render Category Info -------------------- */
async function renderCategoryInfo(category) {
  const heroTitle = document.querySelector(".hero-title");
  const followBtn = document.getElementById("btnFollowCategory");
  const topicDescription = document.querySelector(".topic-description");

  if (!heroTitle) return;

  // --- Đổ dữ liệu tiêu đề & mô tả ---
  heroTitle.textContent = category?.name || "Chủ đề";
  if (topicDescription)
    topicDescription.textContent =
      category?.description || "Chưa có mô tả cho chủ đề này.";

  // --- Xử lý nút Theo dõi ---
  if (followBtn) {
    // Cập nhật giao diện nút
    followBtn.className =
      "btn btn-outline-danger rounded-pill px-3 py-1 fw-bold";
    followBtn.innerHTML = `<span style="font-size:18px;">+</span> Theo dõi`;

    const token = localStorage.getItem("token");

    // Nếu chưa đăng nhập
    if (!token) {
      followBtn.onclick = () =>
        alert("Vui lòng đăng nhập để theo dõi chủ đề!");
      return;
    }

    try {
      // Kiểm tra trạng thái theo dõi
      const res = await fetch(`${API_BASE}/reader/followed-categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { categories } = await res.json();
      const isFollowed =
        Array.isArray(categories) &&
        categories.includes(Number(category.id));

      // Cập nhật trạng thái ban đầu
      if (isFollowed) {
        followBtn.classList.replace("btn-outline-danger", "btn-danger");
        followBtn.textContent = "✓ Đang theo dõi";
      }

      // Xử lý khi click
      followBtn.onclick = async () => {
        const endpoint = isFollowed
          ? `${API_BASE}/reader/unfollow-category`
          : `${API_BASE}/reader/follow-category`;

        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ categoryId: category.id }),
        });

        if (!res.ok) {
          alert("Lỗi khi cập nhật theo dõi!");
          return;
        }

        // Toggle trạng thái ngay lập tức
        if (isFollowed) {
          followBtn.classList.replace("btn-danger", "btn-outline-danger");
          followBtn.innerHTML = `<span style="font-size:18px;">+</span> Theo dõi`;
        } else {
          followBtn.classList.replace("btn-outline-danger", "btn-danger");
          followBtn.textContent = "✓ Đang theo dõi";
        }
      };
    } catch (err) {
      console.error("Follow check error:", err);
    }
  }

  // --- Cập nhật tiêu đề trang ---
  document.title = category?.name
    ? `TheGRID - ${category.name}`
    : `TheGRID - Category`;
}

/* -------------------- Render Articles in Category -------------------- */
function renderArticles(articles) {
    const createClickHandler = (articleId) => () => {
        window.location.href = `formarticle.html?id=${articleId}`;
    };

    // featured articles (2 cái đầu)
    const featured = document.querySelectorAll(".featured-article-large");
    articles.slice(0, 2).forEach((a, i) => {
        if (featured[i]) {
            featured[i].querySelector(".featured-title-large").textContent = a.title;
            featured[i].querySelector(".featured-excerpt").textContent = a.description || "";
            featured[i].querySelector(".featured-meta").textContent = `${a.author_name || "Unknown"} • ${new Date(a.created_at).toLocaleDateString()}`;
            const imgEl = featured[i].querySelector("img");
            if (imgEl) imgEl.src = a.image_url || "default.jpg";
            featured[i].onclick = createClickHandler(a.id);
            featured[i].style.cursor = 'pointer';
        }   
    });

    // small articles (3 cái)
    const smallArticles = document.querySelectorAll(".small-article");
    articles.slice(2, 5).forEach((a, i) => {
        if (smallArticles[i]) {
            smallArticles[i].querySelector(".small-article-title").textContent = a.title;
            smallArticles[i].querySelector(".small-article-meta").textContent = `${a.author_name || "Unknown"} • ${new Date(a.created_at).toLocaleDateString()}`;
            const imgEl = smallArticles[i].querySelector("img");
            if (imgEl) imgEl.src = a.image_url || "default.jpg";
            smallArticles[i].onclick = createClickHandler(a.id);
            smallArticles[i].style.cursor = 'pointer';
        }
    });

    // large featured in middle
    const largeFeatured = document.querySelector(".large-featured");
    if (largeFeatured && articles[5]) {
        largeFeatured.querySelector(".large-featured-title").textContent = articles[5].title;
        largeFeatured.querySelector(".featured-excerpt").textContent = articles[5].description || "";
        largeFeatured.querySelector(".featured-meta").textContent = `${articles[5].author_name || "Unknown"} • ${new Date(articles[5].created_at).toLocaleDateString()}`;
        const imgEl = largeFeatured.querySelector("img");
        if (imgEl) imgEl.src = articles[5].image_url || "default.jpg";
        largeFeatured.onclick = createClickHandler(articles[5].id);
        largeFeatured.style.cursor = 'pointer';
    }

    // final small (2 cái)
    const finalSmall = document.querySelectorAll(".final-articles-section .small-article");
    articles.slice(6, 8).forEach((a, i) => {
        if (finalSmall[i]) {
            finalSmall[i].querySelector(".small-article-title").textContent = a.title;
            finalSmall[i].querySelector(".small-article-meta").textContent = `${a.author_name || "Unknown"} • ${new Date(a.created_at).toLocaleDateString()}`;
            const imgEl = finalSmall[i].querySelector("img");
            if (imgEl) imgEl.src = a.image_url || "default.jpg";
            finalSmall[i].onclick = createClickHandler(a.id);
            finalSmall[i].style.cursor = 'pointer';
        }
    });

    // sidebar popular (5 bài)
    const popular = document.querySelectorAll(".popular-item");
    articles.slice(0, 5).forEach((a, i) => {
        if (popular[i]) {
            popular[i].querySelector(".popular-number").textContent = i + 1;
            popular[i].querySelector(".popular-title").textContent = a.title;
            popular[i].querySelector(".popular-meta").textContent = `${a.author_name || "Unknown"} • ${new Date(a.created_at).toLocaleDateString()}`;
            const imgEl = popular[i].querySelector("img");
            if (imgEl) imgEl.src = a.image_url || "default.jpg";
            popular[i].onclick = createClickHandler(a.id);
            popular[i].style.cursor = 'pointer';
        }
    });
}


/* -------------------- API calls -------------------- */
async function fetchCategories() {
    try {
        const res = await fetch(`${API_BASE}/categories`);
        if (!res.ok) throw new Error("Không lấy được categories");
        const data = await res.json();
        return Array.isArray(data) ? data : data.data || [];
    } catch (e) {
        console.error("Categories error:", e);
        return [];
    }
}

async function fetchCategoryById(id) {
    try {
        const categories = await fetchCategories();
        return categories.find(c => c.id == id) || null;
    } catch (e) {
        console.error("Category error:", e);
        return null;
    }
}

async function fetchArticlesByCategory(id) {
    try {
        const res = await fetch(`${API_BASE}/articles/category/${id}`);
        if (!res.ok) throw new Error("Không lấy được articles trong category");
        const data = await res.json();
        return Array.isArray(data) ? data : data.data || [];
    } catch (e) {
        console.error("Articles error:", e);
        return [];
    }
}


/* -------------------- Khởi chạy trang Category -------------------- */
async function initCategoryPage() {
    const categories = await fetchCategories();
    renderCategories(categories);

    const params = new URLSearchParams(window.location.search);
    const categoryId = params.get("id");

    if (categoryId) {
        const category = await fetchCategoryById(categoryId);
        if (category) {
            renderCategoryInfo(category);
        }

        const articles = await fetchArticlesByCategory(categoryId);
        if (articles.length > 0) {
            renderArticles(articles);
        } else {
            console.log("No articles found for this category.");
        }
    } else {
        document.querySelector(".hero-title").textContent = "Tất Cả Danh Mục";
    }
}

document.addEventListener("DOMContentLoaded", initCategoryPage);
