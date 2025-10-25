/* -------------------- Helper -------------------- */
function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function safeJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/* -------------------- Render Functions (unchanged behavior) -------------------- */
function renderTopCommented(list) {
  const container = document.getElementById("top-stories");
  if (!container) return;
  container.innerHTML = "";
  list.forEach((a, idx) => {
    const li = document.createElement("div");
    li.className = "d-flex py-3 border-bottom align-items-start";
    li.innerHTML = `
      <div class="me-3 fw-bold text-danger">${idx + 1}</div>
      <div class="flex-grow-1">
          <h6 class="mb-1">
              <a href="formarticle.html?id=${
                a.id
              }" class="text-light fw-semibold text-decoration-none">
                  ${a.title}
              </a>
          </h6>
          <div class="small text-muted">
              <span class="text-uppercase fw-bold">${
                a.author_name || "Unknown"
              }</span> • 
              <span>${new Date(a.created_at).toLocaleDateString()}</span> • 
              <i class="fa-regular fa-comment"></i> ${a.comment_count ?? 0}
          </div>
      </div>
      <div class="ms-3" style="width:80px;height:60px;flex-shrink:0;">
          <img src="${a.image_url}" alt="${a.title}" 
               style="width:100%;height:100%;object-fit:cover;border-radius:4px;">
      </div>
    `;
    container.appendChild(li);
  });
}

function renderRandomArticles(list) {
  const container = document.getElementById("article-list");
  if (!container) return;
  container.innerHTML = "";

  const limitedList = list.slice(0, 3);

  limitedList.forEach((a) => {
    const div = document.createElement("div");
    div.classList.add("article-item", "mb-4");
    div.onclick = () => {
      window.location.href = `formarticle.html?id=${a.id}`;
    };
    div.style.cursor = "pointer";
    div.innerHTML = `
      <div class="d-flex">
          <img src="${
            a.image_url
          }" class="me-3" style="width:120px;height:80px;object-fit:cover;">
          <div>
              <h5>${a.title}</h5>
              <p class="text-muted small">${a.description || ""}</p>
              <div class="meta small">
                  <span>${a.author_name || "Unknown"}</span> • 
                  <span>${new Date(a.created_at).toLocaleDateString()}</span>
              </div>
          </div>
      </div>
    `;
    container.appendChild(div);
  });
}

function renderMainArticle(article) {
  if (!article) return;
  const main = document.querySelector(".main-article");
  if (!main) return;

  main.onclick = () =>
    (window.location.href = `formarticle.html?id=${article.id}`);
  const thumb = document.querySelector(".main-thumbnail");
  if (thumb)
    thumb.innerHTML = `<img src="${article.image_url}" alt="${article.title}" class="img-fluid rounded">`;
  const titleEl = document.querySelector(".main-title");
  if (titleEl) titleEl.textContent = article.title;
  const descEl = document.querySelector(".main-desc");
  if (descEl) descEl.textContent = article.description || "";
  const authorEl = document.querySelector(".author");
  if (authorEl) authorEl.textContent = article.author_name || "Unknown";
  const timeEl = document.querySelector(".time");
  if (timeEl)
    timeEl.textContent = new Date(article.created_at).toLocaleDateString();
  const cmt = document.querySelector(".comments");
  if (cmt) {
    cmt.textContent = article.comment_count ?? 0;
    cmt.href = `formarticle.html?id=${article.id}#comments`;
  }
}

/* -------------------- Basic Fetchers -------------------- */
async function fetchArticles() {
  try {
    // Chỉ fetch và render bài viết chính
    const latestRes = await fetch(`${API_BASE}/articles/latest`);
    if (!latestRes.ok) throw new Error("Không lấy được bài mới nhất");
    const latest = await latestRes.json();
    if (latest?.data) renderMainArticle(latest.data);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

async function fetchTopCommented() {
  try {
    const res = await fetch(`${API_BASE}/articles/top-commented`);
    if (!res.ok) throw new Error("Không lấy được top commented");
    const { data } = await res.json();
    renderTopCommented(data || []);
  } catch (e) {
    console.error("Top commented error:", e);
  }
}

async function fetchRandomArticles() {
  try {
    const res = await fetch(`${API_BASE}/articles/random`);
    if (!res.ok) throw new Error("Không lấy được random articles");
    const { data } = await res.json();
    renderRandomArticles(data || []);
  } catch (e) {
    console.error("Random articles error:", e);
  }
}

/* -------------------- Header categories (existing) -------------------- */
class CategoryRenderer {
  renderCategories(categories) {
    const container = document.getElementById("categoriesList");
    if (!container) return;
    if (!Array.isArray(categories) || categories.length === 0) {
      container.innerHTML = "<span>No categories available</span>";
      return;
    }
    container.innerHTML = categories
      .map(
        (c) =>
          `<a href="formcategory.html?id=${c.id}" class="nav-link">${c.name}</a>`
      )
      .join("");
  }
}

async function fetchCategories() {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error("Không lấy được categories");
    const { data } = await res.json();
    new CategoryRenderer().renderCategories(data);
  } catch (e) {
    console.error("Categories error:", e);
  }
}

/* -------------------- Hiển thị chủ đề theo dõi -------------------- */
async function loadAllCategoriesWithFollowState() {
  const container = document.getElementById("followingCategories");
  if (!container) return;
  container.innerHTML = "<p class='text-white-50'>Đang tải danh mục...</p>";

  try {
    const token = localStorage.getItem("token");

    // Lấy toàn bộ category
    const resCat = await fetch(`${API_BASE}/categories`);
    if (!resCat.ok) throw new Error("Không lấy được danh mục");
    const { data: categories } = await resCat.json();

    // Lấy danh mục đã follow (nếu có token)
    let followedIds = [];
    if (token) {
      const resFollow = await fetch(`${API_BASE}/reader/followed-categories`, {
        headers: authHeader(),
      });
      if (resFollow.ok) {
        const json = await resFollow.json();
        followedIds = json.categories || [];
      }
    }

    // Render danh mục
    container.innerHTML = "";
    if (!categories?.length) {
      container.innerHTML = "<p class='text-white-50'>Không có chủ đề nào.</p>";
      return;
    }

    categories.forEach((cat) => {
      const isFollowed = followedIds.includes(Number(cat.id));

      const btn = document.createElement("button");
      btn.className = isFollowed
        ? "btn btn-danger rounded-pill px-3 me-2 mb-2"
        : "btn btn-outline-danger rounded-pill px-3 me-2 mb-2";
      btn.textContent = (isFollowed ? "✓ " : "+ ") + cat.name;

      btn.onclick = async () => {
        const tokenNow = localStorage.getItem("token");
        // Kiểm tra đăng nhập trước khi follow
        if (!tokenNow) {
          // Thay alert bằng modal/message box tuỳ chỉnh nếu có, hiện tại dùng alert
          alert("Vui lòng đăng nhập để theo dõi chủ đề!");
          return;
        }

        // Xác định endpoint phù hợp
        const isNowFollowed = btn.classList.contains("btn-danger");
        const endpoint = isNowFollowed
          ? `${API_BASE}/reader/unfollow-category`
          : `${API_BASE}/reader/follow-category`;

        btn.disabled = true;

        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${tokenNow}`,
            },
            body: JSON.stringify({ categoryId: cat.id }),
          });

          if (!res.ok) throw new Error("Không thể cập nhật theo dõi");

          // Toggle trạng thái
          const nowFollowed = !isNowFollowed;
          btn.classList.toggle("btn-danger", nowFollowed);
          btn.classList.toggle("btn-outline-danger", !nowFollowed);
          btn.textContent = (nowFollowed ? "✓ " : "+ ") + cat.name;

          // Cập nhật danh sách ID đã follow
          if (nowFollowed) {
            followedIds.push(cat.id);
          } else {
            followedIds = followedIds.filter((id) => id !== cat.id);
          }

          // Quyết định hiển thị nút hay bài viết
          const followingSection = document.getElementById("following-section");
          const articleFollowing = document.getElementById("article-following");

          if (followedIds.length > 0) {
            // Nếu còn ít nhất 1 follow, ẩn nút và tải lại feed
            followingSection?.classList.add("d-none");
            articleFollowing?.classList.remove("d-none");
            await loadFollowedFeed(); // Tải lại toàn bộ feed
          } else {
            // Nếu không còn follow nào, hiển thị lại các nút
            followingSection?.classList.remove("d-none");
            if (articleFollowing) {
              articleFollowing.classList.add("d-none");
              articleFollowing.innerHTML =
                "<p>Bạn chưa theo dõi chủ đề nào.</p>";
            }
          }
        } catch (err) {
          console.error("Follow toggle error:", err);
          // Thay alert bằng modal/message box tuỳ chỉnh nếu có, hiện tại dùng alert
          alert("Có lỗi xảy ra khi cập nhật theo dõi!");
        } finally {
          btn.disabled = false;
        }
      };

      container.appendChild(btn);
    });
  } catch (err) {
    console.error("Lỗi loadAllCategoriesWithFollowState:", err);
    container.innerHTML =
      "<p class='text-white-50'>Lỗi khi tải danh mục. Thử lại sau.</p>";
  }
}

/* -------------------- Tự động hiển thị bài viết theo các chủ đề đã follow -------------------- */
async function loadFollowedFeed() {
  const token = localStorage.getItem("token");
  const container = document.getElementById("article-following");
  const followingSection = document.getElementById("following-section");

  // Token đã được kiểm tra ở sự kiện click, nhưng kiểm tra lại cho chắc chắn
  if (!token) return;

  container.innerHTML = "<p class='text-white-50'>Đang tải bài viết...</p>";
  container.classList.remove("d-none");
  followingSection.classList.add("d-none"); // Tạm ẩn các nút

  try {
    const res = await fetch(`${API_BASE}/reader/followed-categories`, {
      headers: authHeader(),
    });
    if (!res.ok) throw new Error("Không lấy được danh sách follow");

    const { categories: followedIds } = await res.json();

    // Yêu cầu 2: Nếu chưa follow, hiển thị các nút
    if (!followedIds || !followedIds.length) {
      container.innerHTML = "<p>Bạn chưa theo dõi chủ đề nào.</p>";
      container.classList.add("d-none"); // Ẩn khu vực bài viết
      followingSection.classList.remove("d-none"); // Hiển thị khu vực nút
      await loadAllCategoriesWithFollowState(); // Tải các nút
      return;
    }

    // Yêu cầu 2: Nếu đã follow, ẩn nút và hiển thị bài viết
    followingSection.classList.add("d-none"); // Ẩn các nút
    container.classList.remove("d-none"); // Hiển thị khu vực bài viết
    container.innerHTML = `<h5 class="text-white mb-3">Bài viết từ các chủ đề bạn theo dõi</h5>`;

    // Lấy tên category để hiển thị (Yêu cầu 3)
    const resCat = await fetch(`${API_BASE}/categories`);
    if (!resCat.ok) throw new Error("Không lấy được danh mục");
    const { data: allCategories } = await resCat.json();
    const categoryMap = new Map(
      allCategories.map((c) => [Number(c.id), c.name])
    );

    // Lặp qua từng category và lấy bài viết
    let articlesFound = 0;
    for (const catId of followedIds) {
      const categoryName = categoryMap.get(Number(catId)) || "Chủ đề không rõ";
      // Gọi hàm append
      const count = await appendArticlesByCategory(catId, categoryName);
      articlesFound += count;
    }

    if (articlesFound === 0) {
      container.innerHTML += `<p class='text-white-50'>Chưa có bài viết nào trong các chủ đề bạn theo dõi.</p>`;
    }
  } catch (err) {
    console.error("loadFollowedFeed error:", err);
    container.innerHTML =
      "<p class='text-danger'>Không thể tải bài theo dõi.</p>";
    followingSection.classList.remove("d-none"); // Hiển thị lại nút nếu lỗi
    await loadAllCategoriesWithFollowState(); // Tải lại nút
  }
}

/* -------------------- Load bài viết và append vào container theo từng category -------------------- */
async function appendArticlesByCategory(categoryId, categoryName) {
  const container = document.getElementById("article-following");
  if (!container) return 0;

  try {
    const res = await fetch(`${API_BASE}/articles/category/${categoryId}`);
    if (!res.ok) throw new Error("Không lấy được bài viết");

    const { data } = await res.json();
    if (!data || !data.length) return 0;

    // Yêu cầu 3: Thêm tên category vào thẻ bài viết
    data.forEach((a) => {
      const div = document.createElement("div");
      div.classList.add("article-item", "mb-3");
      div.style.cursor = "pointer";
      div.innerHTML = `
        <div class="d-flex align-items-start">
          <img src="${a.image_url}" alt="${a.title}"
               style="width:120px;height:80px;object-fit:cover;" class="me-3 rounded">
          <div class="flex-grow-1">
            <small class="text-danger fw-bold d-block mb-1 text-uppercase">${categoryName}</small>
            <h6 class="mb-1 text-white">${a.title}</h6>
            <small class="text-white-50">
              ${a.author_name || "Unknown"} • ${new Date(
        a.created_at
      ).toLocaleDateString()}
            </small>
          </div>
        </div>
      `;
      div.onclick = () =>
        (window.location.href = `formarticle.html?id=${a.id}`);
      container.appendChild(div);
    });

    return data.length; // Trả về số bài viết đã thêm
  } catch (err) {
    console.error("appendArticlesByCategory error:", err);
    return 0; // Trả về 0 nếu lỗi
  }
}

/* -------------------- DOMContentLoaded: wire everything -------------------- */
document.addEventListener("DOMContentLoaded", () => {
  // Elements used by toggles/buttons
  const btnStream = document.getElementById("btn-stream");
  const btnFollowing = document.getElementById("btn-following");
  const followingSection = document.getElementById("following-section");
  const articleList = document.getElementById("article-list");
  const articleFollowing = document.getElementById("article-following");
  const authArea = document.getElementById("authArea");
  const menuToggle = document.getElementById("menuToggle");
  const mobileMenu = document.getElementById("mobileMenu");
  const categoriesList = document.getElementById("categoriesList");

  // Auth render với kiểm tra role
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (authArea) {
    if (!token || !user) {
      authArea.innerHTML = `<a href="formlogin.html" class="signin-btn">Đăng nhập</a>`;
    } else {
      const targetPage =
        user.role === "admin" ? "formadmin.html" : "formprofile.html";
      authArea.innerHTML = `<a href="${targetPage}" class="signin-btn">Tài khoản</a>`;
    }
  }

  // Stream / Following toggle
  if (btnStream && btnFollowing) {
    btnStream.addEventListener("click", () => {
      btnStream.classList.add("active", "btn-dark");
      btnFollowing.classList.remove("active", "btn-dark");
      btnFollowing.classList.add("btn-danger");
      followingSection?.classList.add("d-none");
      articleList?.classList.remove("d-none");
      articleFollowing?.classList.add("d-none");
    });

    btnFollowing.addEventListener("click", async () => {
      btnFollowing.classList.add("active", "btn-dark");
      btnStream.classList.remove("active", "btn-dark");
      btnStream.classList.add("btn-danger");

      articleList.classList.add("d-none");

      if (!token) {
        followingSection.classList.remove("d-none");
        articleFollowing.classList.add("d-none");
        articleFollowing.innerHTML =
          "<p>Vui lòng đăng nhập để xem bài theo dõi.</p>";
        await loadAllCategoriesWithFollowState();
      } else {
        await loadFollowedFeed();
      }
    });
  }

  // Mobile menu toggle
  if (menuToggle && mobileMenu && categoriesList) {
    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!mobileMenu.dataset.populated) {
        mobileMenu.innerHTML = categoriesList.innerHTML;
        mobileMenu.dataset.populated = "true";
      }
      mobileMenu.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
      if (!mobileMenu.contains(e.target) && !menuToggle.contains(e.target)) {
        mobileMenu.classList.remove("active");
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 992) mobileMenu.classList.remove("active");
    });
  }

  // initial loads
  fetchArticles();
  fetchTopCommented();
  fetchRandomArticles();
  fetchCategories();
});
