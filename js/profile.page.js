class ProfilePage {
  constructor(userService) {
    this.userService = userService;

    this.messageDiv = document.getElementById("message");
    this.sections = document.querySelectorAll(".profile-section");
    this.menuLinks = document.querySelectorAll(".menu-item");
    this.logoutLink = document.getElementById("logoutLink");
    this.greetingHeader = document.querySelector(".greeting");
    this.profileForm = document.getElementById("profileEditForm");
    this.usernameInput = document.getElementById("username");
    this.fullNameInput = document.getElementById("fullName");
    this.emailInput = document.getElementById("email");
    this.editBtnContainer = document.querySelector(".button-group");
    this.originalProfileData = {};
  }

  async init() {
    await this.checkAndUpdateUserRole();
    this.setupMenuBasedOnRole();
    this.loadProfile();
    this.bindEvents();
    this.showSection("profileSection");
  }

  async checkAndUpdateUserRole() {
    return;
  }

  setupMenuBasedOnRole() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const subscriptionLink = document.getElementById("subscriptionLink");

    if (subscriptionLink) {
      subscriptionLink.onclick = null;

      switch (user.role) {
        case "author":
          subscriptionLink.style.display = "block";
          subscriptionLink.textContent = "Thông tin tác giả";
          subscriptionLink.href = "#authorinfo";
          subscriptionLink.onclick = (e) => {
            e.preventDefault();
            this.showSection("authorinfoSection");
          };
          break;

        case "admin":
          // Quản trị viên - hiển thị nút quản lý và chuyển hướng
          subscriptionLink.style.display = "block";
          subscriptionLink.textContent = "Quản lý";
          subscriptionLink.href = "formadmin.html";
          subscriptionLink.onclick = (e) => {
            e.preventDefault();
            window.location.href = "formadmin.html";
          };
          break;

        case "reader":
        default:
          // Kiểm tra trạng thái đăng ký tác giả
          const authorRequest = user.authorRequest;

          if (authorRequest) {
            switch (authorRequest.status) {
              case "pending":
                subscriptionLink.style.display = "block";
                subscriptionLink.textContent = "Đơn đăng ký đang chờ duyệt";
                subscriptionLink.href = "#subscription";
                subscriptionLink.onclick = (e) => {
                  e.preventDefault();
                  this.showSection("subscriptionSection");
                };
                break;

              case "rejected":
                subscriptionLink.style.display = "block";
                subscriptionLink.textContent = "Đăng ký lại tác giả";
                subscriptionLink.href = "#subscription";
                subscriptionLink.onclick = (e) => {
                  e.preventDefault();
                  this.showSection("subscriptionSection");
                };
                break;

              case "approved":
                subscriptionLink.style.display = "block";
                subscriptionLink.textContent = "Đăng ký đã được duyệt";
                subscriptionLink.href = "authorprofile.html";
                subscriptionLink.onclick = null;
                break;

              default:
                subscriptionLink.style.display = "block";
                subscriptionLink.textContent = "Đăng ký trở thành tác giả";
                subscriptionLink.href = "#subscription";
                subscriptionLink.onclick = (e) => {
                  e.preventDefault();
                  this.showSection("subscriptionSection");
                };
                break;
            }
          } else {
            // Chưa có đơn đăng ký nào
            subscriptionLink.style.display = "block";
            subscriptionLink.textContent = "Đăng ký trở thành tác giả";
            subscriptionLink.href = "#subscription";
            subscriptionLink.onclick = (e) => {
              e.preventDefault();
              this.showSection("subscriptionSection");
            };
          }
          break;
      }
    }
  }

  showMessage(text, type = "danger") {
    this.messageDiv.textContent = text;
    this.messageDiv.className = `alert alert-${type} show`;
    setTimeout(() => {
      this.messageDiv.classList.remove("show");
    }, 4000);
  }

  showSection(sectionId) {
    this.sections.forEach((section) => (section.style.display = "none"));
    const activeSection = document.getElementById(sectionId);
    if (activeSection) activeSection.style.display = "block";

    this.menuLinks.forEach((link) => {
      link.classList.remove("active");
      // Handle special case for subscriptionLink
      if (
        sectionId === "subscriptionSection" &&
        link.id === "subscriptionLink"
      ) {
        link.classList.add("active");
      } else if (link.id === sectionId.replace("Section", "Link")) {
        link.classList.add("active");
      }
    });
  }

  async loadProfile() {
    try {
      const response = await this.userService.getProfile();
      const user = response.user;

      this.originalProfileData = {
        fullName: user.fullName || user.username || "",
        email: user.email || "",
      };

      //
      if (this.greetingHeader) {
        this.greetingHeader.textContent = `Xin chào, ${this.originalProfileData.fullName}!`;
      }
      //
      const viewUsername = document.getElementById("viewUsername");
      const viewFullName = document.getElementById("viewFullName");
      const viewEmail = document.getElementById("viewEmail");

      if (viewUsername) viewUsername.textContent = user.username || "N/A";
      if (viewFullName)
        viewFullName.textContent = this.originalProfileData.fullName;
      if (viewEmail) viewEmail.textContent = this.originalProfileData.email;
      //
      if (this.usernameInput) this.usernameInput.value = user.username || "";
      if (this.fullNameInput)
        this.fullNameInput.value = this.originalProfileData.fullName;
      if (this.emailInput)
        this.emailInput.value = this.originalProfileData.email;

      this.resetEditButton();
    } catch (err) {
      console.error(err);
      this.showMessage(
        "Không thể tải hồ sơ người dùng, vui lòng đăng nhập lại."
      );
      handleLogout();
    }
  }

  async saveProfile(e) {
    e.preventDefault();

    const updatedData = {
      username: this.usernameInput.value.trim(),
      fullName: this.fullNameInput.value.trim(),
      email: this.emailInput.value.trim(),
    };

    const currentPassword = document
      .getElementById("currentPassword")
      ?.value.trim();
    const newPassword = document.getElementById("newPassword")?.value.trim();
    const confirmPassword = document
      .getElementById("confirmPassword")
      ?.value.trim();

    // Nếu người dùng muốn đổi mật khẩu
    if (newPassword || confirmPassword || currentPassword) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        this.showMessage("Vui lòng nhập đủ 3 ô mật khẩu để đổi mật khẩu");
        return;
      }
      if (newPassword !== confirmPassword) {
        this.showMessage("Mật khẩu xác nhận không trùng khớp");
        return;
      }
      updatedData.currentPassword = currentPassword;
      updatedData.newPassword = newPassword;
    }

    try {
      const res = await this.userService.updateProfile(updatedData);
      this.showMessage(res.message || "Cập nhật hồ sơ thành công!", "success");

      this.originalProfileData = {
        username: updatedData.username,
        fullName: updatedData.fullName,
        email: updatedData.email,
      };

      // Cập nhật hiển thị
      this.greetingHeader.textContent = `Xin chào, ${updatedData.fullName}!`;
      document.getElementById("viewUsername").textContent =
        updatedData.username;
      document.getElementById("viewFullName").textContent =
        updatedData.fullName;
      document.getElementById("viewEmail").textContent = updatedData.email;

      // Xóa nội dung ô mật khẩu sau khi cập nhật
      if (document.getElementById("currentPassword"))
        document.getElementById("currentPassword").value = "";
      if (document.getElementById("newPassword"))
        document.getElementById("newPassword").value = "";
      if (document.getElementById("confirmPassword"))
        document.getElementById("confirmPassword").value = "";

      this.disableEditMode();
    } catch (err) {
      console.error(err);
      this.showMessage(
        err.message || "Không thể lưu hồ sơ, vui lòng thử lại sau"
      );
    }
  }

  // Password change functionality removed for Google login

  // Sửa hồ sơ
  enableEditMode() {
    // Hide view mode and show edit form
    const profileView = document.getElementById("profileView");
    const profileEditForm = document.getElementById("profileEditForm");

    if (profileView) profileView.style.display = "none";
    if (profileEditForm) profileEditForm.style.display = "block";

    if (this.fullNameInput) this.fullNameInput.readOnly = false;
    if (this.emailInput) this.emailInput.readOnly = false;
  }

  disableEditMode() {
    // Show view mode and hide edit form
    const profileView = document.getElementById("profileView");
    const profileEditForm = document.getElementById("profileEditForm");

    if (profileView) profileView.style.display = "block";
    if (profileEditForm) profileEditForm.style.display = "none";

    if (this.fullNameInput) {
      this.fullNameInput.readOnly = true;
      this.fullNameInput.value = this.originalProfileData.fullName;
    }
    if (this.emailInput) {
      this.emailInput.readOnly = true;
      this.emailInput.value = this.originalProfileData.email;
    }
  }

  resetEditButton() {
    const editBtn = document.getElementById("editProfileBtn");
    if (editBtn) {
      editBtn.addEventListener("click", () => this.enableEditMode());
    }
  }

  // Tải danh sách chủ đề đã theo dõi
  async loadFollowedCategories() {
    const listContainer = document.getElementById("followedCategoriesList");
    if (!listContainer) return;

    listContainer.innerHTML =
      "<p>Đang tải danh sách chủ đề bạn theo dõi...</p>";

    try {
      // --- Lấy danh sách ID chủ đề đã theo dõi ---
      const res = await fetch(
        `${this.userService.baseUrl}/reader/followed-categories`,
        {
          headers: { Authorization: `Bearer ${this.userService.token}` },
        }
      );

      if (!res.ok)
        throw new Error("Không lấy được danh sách chủ đề đã theo dõi");
      const data = await res.json();

      const categories = data.categories || [];
      if (categories.length === 0) {
        listContainer.innerHTML = "<p>Bạn chưa theo dõi chủ đề nào.</p>";
        return;
      }

      // --- Lấy toàn bộ categories để map ID -> tên ---
      const allCatsRes = await fetch(`${this.userService.baseUrl}/categories`);
      const allCatsData = await allCatsRes.json();
      const allCats = allCatsData.data || allCatsData;

      const followedCats = categories
        .map((id) => allCats.find((c) => c.id == id))
        .filter(Boolean);

      // --- Hiển thị danh sách có nút và có link ---
      listContainer.innerHTML = `
      <ul class="list-group bg-dark border-0 p-0 m-0">
        ${followedCats
          .map(
            (cat) => `
          <li class="list-group-item bg-dark text-light d-flex justify-content-between align-items-center border-0 py-2 px-3">
            <span class="category-link text-info" data-id="${cat.id}" style="cursor:pointer;">
              ${cat.name}
            </span>
            <button class="btn btn-sm btn-outline-danger unfollow-btn" data-id="${cat.id}">❌</button>
          </li>
        `
          )
          .join("")}
      </ul>
    `;

      // --- Gắn sự kiện click để mở trang chủ đề ---
      listContainer.querySelectorAll(".category-link").forEach((link) => {
        link.addEventListener("click", (e) => {
          const catId = e.target.dataset.id;
          window.location.href = `formcategory.html?id=${catId}`;
        });
      });

      // --- Gắn sự kiện cho các nút Unfollow ---
      listContainer.querySelectorAll(".unfollow-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation(); // tránh xung đột click
          const catId = e.target.dataset.id;
          try {
            const res = await fetch(
              `${this.userService.baseUrl}/reader/unfollow-category`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${this.userService.token}`,
                },
                body: JSON.stringify({ categoryId: catId }),
              }
            );

            if (!res.ok) throw new Error("Không thể hủy theo dõi chủ đề này");

            // Xóa phần tử khỏi giao diện
            e.target.closest("li").remove();

            // Nếu không còn chủ đề nào → thông báo
            if (!listContainer.querySelector("li")) {
              listContainer.innerHTML = "<p>Bạn chưa theo dõi chủ đề nào.</p>";
            }
          } catch (err) {
            console.error("Unfollow error:", err);
            alert("Có lỗi khi hủy theo dõi chủ đề này.");
          }
        });
      });
    } catch (err) {
      console.error("loadFollowedCategories error:", err);
      listContainer.innerHTML = "<p>Không thể tải danh mục theo dõi.</p>";
    }
  }

  async loadAuthorInfo() {
    try {
      // Sử dụng user data trực tiếp thay vì API không tồn tại
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      console.log("Loading author info for user:", user);

      if (user.role === "author") {
        // Hiển thị thông tin từ user data

        // Hiển thị thông tin
        const nameEl = document.getElementById("authorDisplayName");
        const positionEl = document.getElementById("authorDisplayPosition");
        const bioEl = document.getElementById("authorDisplayBio");

        if (nameEl)
          nameEl.textContent = user.fullName || user.username || "Tác giả";
        if (positionEl) positionEl.textContent = "Tác giả TheGRID";
        if (bioEl) bioEl.textContent = "Thành viên của cộng đồng TheGRID";

        // Hiển thị avatar
        const avatarImg = document.getElementById("authorAvatarDisplay");
        const avatarPlaceholder = document.getElementById(
          "authorAvatarPlaceholder"
        );

        // Hiển thị avatar mặc định
        if (avatarImg) avatarImg.style.display = "none";
        if (avatarPlaceholder) avatarPlaceholder.style.display = "flex";

        // Ẩn social links vì chưa có dữ liệu
        const githubLink = document.getElementById("authorGithubLink");
        const facebookLink = document.getElementById("authorFacebookLink");

        if (githubLink) githubLink.style.display = "none";
        if (facebookLink) facebookLink.style.display = "none";

        console.log("Author info loaded successfully");
      } else {
        console.log("User is not an author");
      }
    } catch (error) {
      console.error("Error loading author info:", error);
      // Hiển thị thông tin mặc định nếu có lỗi
      const nameEl = document.getElementById("authorDisplayName");
      const positionEl = document.getElementById("authorDisplayPosition");
      const bioEl = document.getElementById("authorDisplayBio");

      if (nameEl) nameEl.textContent = "Tác giả";
      if (positionEl) positionEl.textContent = "Tác giả TheGRID";
      if (bioEl) bioEl.textContent = "Thành viên của cộng đồng TheGRID";
    }
  }

  bindEvents() {
    this.menuLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        if (link.id !== "logoutBtn") {
          // Handle special case for subscriptionLink
          if (link.id === "subscriptionLink") {
            if (link.href.includes("#subscription")) {
              this.showSection("subscriptionSection");
            } else if (link.href.includes("#authorinfo")) {
              this.showSection("authorinfoSection");
              // Tải thông tin tác giả
              this.loadAuthorInfo();
              // Tải danh sách bài viết của tác giả
              window.authorInfoHandlerInstance?.loadAuthorArticles();
            } else if (link.href.includes("formadmin.html")) {
              // Admin - chuyển hướng đến trang quản lý
              window.location.href = "formadmin.html";
              return; // Ngăn không cho chạy các xử lý khác
            }
          } else if (link.id === "followedCategoriesLink") {
            this.showSection("followedCategoriesSection");
            this.loadFollowedCategories();
          } else {
            const sectionId = link.id.replace("Link", "Section");
            this.showSection(sectionId);
          }
        }
      });
    });

    if (this.profileForm) {
      this.profileForm.addEventListener("submit", (e) => this.saveProfile(e));
    }

    // Cancel edit button
    const cancelEditBtn = document.getElementById("cancelEditBtn");
    if (cancelEditBtn) {
      cancelEditBtn.addEventListener("click", () => this.disableEditMode());
    }

    // Save profile button
    const saveProfileBtn = document.getElementById("saveProfileBtn");
    if (saveProfileBtn) {
      saveProfileBtn.addEventListener("click", (e) => this.saveProfile(e));
    }
    // Password change functionality removed for Google login

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (confirm("Bạn có chắc muốn đăng xuất?")) handleLogout();
      });
    }
  }
}
