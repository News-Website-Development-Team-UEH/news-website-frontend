document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll(".nav__link");
  const articleSection = document.querySelector(".articles-section");
  const categoriesNav = document.querySelector(".categories__nav");
  const profilesContainer = document.querySelector(".profiles-container");
  const accountsContainer = document.querySelector(".acounts-container");
  const categoriesContainer = document.querySelector(".categories-container");

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      // Gỡ active tất cả link
      navLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");

      // === Trang chủ ===
      if (link.textContent.includes("Trang chủ")) {
        articleSection.style.display = "block";
        categoriesNav.style.display = "flex";
        profilesContainer.style.display = "none";
        accountsContainer.style.display = "none";
        categoriesContainer.style.display = "none";
      }

      // === Kiểm duyệt tác giả ===
      else if (link.textContent.includes("Kiểm duyệt")) {
        profilesContainer.style.display = "block";
        articleSection.style.display = "none";
        categoriesNav.style.display = "none";
        accountsContainer.style.display = "none";
        categoriesContainer.style.display = "none";

        if (typeof fetchAuthorRequests === "function") {
          fetchAuthorRequests();
        }
      }

      // === Quản lý tài khoản ===
      else if (link.textContent.includes("Quản lý tài khoản")) {
        articleSection.style.display = "none";
        categoriesNav.style.display = "none";
        profilesContainer.style.display = "none";
        accountsContainer.style.display = "block";
        categoriesContainer.style.display = "none";

        if (typeof loadUsers === "function") {
          loadUsers("reader");
        }
      }

      // === Quản lý danh mục ===
      else if (link.textContent.includes("Quản lý danh mục")) {
        articleSection.style.display = "none";
        categoriesNav.style.display = "none";
        profilesContainer.style.display = "none";
        accountsContainer.style.display = "none";
        categoriesContainer.style.display = "block";

        // Gọi hàm loadCategories nếu có
        if (typeof loadAdminCategories === "function") {
          loadAdminCategories();
        }
      }
    });
  });

  // --- Đăng xuất ---
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("token");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("user");
      window.location.href = "formlogin.html";
    });
  }

  // --- Mặc định khi load trang ---
  if (articleSection) articleSection.style.display = "block";
  if (categoriesNav) categoriesNav.style.display = "flex";
  if (profilesContainer) profilesContainer.style.display = "none";
  if (accountsContainer) accountsContainer.style.display = "none";
  if (categoriesContainer) categoriesContainer.style.display = "none";
});
