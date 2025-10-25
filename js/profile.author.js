class AuthorApplicationHandler {
  constructor() {
    // this.API_BASE = "https://news-website-deploy-iykm.onrender.com";
    this.form = document.getElementById("authorApplicationForm");
    this.statusBox = document.getElementById("authorRequestStatus");
    this.uploadBtn = document.getElementById("uploadAvatarBtn");
    this.fileInput = document.getElementById("authorAvatar");
    this.preview = document.getElementById("avatarPreview");
  }

  init() {
    if (!this.form) return;

    this.prefillFromUser();
    this.fetchApplicationStatus();

    this.form.addEventListener("submit", (e) => this.handleSubmit(e));
    this.uploadBtn?.addEventListener("click", () => this.fileInput.click());
    this.fileInput?.addEventListener("change", (e) =>
      this.previewAvatar(e.target.files[0])
    );
    document
      .getElementById("cancelAuthorFormBtn")
      ?.addEventListener("click", () => this.resetForm());
  }

  prefillFromUser() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user) return;

    const nameInput = document.getElementById("authorName");
    const emailInput = document.getElementById("authorEmail");
    const phoneInput = document.getElementById("authorPhone");

    if (nameInput && user.fullName) nameInput.value = user.fullName;
    if (emailInput && user.email) emailInput.value = user.email;
    if (phoneInput) phoneInput.value = user.phone || "";
  }

  previewAvatar(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.preview.innerHTML = `<img src="${e.target.result}" alt="Avatar" style="width:100px;height:100px;border-radius:50%;object-fit:cover;">`;
    };
    reader.readAsDataURL(file);
  }

  showMessage(message, type = "info") {
    if (!this.statusBox) return;
    this.statusBox.style.display = "block";
    this.statusBox.className = `alert alert-${type}`;
    this.statusBox.textContent = message;
    setTimeout(() => (this.statusBox.style.display = "none"), 5000);
  }

  resetForm() {
    this.form.reset();
    this.preview.innerHTML = `<span class="avatar-preview-text">Chưa có ảnh</span>`;
  }

  async fetchApplicationStatus() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${this.API_BASE}/reader/author-requests`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json().catch(() => ({}));
      if (!result.data) return;

      const request = result.data;
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      user.authorRequest = request;
      localStorage.setItem("user", JSON.stringify(user));

      if (request.status === "pending" || request.status === "approved") {
        this.showMessage(
          `Yêu cầu của bạn hiện đang: ${request.status}`,
          "info"
        );
        this.form.style.display = "none";
      }
    } catch (err) {
      console.error("fetchApplicationStatus error:", err);
    }
  }

  async handleSubmit(e) {
    e.preventDefault();

    const reason = document.getElementById("authorBio").value.trim();
    if (!reason)
      return this.showMessage("Vui lòng nhập mô tả bản thân.", "warning");

    const token = localStorage.getItem("token");
    if (!token) {
      return this.showMessage(
        "Vui lòng đăng nhập trước khi gửi yêu cầu.",
        "danger"
      );
    }

    const submitBtn = this.form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Đang gửi...";

    try {
      const response = await fetch(`${this.API_BASE}/reader/author-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gửi yêu cầu thất bại.");
      }

      this.showMessage(
        result.message || "Đã gửi yêu cầu thành công!",
        "success"
      );
      this.resetForm();
    } catch (err) {
      this.showMessage(err.message || "Lỗi kết nối đến máy chủ.", "danger");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "ĐĂNG KÝ TRỞ THÀNH TÁC GIẢ";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const handler = new AuthorApplicationHandler();
  handler.init();
});

class AuthorInfoHandler {
  constructor(userService) {
    this.userService = userService;
    // this.API_BASE = "https://news-website-deploy-iykm.onrender.com";
    this.currentPage = 1;
    this.articlesPerPage = 10;
  }

  init() {
    this.bindEvents();
    this.loadAuthorInfo();
    this.loadAuthorArticles();
  }

  bindEvents() {
    // Giữ lại các nút tạo bài viết
    const createArticleBtn = document.getElementById("createArticleBtn");
    const createFirstArticleBtn = document.getElementById(
      "createFirstArticleBtn"
    );

    if (createArticleBtn)
      createArticleBtn.addEventListener("click", () => {
        window.location.href = "formcreatearticle.html";
      });

    if (createFirstArticleBtn)
      createFirstArticleBtn.addEventListener("click", () => {
        window.location.href = "formcreatearticle.html";
      });
  }

  async loadAuthorInfo() {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      if (user && user.role === "author") {
        this.displayAuthorInfo({
          name: user.fullName || user.username || "Tác giả",
          position: "Tác giả TheGRID",
          bio: user.bio || "Thành viên của cộng đồng TheGRID",
          avatar: user.avatar || null,
          github: user.github || null,
          facebook: user.facebook || null,
        });
      }
    } catch (error) {
      this.showError("Không thể tải thông tin tác giả");
    }
  }

  async loadAuthorArticles() {
    const loadingEl = document.getElementById("articlesLoading");
    const noArticlesEl = document.getElementById("noArticlesState");
    const articlesListEl = document.getElementById("authorArticlesList");

    if (loadingEl) loadingEl.style.display = "block";
    if (noArticlesEl) noArticlesEl.style.display = "none";
    if (articlesListEl) articlesListEl.style.display = "none";

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const token =
        localStorage.getItem("token") || localStorage.getItem("authorToken");

      if (!user?.id) {
        throw new Error("Không tìm thấy ID tác giả trong localStorage");
      }

      const response = await fetch(
        `${this.API_BASE}/author/${user.id}/articles?page=${this.currentPage}&limit=${this.articlesPerPage}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Không thể tải danh sách bài viết");

      const data = await response.json();
      const articles = data.data || [];

      if (loadingEl) loadingEl.style.display = "none";

      if (articles.length > 0) {
        // Có bài viết → hiển thị danh sách
        if (noArticlesEl) noArticlesEl.style.display = "none";
        if (articlesListEl) {
          articlesListEl.style.display = "block";
          this.displayArticlesList(articles);
        }
      } else {
        // Không có bài viết → hiển thị trạng thái trống
        if (articlesListEl) articlesListEl.style.display = "none";
        if (noArticlesEl) {
          noArticlesEl.innerHTML = `
          <div style="text-align:center;padding:40px;">
            <p style="color:#999;margin-bottom:20px;">Bạn chưa có bài viết nào.</p>
            <button id="createFirstArticleBtn" 
              style="padding:10px 20px;border:none;border-radius:6px;
                     background:#ff4500;color:#fff;font-weight:600;cursor:pointer;">
              Viết bài ngay
            </button>
          </div>
        `;
          noArticlesEl.style.display = "block";

          // Gắn lại sự kiện cho nút vừa tạo
          const btn = document.getElementById("createFirstArticleBtn");
          if (btn) {
            btn.addEventListener("click", () => {
              window.location.href = "formcreatearticle.html";
            });
          }
        }
      }
    } catch (error) {
      if (loadingEl) loadingEl.style.display = "none";
      if (noArticlesEl) noArticlesEl.style.display = "block";
      console.error("Lỗi tải bài viết tác giả:", error);
    }
  }

  displayArticlesList(articles) {
    const articlesListEl = document.getElementById("authorArticlesList");
    if (!articlesListEl) return;

    const articlesHTML = articles
      .map((article) => {
        const title = article.title || "Tiêu đề chưa cập nhật";
        const excerpt = article.description || "Chưa có mô tả";
        const thumbnail = article.image_url || "";
        const publishedDate = article.created_at
          ? new Date(article.created_at).toLocaleDateString("vi-VN")
          : "Chưa có ngày";

        const statusText = this.getStatusText(article.status);
        const statusClass = this.getStatusClass(article.status);

        return `
  <div class="article-item" data-id="${article.id}"
       style="background:#1a1a1a;padding:20px;border-radius:8px;margin-bottom:20px;display:flex;gap:20px;cursor:pointer;">
    <div class="article-thumbnail" style="width:120px;height:80px;background:#333;border-radius:4px;overflow:hidden;position:relative;">
      ${
        thumbnail
          ? `<img src="${thumbnail}" alt="${title}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
             <div style="width:100%;height:100%;display:none;align-items:center;justify-content:center;color:#666;">Không có ảnh</div>`
          : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#666;">Không có ảnh</div>`
      }
    </div>
    <div class="article-content" style="flex:1;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
        <h4 style="color:#fff;font-size:16px;font-weight:600;margin:0;">${title}</h4>
        <span class="article-status ${statusClass}" style="padding:4px 8px;border-radius:12px;font-size:12px;">${statusText}</span>
      </div>
      <p style="color:#999;font-size:14px;margin:0 0 10px;">${excerpt}</p>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="color:#666;font-size:12px;"><i class="bi bi-calendar"></i> ${publishedDate}</span>
        <div style="display:flex;gap:10px;">
          <button class="btn-edit-article" data-id="${article.id}" 
                  style="padding:6px 12px;border:1px solid #ff4500;color:#ff4500;border-radius:4px;background:transparent;">
            Chỉnh sửa
          </button>
          <button class="btn-delete-article" data-id="${article.id}" 
                  style="padding:6px 12px;border:1px solid #dc3545;color:#dc3545;border-radius:4px;background:transparent;">
            Xóa
          </button>
        </div>
      </div>
    </div>
  </div>`;
      })
      .join("");

    articlesListEl.innerHTML = articlesHTML;
    this.bindArticleEvents();
  }

  bindArticleEvents() {
    // Sự kiện chỉnh sửa
    document.querySelectorAll(".btn-edit-article").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation(); // Ngăn click lan ra ngoài
        const articleId = e.target.dataset.id;
        window.location.href = `formcreatearticle.html?edit=${articleId}`;
      });
    });

    // Sự kiện click xem chi tiết
    document.querySelectorAll(".article-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        // Ngăn việc click vào nút bên trong cũng kích hoạt xem chi tiết
        if (
          e.target.closest(".btn-edit-article") ||
          e.target.closest(".btn-delete-article")
        )
          return;
        const articleId = item.dataset.id;
        window.location.href = `articledetail.html?id=${articleId}`;
      });
    });

    // Sự kiện XÓA bài viết
    document.querySelectorAll(".btn-delete-article").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const articleId = e.target.dataset.id;
        const confirmDelete = confirm(
          "Bạn có chắc chắn muốn xóa bài viết này không?"
        );

        if (!confirmDelete) return;

        const token =
          localStorage.getItem("token") || localStorage.getItem("authorToken");

        try {
          const response = await fetch(
            `${this.API_BASE}/author/articles/${articleId}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.ok) {
            alert("🗑️ Bài viết đã được xóa thành công!");
            // Xóa phần tử khỏi giao diện mà không cần reload toàn trang
            const articleEl = document.querySelector(
              `.article-item[data-id="${articleId}"]`
            );
            if (articleEl) articleEl.remove();

            // Nếu sau khi xóa không còn bài viết nào → reload danh sách
            const remaining = document.querySelectorAll(".article-item").length;
            if (remaining === 0) {
              this.loadAuthorArticles();
            }
          } else {
            const err = await response.json();
            console.error("Lỗi xóa:", err);
            alert("Không thể xóa bài viết. Vui lòng thử lại!");
          }
        } catch (error) {
          console.error("Lỗi khi gửi yêu cầu xóa:", error);
          alert("Có lỗi khi kết nối đến server!");
        }
      });
    });

    // Sự kiện CHỈNH SỬA bài viết trực tiếp
    document.querySelectorAll(".btn-edit-article").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const articleId = e.target.dataset.id;

        const newTitle = prompt("📝 Nhập tiêu đề mới cho bài viết:");
        if (!newTitle) return;

        const token =
          localStorage.getItem("token") || localStorage.getItem("authorToken");

        try {
          const response = await fetch(
            `${this.API_BASE}/author/articles/${articleId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ title: newTitle }),
            }
          );

          const data = await response.json().catch(() => null);

          if (!response.ok) {
            alert(data?.message || "❌ Không thể cập nhật bài viết!");
            return;
          }

          alert("Cập nhật bài viết thành công!");
          this.loadAuthorArticles(); 
        } catch (error) {
          console.error("Lỗi khi cập nhật:", error);
          alert("Có lỗi khi kết nối đến server!");
        }
      });
    });
  }

  getStatusText(status) {
    const map = {
      draft: "Bản nháp",
      pending: "Chờ duyệt",
      published: "Đã đăng",
      rejected: "Bị từ chối",
    };
    return map[status] || "Không xác định";
  }

  getStatusClass(status) {
    const map = {
      draft: "status-draft",
      pending: "status-pending",
      published: "status-published",
      rejected: "status-rejected",
    };
    return map[status] || "status-default";
  }

  showMessage(message, type = "danger") {
    const messageDiv = document.getElementById("message");
    if (messageDiv) {
      messageDiv.textContent = message;
      messageDiv.className = `alert alert-${type} show`;
      setTimeout(() => messageDiv.classList.remove("show"), 4000);
    }
  }

  showError(message) {
    this.showMessage(message, "danger");
  }
  showSuccess(message) {
    this.showMessage(message, "success");
  }
}
