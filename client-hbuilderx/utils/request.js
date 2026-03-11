// ============================================================
// 【重要】请根据你的实际情况修改下面的服务器地址：
//
//   本机开发调试：http://127.0.0.1:3000/api
//   局域网手机调试：http://你电脑IP:3000/api（例如 http://192.168.1.100:3000/api）
//
//   查看电脑IP方法：
//     Windows: 打开 cmd，输入 ipconfig，找到 IPv4 地址
//     Mac: 打开终端，输入 ifconfig，找到 en0 的 inet 地址
// ============================================================
const BASE_URL = 'http://127.0.0.1:3000/api';

const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token');
    const header = {
      'Content-Type': 'application/json',
      ...options.header
    };
    if (token) {
      header['Authorization'] = `Bearer ${token}`;
    }

    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header,
      success: (res) => {
        if (res.statusCode === 401) {
          uni.removeStorageSync('token');
          uni.removeStorageSync('userInfo');
          uni.navigateTo({ url: '/pages/login/index' });
          reject(new Error('请先登录'));
          return;
        }
        if (res.data.code === 0) {
          resolve(res.data);
        } else {
          uni.showToast({ title: res.data.message || '请求失败', icon: 'none' });
          reject(new Error(res.data.message));
        }
      },
      fail: (err) => {
        uni.showToast({ title: '网络请求失败', icon: 'none' });
        reject(err);
      }
    });
  });
};

export const get = (url, data) => request({ url, method: 'GET', data });
export const post = (url, data) => request({ url, method: 'POST', data });
export const put = (url, data) => request({ url, method: 'PUT', data });
export const del = (url, data) => request({ url, method: 'DELETE', data });

export default request;
