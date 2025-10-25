/* -------------------- Helper -------------------- */
const q = (id) => document.getElementById(id);
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

/* -------------------- Render -------------------- */
function renderCategories(cats) {
  const el = q("categoriesList");
  if (!el) return;
  el.innerHTML = cats
    .map(
      (c) =>
        `<a href="formcategory.html?id=${c.id}" class="nav-link">${c.name}</a>`
    )
    .join("");
}

function renderArticle(a) {
  if (q("pageTitle")) q("pageTitle").textContent = `TheGRID - ${a.title}`;
  if (q("metaDescription"))
    q("metaDescription").setAttribute("content", a.description || "");
  if (q("title")) q("title").textContent = a.title || "";
  if (q("article_excerpt"))
    q("article_excerpt").textContent = a.description || "";
  if (q("author_id")) q("author_id").textContent = a.author_name || "Unknown";
  if (q("created_at")) q("created_at").textContent = fmtDate(a.created_at);

  // Format nội dung xuống dòng
  if (q("content"))
    q("content").innerHTML = a.content
      ? a.content
          .split(/\n+/)
          .map((p) => `<p>${p}</p>`)
          .join("")
      : "";

  if (q("article_image"))
    q("article_image").src =
      a.image_url || "https://via.placeholder.com/800x400";

  let catHtml = a.main_category_name
    ? `<a href="formcategory.html?id=${a.main_category_id}" class="category-tag">${a.main_category_name}</a>`
    : "";
  if (Array.isArray(a.sub_categories) && a.sub_categories.length) {
    catHtml += a.sub_categories
      .map(
        (c) =>
          `<a href="formcategory.html?id=${c.id}" class="category-tag">${c.name}</a>`
      )
      .join("");
  }
  if (q("category_id")) q("category_id").innerHTML = catHtml;
}

function renderRelated(articles, currentId) {
  const el = q("relatedArticlesContainer");
  if (!el) return;
  el.innerHTML = articles
    .filter((a) => a.id !== currentId)
    .slice(0, 5)
    .map(
      (a) => `
        <a href="formarticle.html?id=${a.id}" class="related-article">
            <img src="${
              a.image_url || "https://via.placeholder.com/80"
            }" alt="${
        a.title
      }" style="width:80px;height:80px;object-fit:cover;border-radius:4px;">
            <div class="related-content"><h4 class="related-title">${
              a.title
            }</h4></div>
        </a>
    `
    )
    .join("");
}

function renderComments(cs) {
  const box = q("commentsContainer"),
    title = q("commentsTitle");
  if (!box || !title) return;

  title.textContent = `Bình luận (${cs.length})`;

  if (cs.length === 0) {
    box.innerHTML = `<p style="color:#999;">Chưa có bình luận nào. Hãy là người đầu tiên!</p>`;
    return;
  }

  box.innerHTML = cs
    .map((c) => {
      const displayName = c.full_name || c.username || "Người dùng ẩn danh";
      const time = new Date(c.created_at).toLocaleString("vi-VN");

      return `
        <div class="comment-item">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span style="color:#ff4500; font-weight:700;">${displayName}</span>
                <span style="font-size:12px; color:#aaa;">${time}</span>
            </div>
            <div class="comment-content">${c.content}</div>
        </div>
    `;
    })
    .join("");
}

function showError(msg) {
  if (q("title")) q("title").textContent = "Error";
  if (q("content"))
    q("content").innerHTML = `<p class="text-danger">${msg}</p>`;
}

/* -------------------- API -------------------- */
async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}
const getArticle = (id) =>
  fetchJson(`${API_BASE}/articles/${id}`).then((r) => r.data || r);
const getCats = () =>
  fetchJson(`${API_BASE}/categories`).then((r) =>
    Array.isArray(r) ? r : r.data || []
  );
const getRelated = (id) =>
  fetchJson(`${API_BASE}/articles/category/${id}`).then((r) =>
    Array.isArray(r) ? r : r.data || []
  );
const getComments = (id) =>
  fetchJson(`${API_BASE}/articles/${id}/comments`).then((r) =>
    Array.isArray(r) ? r : r.data || []
  );
async function postComment(articleId, content) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ articleId, content }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Comment API error:", res.status, errorText);
    throw new Error("Comment API failed");
  }

  return res.json();
}

/* -------------------- Logic chính -------------------- */
function getArticleId() {
  const id = new URLSearchParams(location.search).get("id");
  return id ? parseInt(id, 10) : null;
}

async function loadDetails() {
  const id = getArticleId();
  if (!id) return showError("Thiếu ID bài viết (?id=1)");

  try {
    const article = await getArticle(id);
    renderArticle(article);
    renderCategories(await getCats());
    renderRelated(await getRelated(article.main_category_id), id);
    renderComments(await getComments(id));

    // thêm nút tóm tắt thủ công
    const contentDiv = q("content");
    if (contentDiv) {
      const btn = document.createElement("button");
      btn.textContent = "Tóm tắt bài viết";
      btn.style.cssText = `
    background:#ff4500;
    color:#fff;
    border:none;
    padding:10px 16px;
    border-radius:6px;
    cursor:pointer;
    font-weight:bold;
    margin-top:20px;
    display:block;
  `;
      contentDiv.insertAdjacentElement("beforebegin", btn);

      btn.addEventListener("click", async () => {
        if (!article.id) return alert("ID bài viết không hợp lệ.");

        btn.disabled = true;
        btn.textContent = "Đang tóm tắt...";

        const summary = await summarizeArticle(article.id);

        const summaryBox = document.createElement("div");
        summaryBox.style.cssText = `
    background:#1a1a1a;
    padding:15px;
    border-left:4px solid #ff4500;
    margin-top:30px;
    border-radius:6px;
    color:#ccc;
  `;
        summaryBox.innerHTML = `<h4 style="color:#ff4500;margin-bottom:8px;">Tóm tắt bài viết</h4><p>${summary}</p>`;
        q("content")?.insertAdjacentElement("beforebegin", summaryBox);

        btn.remove();
      });
    }
  } catch {
    showError("Không thể tải bài viết.");
  }
}

/* -------------------- Bình luận -------------------- */
function initCommentEvents() {
  const btnComment = q("commentButton");
  const btnSubmit = q("submitComment");
  const btnCancel = q("cancelComment");
  const input = q("commentContent");
  const form = q("commentForm");

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Nếu chưa đăng nhập thì ẩn form và yêu cầu đăng nhập
  if (!token || !user.id) {
    if (btnComment) {
      btnComment.addEventListener("click", () => {
        alert("Vui lòng đăng nhập để bình luận bài viết này!");
        window.location.href = "formlogin.html";
      });
    }
    if (form) form.style.display = "none";
    return; // Dừng hoàn toàn các sự kiện bình luận
  }

  // --- Người đã đăng nhập ---
  btnComment?.addEventListener("click", () => {
    if (form) form.style.display = "block";
  });

  btnCancel?.addEventListener("click", () => {
    if (form) form.style.display = "none";
    if (input) input.value = "";
  });

  btnSubmit?.addEventListener("click", async () => {
    if (!input || !input.value.trim())
      return alert("Nội dung bình luận không được để trống.");

    try {
      const r = await postComment(getArticleId(), input.value.trim());
      alert(r.message || "Đã gửi bình luận!");

      if (form) form.style.display = "none";
      if (input) input.value = "";

      if (r.data && r.data.status === "approved") {
        const comments = await getComments(getArticleId());
        renderComments(comments);
      }
    } catch (err) {
      console.error(err);
      alert("Gửi bình luận lỗi. Vui lòng thử lại.");
    }
  });
}

/* -------------------- Khởi tạo -------------------- */
document.addEventListener("DOMContentLoaded", () => {
  loadDetails();
  initCommentEvents();
});

// Gọi AI để tóm tắt bài viết
async function summarizeArticle(articleId) {
  try {
    const res = await fetch(`${API_BASE}/ai/summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId }),
    });
    if (!res.ok) throw new Error("Tóm tắt thất bại");
    const data = await res.json();
    return data.summary || "Không thể tạo tóm tắt.";
  } catch (err) {
    console.error("AI summary error:", err);
    return "Không thể tạo tóm tắt.";
  }
}

// Hiển thị tóm tắt AI trong giao diện
async function showSummary(article) {
  const contentText = article.content?.replace(/<[^>]*>/g, " ") || "";
  if (contentText.length < 50) return; // bài quá ngắn thì bỏ qua

  const summary = await summarizeArticle(article.id);
  const summaryBox = document.createElement("div");
  summaryBox.style.background = "#1a1a1a";
  summaryBox.style.padding = "15px";
  summaryBox.style.borderLeft = "4px solid #ff4500";
  summaryBox.style.marginTop = "30px";
  summaryBox.style.borderRadius = "6px";
  summaryBox.innerHTML = `<h4 style="color:#ff4500; margin-bottom:8px;">Tóm tắt bằng AI </h4><p style="color:#ccc;">${summary}</p>`;

  const contentDiv = q("content");
  if (contentDiv) contentDiv.insertAdjacentElement("beforebegin", summaryBox);
}
