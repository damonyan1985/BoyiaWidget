/**
 * Created by yanbo.boyia.
 * Email 2512854007@qq.com
 */

// 下划线标注的成员表示对外不可用，主要是内部使用
export class BoyiaHttp {
    static HttpMethod = {
      get: 'GET',
      post: 'POST'
    }

    static _postMap = {
        'application/x-www-form-urlencoded': BoyiaHttp._getPostFormData,
        'application/json': BoyiaHttp._getPostJsonData,
    }

    static _methodMap = {
        [BoyiaHttp.HttpMethod.get]: BoyiaHttp._httpGetData,
        [BoyiaHttp.HttpMethod.post]: BoyiaHttp._httpPostData
    }

    // get, post，不含上传
    static fetchPromise({url, method = BoyiaHttp.HttpMethod.get, headers = {}, data, responseType = 'json'}) {
      return new Promise(function(resolve, reject) {
        BoyiaHttp.fetch({
          url,
          method,
          headers,
          data,
          responseType,
          success: (data) => {
            resolve({
              status: 'ok',
              data: data
            });
          },
          fail: (status) => {
            reject({
              status: 'fail',
              reason: status
            });
          }
        })
      });
    }

    // 封装fetch函数进行http请求，用fetch用习惯了
    static fetch({url, method = BoyiaHttp.HttpMethod.get, headers = {}, data, responseType = 'json', success, fail, uploadProgress, onLoad}) {
        data = data || {}

        let reqData = BoyiaHttp._methodMap[method](headers, data);
        console.log('reqData = ', reqData);
      
        /// get请求，参数作为query添加
        if (method === BoyiaHttp.HttpMethod.get) {
            url += reqData;
        }
      
        var xhr = new XMLHttpRequest()
        xhr.responseType = responseType
        // 如果是上传文件
        if (responseType == 'blob') {
          if (onLoad) {
            xhr.onload = (e) => {
              if (xhr.status == 200) {
                onLoad(e, xhr)
              }
            };
          }
        } else {
          xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
              if (xhr.status === 200) {
                if (success && typeof success === 'function') {
                  success(xhr.response)
                }
              } else {
                if (fail && typeof fail === 'function') {
                  fail(xhr.status)
                }
              }
            }
          }
        }

        // 如果有上传进度回调
        if (uploadProgress) {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              uploadProgress(e.loaded, e.total)
            }
          };
        }

        // 发起http请求
        xhr.open(method, url, true)
        // 设置HTTP头
        Object.keys(headers).forEach((key) => {
            xhr.setRequestHeader(key, headers[key])
        })
        xhr.send(method === BoyiaHttp.HttpMethod.post ? reqData : null)
    }

    static _getPostJsonData(data) {
        return JSON.stringify(data);
    } 
    
    static _getPostFormData(data) {
        if (Object.keys(data).length == 0) {
            return '';
        }

        var formData = []
        for (var key in data) {
          formData.push(''.concat(key, '=', data[key]))
        }
        return formData.join('&')
    }

    static _httpGetData(headers, data) {
        if (Object.keys(data).length == 0) {
            return '';
        }
        return location.search.length === 0 ? ''.concat('?', data) : ''.concat('&', data)
    }

    static _httpPostData(headers, data) {
        let func = BoyiaHttp._postMap[headers['Content-Type']];
        return func ? func(data) : data;
    }

    // 上传文件
    static upload({url, headers = {}, file, success, fail, uploadProgress}) {
        const formData = new FormData()
        formData.append('file', file);
        BoyiaHttp.fetch({
          url,
          headers,
          data: formData,
          method: BoyiaHttp.HttpMethod.post,
          success,
          fail,
          uploadProgress
        })
    }

    // 下载文件
    static download({url, headers = {}}) {
      BoyiaHttp.fetch({
        url,
        headers,
        responseType: 'blob',
        method: BoyiaHttp.HttpMethod.get,
        onLoad: (e, xhr) => {
          const blob = new Blob([xhr.response], { type: "application/octet-stream" })
          const contentDisposition = xhr.getResponseHeader("Content-Disposition")
          let link = document.createElement("a")
          let fileName = "unknow"
          if (contentDisposition) {
              const descArrays = contentDisposition.split("=")
              fileName = decodeURI(descArrays[1])
          }

          console.log('BoyiaHttp download file name = ' + fileName)

          link.href = window.URL.createObjectURL(blob)
          link.download = fileName
          link.click()
          link.remove()
          window.URL.revokeObjectURL(link.href)
        }
      })
    }
}