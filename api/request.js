function ajaxRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Xử lý query params nếu có
    if (options.params && typeof options.params === "object") {
      const queryString = new URLSearchParams(options.params).toString();
      url += (url.includes("?") ? "&" : "?") + queryString;
    }

    // Mặc định method = GET nếu không có body, còn có body thì = POST
    const method = options.method 
      ? options.method.toUpperCase() 
      : (options.body ? "POST" : "GET");

    xhr.open(method, url, true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    // Xử lý khi response về
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (e) {
            resolve(xhr.responseText);
          }
        } else {
          reject({ status: xhr.status, message: xhr.statusText });
        }
      }
    };

    // Gửi request
    xhr.send(options.body ? JSON.stringify(options.body) : null);
  });
}
