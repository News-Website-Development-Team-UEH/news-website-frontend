/* -------------------- Hiển thị kết quả tìm kiếm -------------------- */
function renderSearchResults(articles, keyword) {
    const searchResultsContainer = document.getElementById("searchResults");
    const resultsSummary = document.getElementById("resultsSummary");
    const initialSearchPrompt = document.getElementById("initialSearchPrompt");

    // Ẩn phần hướng dẫn ban đầu khi đã có tìm kiếm hoặc từ khóa
    if (initialSearchPrompt) {
        initialSearchPrompt.style.display = "none";
    }

    if (!searchResultsContainer || !resultsSummary) return;

    if (keyword) {
        resultsSummary.textContent = `${articles.length} kết quả cho "${keyword}"`;
    } else {
        resultsSummary.textContent = ""; // Xóa phần tóm tắt nếu không có từ khóa
        // Nếu không có từ khóa và không có bài viết, hiển thị lại hướng dẫn hoặc thông báo mặc định
        if (articles.length === 0 && initialSearchPrompt) {
            initialSearchPrompt.style.display = "block";
        }
    }

    if (!Array.isArray(articles) || articles.length === 0) {
        if (keyword) { 
            // ĐÃ SỬA: Không in ra dòng chữ chi tiết “Không tìm thấy bài viết”
            searchResultsContainer.innerHTML = "";
        } else {
            // Trường hợp không có từ khóa (trang khởi tạo), đặt chuỗi rỗng
            searchResultsContainer.innerHTML = ""; 
        }
        return;
    }

    searchResultsContainer.innerHTML = articles.map(a => `
        <div class="search-result-item">
            <div class="result-text-content">
                <div class="result-category">${a.category_name ? a.category_name.toUpperCase() : "CHUNG"}</div>
                <h3 class="result-title">
                    <a href="formarticle.html?id=${a.id}">${a.title}</a>
                </h3>
                <div class="result-meta">
                    <span class="author-name">${a.author_name || "Tác giả không xác định"}</span>
                    <span>•</span>
                    <span>${new Date(a.created_at).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>•</span>
                    <span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chat-text" viewBox="0 0 16 16">
                            <path d="M2.678 11.894a1 1 0 0 1 .287.801 11 11 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-1.117.42-.45.718-.831.933-1.222a1 1 0 0 1 .607-.639C8.625 10.332 10.33 10 12 10c1.09 0 1.987.16 2.763.454a1.056 1.056 0 0 0 1.056-.402c.074-.153.11-.337.067-.514A.944.944 0 0 0 14.854 9H15c.01-.26.002-.519-.013-.778a5.5 5.5 0 0 0-.573-2.32c-.37-.8-.853-1.464-1.41-1.996S11.233 3 10 3c-.933 0-1.745-.246-2.456-.739A3.003 3.003 0 0 0 5.405 1C4.484 1 3.73 1.294 3.197 1.832c-.53.538-.89 1.258-1.107 2.052A4.001 4.001 0 0 0 1 5c0 1.063.294 2.032.802 2.87.51.84.97 1.57 1.408 2.063z"/>
                        </svg>
                        ${a.comment_count || 0}
                    </span>
                </div>
            </div>
            <div class="result-thumbnail">
                 <img src="${a.image_url || './images/default-thumbnail.jpg'}" 
                alt="Ảnh thu nhỏ của ${a.title}"
                onerror="this.src='./images/default-thumbnail.jpg';">
            </div>
        </div>
    `).join("");
}

/* -------------------- Gọi API: Tìm kiếm -------------------- */
async function fetchSearchResults(keyword) {
    if (!keyword) return [];

    try {
        // Đã sửa: thay 'keyword' bằng 'q' trong query string
        const res = await fetch(`${API_BASE}/articles/search?q=${encodeURIComponent(keyword)}`);
        if (!res.ok) {
            const errorText = await res.text();
            console.error(`Lỗi khi lấy kết quả tìm kiếm: ${res.status} - ${errorText}`);
            throw new Error(`Không thể lấy kết quả tìm kiếm: ${res.statusText}`);
        }
        const data = await res.json();
        return Array.isArray(data) ? data : data.data || [];
    } catch (e) {
        console.error("Lỗi API tìm kiếm:", e);
        return [];
    }
}

/* -------------------- Gọi API: Danh mục -------------------- */
async function fetchCategories() {
    try {
        // Gọi API danh mục, giả định endpoint là /categories
        const res = await fetch(`${API_BASE}/categories`); 
        if (!res.ok) {
            console.error(`Lỗi khi lấy danh mục: ${res.status}`);
            return [];
        }
        const data = await res.json();
        return Array.isArray(data) ? data : data.data || [];
    } catch (e) {
        console.error("Lỗi API danh mục:", e);
        return [];
    }
}

class CategoryRenderer {
    renderCategories(categories) {
        const container = document.getElementById("categoriesList");
        if (!container) {
            console.warn("Không tìm thấy phần tử 'categoriesList'. Không thể hiển thị danh mục trong header.");
            return;
        }

        if (!Array.isArray(categories) || categories.length === 0) {
            container.innerHTML = "<span>Không có danh mục nào</span>";
            return;
        }

        container.innerHTML = categories.map(c => `
            <a href="formcategory.html?id=${c.id}" class="nav-link">${c.name}</a>
        `).join("");
    }
}

/* -------------------- Khởi tạo trang tìm kiếm -------------------- */
async function initSearchPage() {
    const params = new URLSearchParams(window.location.search);
    const keyword = params.get("q") ? params.get("q").trim() : ""; // loại bỏ khoảng trắng trong từ khóa URL

    const searchInput = document.getElementById("searchInput");
    if (searchInput && keyword) {
        searchInput.value = keyword;
    }

    const articles = await fetchSearchResults(keyword);
    renderSearchResults(articles, keyword);
}

/* -------------------- Xử lý form tìm kiếm & khởi tạo -------------------- */
document.addEventListener("DOMContentLoaded", async () => {
    // Lấy danh mục và hiển thị lên header
    const categories = await fetchCategories();
    new CategoryRenderer().renderCategories(categories);

    // Ngăn form gửi khi không nhập gì
    const searchForm = document.getElementById("searchForm");
    const searchInput = document.getElementById("searchInput");

    if (searchForm && searchInput) {
        searchForm.addEventListener("submit", function(event) {
            const keyword = searchInput.value.trim(); 

            if (!keyword) {
                event.preventDefault(); 
                return;
            }
        });
    }

    // Khởi tạo trang tìm kiếm khi tải
    initSearchPage();
});
