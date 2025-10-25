document.addEventListener("DOMContentLoaded", () => {
  const authArea = document.getElementById("authArea");
  const menuToggle = document.getElementById("menuToggle");
  const mobileMenu = document.getElementById("mobileMenu");
  const categoriesList = document.getElementById("categoriesList");
  if (!authArea) return;

  function renderAuth() {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (!token || !user) {
      authArea.innerHTML = `<a href="formlogin.html" class="signin-btn">Đăng nhập</a>`;
    } else {
      authArea.innerHTML = `<a href="formprofile.html" class="signin-btn">Tài khoản</a>`;
    }
  }
  // --- Menu toggle cho mobile ---
  if (menuToggle && mobileMenu && categoriesList) {
    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();

      // Chỉ copy danh mục 1 lần duy nhất
      if (!mobileMenu.dataset.populated) {
        mobileMenu.innerHTML = categoriesList.innerHTML;
        mobileMenu.dataset.populated = "true";
      }

      // Hiển thị / ẩn menu
      mobileMenu.classList.toggle("active");
    });

    // Click ra ngoài thì ẩn menu
    document.addEventListener("click", (e) => {
      if (!mobileMenu.contains(e.target) && !menuToggle.contains(e.target)) {
        mobileMenu.classList.remove("active");
      }
    });

    // Khi resize về desktop thì ẩn menu
    window.addEventListener("resize", () => {
      if (window.innerWidth > 992) {
        mobileMenu.classList.remove("active");
      }
    });
  }
  renderAuth();
});
