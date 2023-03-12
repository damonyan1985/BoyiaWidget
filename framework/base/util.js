export class Toast {
    static show({msg = ''}) {
        var m = document.createElement('div');
        m.innerHTML = msg;
        m.className = 'boyia-toast';
        document.body.appendChild(m);
        setTimeout(function() {
            var d = 0.5;
            m.style.transition = '-webkit-transform ' + d + 's ease-in, opacity ' + d + 's ease-in';
            m.style.opacity = '0';
            setTimeout(function() { document.body.removeChild(m) }, d * 1000);
        }, 1000);
    }
}

export class Common {
  static getUrlParams() {
    //window.location.
  }

  static timeFormat = (time) => {
    let tempMin = parseInt(time / 60);
    let tempSec = parseInt(time % 60);
    let curMin = tempMin < 10 ? ('0' + tempMin) : tempMin;
    let curSec = tempSec < 10 ? ('0' + tempSec) : tempSec;
    return curMin + ':' + curSec;
  }
}

export class FeatureGatings {
  static USE_STATE = true
  static USE_STATE_UI_UPDATE = false
}