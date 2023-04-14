/**
 * Created by yanbo.boyia.
 * Email 2512854007@qq.com
 */
export const HtmlTags = {
  kContainerTag: 'div',
  kInputTag: 'input',
  kImageTag: 'img',
  kAudioTag: 'audio',
  kVideoTag: 'video',
  kLabelTag: 'label',
  kCanvasTag: 'canvas',
  kHeadTag: 'head',
  kScriptTag: 'script',
  kBodyTag: 'body',
  kIframe: 'iframe'
};

export const InputType = {
  kTextFieldType: 'text',
  kButtonType: 'button',
  kFilePickType: 'file',
  kCheckboxType: 'checkbox'
};

export const kPixelUnit = 'rem';

export class Toast {
    static async show({msg = ''}) {
        var m = document.createElement(HtmlTags.kContainerTag);
        m.innerHTML = msg;
        m.className = 'boyia-toast';
        document.body.appendChild(m);
        let d = 0.5;
        await Common.asyncTaskPromise({
          macroTask: () => {
            m.style.transition = `transform ${d}s ease-in, opacity ${d}s ease-in`;
            m.style.opacity = '0';
          },
          duration: 1000
        });

        await Common.asyncTaskPromise({
          macroTask: () => {
            document.body.removeChild(m)
          },
          duration: d * 1000
        })
    }
}

export class Common {
  static jsonpCallbackId = 1;

  static timeFormat = (time) => {
    let tempMin = parseInt(time / 60);
    let tempSec = parseInt(time % 60);
    let curMin = tempMin < 10 ? ('0' + tempMin) : tempMin;
    let curSec = tempSec < 10 ? ('0' + tempSec) : tempSec;
    return curMin + ':' + curSec;
  }

  static remToPx(rem) {
    return 12 * rem;
  }

  static objToStyle(elem, widgetStyle) {
    if (!widgetStyle) {
      return;
    }
    if (widgetStyle instanceof Object) {
      let style = elem['style'];
      for (let key in widgetStyle) {
        style[key] = widgetStyle[key];
      }
    }
  }

  // 执行异步任务，避免宏任务内容太多造成卡顿
  // setState改造可以使用异步处理
  static asyncTask({macroTask, duration = 0, completed, fail}) {
    let id = setTimeout(() => {
      try {
        window.clearTimeout(id);

        if (!macroTask) {
          completed('no macroTask');
          return;
        }

        let result = macroTask();
        if (completed) {
          completed(result);
        }
      } catch(e) {
        console.error('asyncTask error: ', e)
        if (fail) {
          fail(e);
        }
      }
    }, duration);
    return id;
  }

  // 使用promise封装异步任务
  static asyncTaskPromise({macroTask, duration = 0}) {
    return new Promise((resolve, reject) => {
      Common.asyncTask({
        macroTask,
        duration,
        completed: (result) => {
          resolve(result);
        },
        fail: (e) => {
          reject(e);
        }
      });
    });
  }

  static measureText(text, font) {
    const canvas = document.createElement(HtmlTags.kCanvasTag);
    const ctx = canvas.getContext('2d');
    ctx.font = font;
    return ctx.measureText(text).width;
  }

  static extend({objs = []}) {
    let result = {};
    for (let i = 0; i < objs.length; i++) {
      let obj = objs[i];
      if (obj instanceof Object) {
        for (let key in obj) {
          result[key] = obj[key];
        }
      }
    }

    return result;
  }

  // When you want to get the callback from jsonp, you must invoke this funtion first.
  static initJsonpMsg() {
    window.addEventListener('message', (msg) => {
      console.log('initJsonpMsg msg = ' + JSON.stringify(msg.data));
      let data = msg.data;
      if (data && data['callback']) {
        let jsonpCallbackKey = `boyia_jsonp_${data['callback']}`;
        window[jsonpCallbackKey] && window[jsonpCallbackKey](data['data']);
      }
    });
  }

  // Use a iframe as a proxy to request cross origin data
  // The proxy html just like https://damonyan1985.github.io/js/jsonp/jsonp.html
  // You can download this html in your website for a proxy, and use jsonp static method to request data.
  /**
   * Common.initJsonpMsg();
   * Common.jsonp(
      'https://damonyan1985.github.io/js/jsonp/jsonp.html', 
      'https://damonyan1985.github.io/lyrics/joker.lrc',
      (result) => {
          console.log('json result = ' + result.data);
      });
   * @param {*} url 
   * @param {*} proxyUrl 
   * @param {*} callback 
   */
  static jsonp(url, proxyUrl, responseType, callback) {
    let body = document.querySelector(HtmlTags.kBodyTag);
    let iframe = document.createElement(HtmlTags.kIframe);
    iframe.style.display = 'none';

    let callbackName = `cb_${Common.jsonpCallbackId++}`;
    iframe.src = `${url}?callback=${callbackName}&proxyUrl=${encodeURIComponent(proxyUrl)}&responseType=${responseType ?? 'json'}`;

    console.log('jsonp iframe.src=' + iframe.src);

    let jsonpCallbackKey = `boyia_jsonp_${callbackName}`;
    window[jsonpCallbackKey] = (result) => {
      callback && callback(result);
      delete window[jsonpCallbackKey];
      // try {
      //   iframe.contentWindow.document.write('');
      //   iframe.contentWindow.document.clear('');
      // } catch(e) {
      //   console.error(e);
      // }

      body.removeChild(iframe);
    };
    body.appendChild(iframe);
  }

  static jsonpPromise(url, proxyUrl, responseType) {
    return new Promise((resolve, reject) => {
      Common.jsonp(url, proxyUrl, responseType, (result) => {
        if (result && result.status == 'ok') {
          resolve(result);
        } else {
          reject(result);
        }
      })
    });
  }

  static getProxyServerUrl() {
    return 'https://damonyan1985.github.io/js/jsonp/jsonp.html';
  }

  static getProxyUrl(url) {
    return `https://damonyan1985.github.io${url}`;
  }

  static isLocalUrl() {
    return window.location.protocol === 'file:';
  }

  // 是否是移动端
  static isMobile() {
    if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
      return true;
    }

    return false;
  }
}

Array.prototype.indexOf = function(val) {
  for (var i = 0; i < this.length; i++) {
      if (this[i] == val)
          return i;
  }
  return -1;
}

Array.prototype.remove = function(val) {
  var index = this.indexOf(val);
  if (index > -1) {
      this.splice(index, 1);
  }
}

Array.prototype.clear = function() {
  if (this.length > 0) {
    this.splice(0, this.length)
  }
}


String.format = function(format) {
  var args = Array.prototype.slice.call(arguments, 1);
  return format.replace(/{(\d+)}/g, function(match, number) {
      return typeof args[number] != 'undefined'
          ? args[number]
          : match;
  })
}

export class BoyiaStorage {
  // 内存存储
  static _storage = {};

  static setData(key, data) {
      BoyiaStorage._storage[key] = data;
      localStorage.setItem(key, data);
  }

  static getObject(key) {
      let data = localStorage.getItem(key);
      if (data) {
          return JSON.parse(data);
      }

      return null;
  }

  static setObject(key, obj) {
      if (!obj) {
        return;
      } 
      let result = localStorage.setItem(key, JSON.stringify(obj));
      console.log(`result = ${result}`);
  }

  static getData(key) {
      let data = BoyiaStorage._storage[key];
      if (data) {
          return data;
      }

      data = localStorage.getItem(key);
      if (data) {
          // 存储到内存方便下次直接从内存读取
          BoyiaStorage._storage[key] = data;
      }
      return data;
  }

  static removeData(key) {
      if (BoyiaStorage._storage[key]) {
        delete BoyiaStorage._storage[key];
      }
      localStorage.removeItem(key);
  }
}

export var SystemAudioContext = window.AudioContext || window.webkitAudioContext;

export class FeatureGatings {
  static USE_STATE = true;
  static USE_STATE_UI_UPDATE = false;
}