document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = window.API_BASE || "https://news-website-deploy-iykm.onrender.com";
  const token = localStorage.getItem("token");
  const profilesContainer = document.querySelector(".profiles-container");
  const profilesRow = profilesContainer.querySelector(".row");
  const tabs = document.querySelectorAll(".status-tab");

  if (!token) {
    alert("Vui lòng đăng nhập với tài khoản admin!");
    window.location.href = "login.html";
    return;
  }

  // Gọi API lấy tất cả yêu cầu tác giả
  async function fetchAuthorRequests() {
    try {
      const res = await fetch(`${API_BASE}/admin/author-requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Lỗi khi tải danh sách yêu cầu.");

      const data = await res.json();
      renderRequests(data.requests || []);
    } catch (err) {
      console.error("Fetch error:", err);
      profilesRow.innerHTML = `<p class="text-danger text-center">Không thể tải danh sách yêu cầu.</p>`;
    }
  }

  // Render danh sách yêu cầu
  function renderRequests(requests) {
    if (!requests.length) {
      profilesRow.innerHTML = `<p class="text-center text-muted">Không có yêu cầu nào.</p>`;
      return;
    }

    const activeStatus = document.querySelector(".status-tab.active").dataset.status;
    const filtered = requests.filter(req => req.status === activeStatus);

    if (!filtered.length) {
      profilesRow.innerHTML = `<p class="text-center text-muted">Không có yêu cầu ${activeStatus}.</p>`;
      return;
    }

    profilesRow.innerHTML = filtered
      .map(
        req => `
        <div class="col-12 col-md-6 col-lg-4 mb-4">
          <div class="card bg-dark text-light border border-secondary h-100">
            <div class="card-body">
              <h5 class="card-title text-warning">#${req.id} - ${req.username || "Người dùng ID " + req.user_id}</h5>
              <p class="card-text"><strong>Email:</strong> ${req.email || "Không có"}</p>
              <p class="card-text"><strong>Lý do:</strong> ${req.reason}</p>
              <p class="card-text"><strong>Trạng thái:</strong> 
                <span class="badge ${
                  req.status === "pending"
                    ? "bg-warning text-dark"
                    : req.status === "approved"
                    ? "bg-success"
                    : "bg-danger"
                }">${req.status}</span>
              </p>
              ${
                req.status === "pending"
                  ? `
                    <div class="d-flex gap-2 mt-3">
                      <button class="btn btn-success btn-sm" onclick="updateStatus(${req.id}, 'approved')">
                        Duyệt
                      </button>
                      <button class="btn btn-danger btn-sm" onclick="updateStatus(${req.id}, 'rejected')">
                        Từ chối
                      </button>
                    </div>
                  `
                  : ""
              }
            </div>
          </div>
        </div>
      `
      )
      .join("");
  }

  // Hàm cập nhật trạng thái (PUT)
  window.updateStatus = async function (id, status) {
    if (!confirm(`Bạn có chắc muốn ${status === "approved" ? "DUYỆT" : "TỪ CHỐI"} yêu cầu #${id}?`)) return;

    try {
      const res = await fetch(`${API_BASE}/admin/author-requests/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message || "Cập nhật thành công!");
        fetchAuthorRequests(); // reload list
      } else {
        alert(data.error || "Lỗi khi cập nhật yêu cầu.");
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("Lỗi kết nối tới server.");
    }
  };

  // Chuyển tab lọc theo trạng thái
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      fetchAuthorRequests();
    });
  });

  // Tự động load lần đầu
  fetchAuthorRequests();
});
