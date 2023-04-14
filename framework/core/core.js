/**
 * Created by yanbo on 2017/8/11.
 * Its small, simple and no need to compile by nodejs.
 * BoyiaWidget can run anywhere.
 * Email 2512854007@qq.com
 */
///// core.js begin
import {
    Common,
    FeatureGatings,
    HtmlTags,
    InputType
} from '../base/util.js'
 
// Virtyal DOM widget
export class BoyiaWidget {
    constructor({styleName = '', id = '', onready = undefined}) {
        this.styleName = styleName;
        this.id = id;
        this.onready = onready;
    }

    initWidget() {}

    disposeWidget() {
        if (this.isContainer() && this.children) {
            for (let i = 0; i < this.children.length; i++) {
                this.children[i].disposeWidget();
            }
        } else if (this.isComponent() && this.child) {
            this.child.disposeWidget();
        }
    }

    // 构建虚拟dom，非自定义渲染widget时，只需要重写build就行了
    // 叶子节点返回的是自己，此处默认返回自己
    build() { return this; }
    // 是否是容器
    isContainer() { return false; }
    // 构建真实dom，用于自定义渲染widget
    render() { 
        this.elem = this._render();
        if (this.onready && this.elem) {
            // dom构建完毕后，回调onready
            this.onready(this);
        }

        return this.elem;
    }

    _render() {
        return this.isComponent() ? this.build().render() : null;
    }

    // If the widget is a component, which has no render node, its render function rely child.
    isComponent() { return false; }
    // If the widget is a text
    isText() { return false; }
    // If the widget is a image
    isImage() { return false; }

    classType() {
        //return this.constructor.name;
        return this.constructor;
    }
}

// Stateless widget can not set state 
export class BoyiaStatelessWidget extends BoyiaWidget {
    constructor({styleName, id = '', onready = undefined}) {
        super({styleName, id, onready});
    }

    isComponent() { return true; }

    rebuild() {
        this.child = this.build();
        return this.child;
    }

    // First render will call initWidget
    // Second and more render will not call this method
    _render() {
        if (!this.child) {
            this.initWidget();
            this.child = this.build();
        }
        return this.child.render();
    }
}
 
// The state widget
export class BoyiaStateWidget extends BoyiaWidget {
    constructor({styleName, onready = undefined}) {
        super({styleName, onready});
        this.state = {};
    }

    rebuild() {
        this.child = this.build();
        return this.child;
    }

    isComponent() { return true; }

    // Async set state
    async setStateAsync(state, callback) {
        await Common.asyncTaskPromise({
            macroTask: () => {
                this.setState(state);
            }
        });

        if (callback) {
            callback();
        }
    }

    // Sync set state
    // Be careful, users cannot override this method
    setState(state) {
        if (FeatureGatings.USE_STATE) {
            this.state = state;
            let newWidget = BoyiaVDOMDriver.cloneWidget(this);
            new BoyiaVDOMDriver(this, newWidget).diff();
        } else if (FeatureGatings.USE_STATE_UI_UPDATE) {
            this.state = state
            let parent;
            console.log('BoyiaStateWidget setState parent = ' + (this.node && this.node.parentNode ? this.node.parentNode : null))
            if (this.node && this.node.parentNode) {
                parent = this.node.parentNode
                parent.removeChild(this.node)
            }
            
            BoyiaVDOMDriver.rebuild(this);
            this.render();
            if (this.node && parent) {
                parent.appendChild(this.node);
            }
        }
    }

    // First render will call initWidget
    // Second and more render will not call this method
    _render() {
        if (!this.child) {
            this.initWidget();
            this.child = this.build();
        }

        if (this.child) {
            this.node = this.child.render();
        }

        return this.node;
    }
}
 
// The container widget, which use div as a render container
export class Container extends BoyiaWidget {
    constructor({
        id = '',
        styleName = '',
        style = undefined,
        children = [],
        contenteditable = false,
        onready = undefined,
    }) { 
        super({styleName, id, onready});
        if (!(children instanceof Array)) {
            throw new Error('children is not a chilren');
        }
        this.children = children;
        this.style = style;
        this.contenteditable = contenteditable;
    }

    width() {
        if (this.elem) {
            return this.elem.clientWidth;
        }

        return 0;
    }

    height() {
        if (this.elem) {
            return this.elem.clientHeight;
        }

        return 0;
    }

    setWidth(width) {
        if (this.elem) {
            this.elem.style.width = width;
        }
    }

    setStyleName(styleName) {
        this.styleName = styleName;
        if (this.elem) {
            this.elem.className = styleName;
        }
    }

    setStyle(style) {
        this.style = style;
        if (this.elem) {
            Common.objToStyle(this.elem, style);
        }
    }

    getComputedStyle(name) {
        if (this.elem) {
            return window.getComputedStyle(this.elem)[name];
        }
    }

    getStylePropValue(name) {
        if (this.elem) {
            return this.elem.style[name];
        }
    }

    setStylePropValue(name, value) {
        if (this.elem) {
            this.elem.style[name] = value;
        }
    }


    setCursor(cursor) {
        if (this.elem) {
            this.elem.style.cursor = cursor;
        }
    }

    setTop(top) {
        if (this.elem) {
            this.elem.style.top = top;
        }
    }

    setLeft(left) {
        if (this.elem) {
            this.elem.style.left = left;
        }
    }

    offsetLeft() {
        if (this.elem) {
            return this.elem.offsetLeft;
        }

        return 0;
    }

    offsetTop() {
        if (this.elem) {
            return this.elem.offsetTop;
        }

        return 0;
    }

    offsetWidth() {
        if (this.elem) {
            return this.elem.offsetWidth;
        }

        return 0;
    }

    offsetHeight() {
        if (this.elem) {
            return this.elem.offsetHeight;
        }

        return 0;
    }

    getBoundingClientRect() {
        if (this.elem) {
            return this.elem.getBoundingClientRect();
        }

        return null;
    }

    setScrollTop(top) {
        if (!this.elem) {
            return;
        }

        // If scroll on bottom
        if (this.elem.scrollHeight <= this.elem.clientHeight + this.elem.scrollTop) {
            return;
        }

        this.elem.scrollTop = this.elem.scrollTop + top;
    }

    scrollBy(top) {
        if (!this.elem) {
            return;
        }
        // If scroll on bottom
        if (this.elem.scrollHeight <= this.elem.clientHeight + this.elem.scrollTop) {
            return;
        }

        if (this.elem) {
            this.elem.scrollBy({
                left: 0,
                top,
                behavior: 'smooth'
            });
        }
    }

    scrollTo(top) {
        if (!this.elem) {
            return;
        }

        // If scroll on bottom
        if (this.elem.scrollHeight <= this.elem.clientHeight + this.elem.scrollTop
            && this.elem.scrollHeight <= this.elem.clientHeight + top) {
            return;
        }

        if (this.elem) {
            this.elem.scrollTo({
                left: 0,
                top,
                behavior: 'smooth'
            });
        }
    }

    positionContain(left, top) {
        let {x, y} = this.getAbsolutePosition();
        return (left > x 
            && left < x + this.offsetWidth()
            && top > y
            && top < y + this.offsetHeight());
    }

    // Get absolute position
    getAbsolutePosition() {
        if (!this.elem) {
            return {x: 0, y: 0};
        }

        let elem = this.elem;
        // x pos
        let actualLeft = elem.offsetLeft;
        let current = elem.offsetParent;
        while (current){
            actualLeft += current.offsetLeft;
            current = current.offsetParent;
        }
        // y pos
        var actualTop = elem.offsetTop;
        current = elem.offsetParent;
        while (current) {
            actualTop += (current.offsetTop + current.clientTop);
            current = current.offsetParent;
        }
        // get x, y pos
        return {x: actualLeft, y: actualTop}
     }

    isContainer() { return true }

    _render() {
        let elem = document.createElement(HtmlTags.kContainerTag);
        if (this.id) {
            elem.setAttribute('id', this.id);
        }

        if (this.contenteditable) {
            elem.contenteditable = this.contenteditable;
        }

        if (this.styleName) {
            elem.className = this.styleName;
        }

        if (this.style) {
            Common.objToStyle(elem, this.style);
        }

        // Add child render node to itself
        this.children.forEach((child) => {
            try {
                // call child render function to create a new render node.
                elem.appendChild(child.render());
            } catch(e) {
                console.error('appendChild err:', e)
                console.log('child class: ' + child.constructor.name);
            }
        })

        return elem;
    }
}

// Image Widget show image label in page
export class ImageWidget extends BoyiaWidget {
    constructor({style, styleName, url, id= '', onready = undefined}) { 
        super({styleName, id, onready});
        this.url = url;
        this.style = style;
    }

    setImageUrl(url) {
        this.url = url;
        if (this.elem) {
            this.elem.src = this.url;
        }
    }

    _render() {
        let elem = document.createElement(HtmlTags.kImageTag);
        elem.src = this.url;
        if (this.styleName) {
            elem.className = this.styleName;
        }

        if (this.style) {
            Common.objToStyle(elem, this.style);
        }
        return elem;
    }

    isImage() { return true; }
}
 
export class InputWidget extends BoyiaWidget {
    constructor({styleName, 
        id= '', 
        name='', 
        value='',
        style,
        onready = undefined, 
        onChange
    }) { 
        super({styleName, id, onready}) 
        this.name = name
        this.value = value
        this.onChange = onChange
        this.style = style;
    }

    type() { return '' }

    setValue(value) {
        this.value = value;
        if (this.elem) {
            this.elem.value = value;
        }
    }

    _render() {
        let elem = document.createElement(HtmlTags.kInputTag)
        elem.setAttribute('type', this.type())
        elem.setAttribute('name', this.name)
        elem.setAttribute('value', this.value)

        if (this.onChange) {
            elem.onchange = () => {
                this.onChange(elem.value)
            };
        }
        if (this.styleName) {
            elem.className = this.styleName
        }

        if (this.style) {
            Common.objToStyle(elem, this.style);
        }
        return elem;
    }
}
 
export class TextField extends InputWidget {
    constructor({
        styleName, 
        style, 
        id= '', 
        name='', 
        value='',
        placeholder,
        onblur,
        onready,
        onClick, 
        onChange}) { 
        super({styleName, style, id, name, value, onready, onChange});
        this.placeholder = placeholder;
        this.onblur = onblur;
        this.onClick = onClick;
    }

    type() { return InputType.kTextFieldType; }

    // Get focus of textfield
    focus() {
        if (this.elem) {
            this.elem.focus();
        }
    }

    _render() {
        let elem = super._render();
        if (this.placeholder) {
            elem.setAttribute('placeholder', this.placeholder);
        }

        // lost focus callback 
        if (this.onblur) {
            elem.onblur = this.onblur;
        }

        if (this.onClick) {
            elem.onclick = this.onClick;
        }
        return elem;
    }
}
 
export class Button extends InputWidget {
    constructor({styleName, id= '', name='', value='', onTap}) { 
        super({styleName, id, name, value});
        this.onTap = onTap;
    }

    type() { return InputType.kButtonType; }

    _render() {
        let elem = super._render();
        if (this.onTap) {
            elem.onclick = this.onTap;
        }
        return elem;
    }
}

export class FilePicker extends InputWidget {
    constructor({styleName, id= '', name='', value='', style, onready, onChange}) { 
        super({styleName, id, name, style, value, onready});
        this.onChange = onChange;
    }

    type() { return InputType.kFilePickType; }

    filter() { return 'image/*'; }

    _render() {
        let elem = super._render();
        elem.setAttribute('accept', this.filter())
        if (this.onChange) {
            elem.onchange = () => {
                this.onChange(elem.files[0])
            }
        }
        return elem
    }
}

export class CheckBox extends InputWidget {
    constructor({
        styleName = '', 
        id= '', 
        name='', 
        value='',
        checked = false,
        onClick, 
        onready = undefined}) { 
        super({styleName, id, name, value, onready});
        this.onClick = onClick;
        this.checked = checked;
    }

    type() { return InputType.kCheckboxType; }

    isChecked() {
        if (this.elem) {
            return this.elem.checked
        }

        return false
    }

    _render() {
        let elem = super._render();
        if (this.onClick) {
            elem.onclick = this.onClick
        }

        if (this.checked) {
            elem.checked = this.checked;
        }

        if (this.id) {
            elem.id = this.id
        }
        return elem
    }
}
 
export class Text extends BoyiaWidget {
    constructor(text, onready = undefined) { 
        super({styleName: '', id: '', onready})
        this.text = text
    }

    setText(text) {
        if (this.elem) {
            this.elem.textContent = text
        }
    }

    _render() {
        return document.createTextNode(this.text)
    }

    isText() { return true; }
}

export class Audio extends BoyiaWidget {
    constructor({oncanplay, onplay, onended, onprogress, ontimeupdate, onready}) { 
        super({styleName: '', id: '', onready});
        this.oncanplay = oncanplay;
        this.onplay = onplay;
        this.onended = onended;
        this.onprogress = onprogress;
        this.ontimeupdate = ontimeupdate;
    }

    seekTo(progress) {
        if (this.elem) {
            this.elem.currentTime = progress * this.elem.duration;
        }
    }

    currentTime() {
        return this.elem && this.elem.currentTime;
    }

    duration() {
        return this.elem && this.elem.duration;
    }

    hasUrl() {
        return this.elem && this.elem.src;
    }

    setPlayUrl(url) {
        if (this.elem) {
            this.elem.src = url;
        }
    }

    play() {
        if (this.elem) {
            this.elem.play();
        }
    }

    pause() {
        if (this.elem) {
            this.elem.pause();
        }
    }

    setVolume(volume) {
        if (this.elem) {
            this.elem.volume = volume;
        }
    }

    _render() {
        let elem = document.createElement(HtmlTags.kAudioTag);
        elem.setAttribute('preload', 'auto');
        elem.oncanplay = function () {
            console.log('on audio prepared duration=' + elem.duration);
        }
        elem.onplay = this.onplay;
      
        elem.onended = this.onended;
        elem.onprogress = this.onprogress;
    
        elem.ontimeupdate = this.ontimeupdate;
        elem.onerror = elem.onended;
        this.elem = elem;
        if (this.onready) {
            this.onready(this);
        }
        return elem;
    }
}

export class Video extends BoyiaWidget {
    constructor({width, height, onended, onprogress, ontimeupdate, onready}) { 
        super({styleName: '', id: '', onready});
        this.width = width;
        this.height = height;
        this.onended = onended;
        this.onprogress = onprogress;
        this.ontimeupdate = ontimeupdate;
    }

    seekTo(progress) {
        if (this.elem) {
            this.elem.currentTime = progress * this.elem.duration;
        }
    }

    getBuffer() {
        if (this.elem && this.elem.buffered) {
            let duration = this.elem.duration;
            if (!duration) { return 0; }

            let length = this.elem.buffered.length;
            for (let i = length - 1; i >= 0; i--) {
                if (this.elem.buffered.start(i) < this.elem.currentTime) {
                    let bufferedLength = ((this.elem.buffered.end(i) / duration) * 100).toFixed(2) + '%';
                    return bufferedLength;
                }
            }
        }

        return 0;
    }

    currentTime() {
        return this.elem && this.elem.currentTime;
    }

    duration() {
        return this.elem && this.elem.duration;
    }

    hasUrl() {
        return this.elem && this.elem.src;
    }

    setVolume(volume) {
        if (this.elem) {
            this.elem.volume = volume;
        }
    }

    isPlaying() {
        if (this.elem) {
            return !this.elem.paused;
        }

        return false;
    }

    setPlayUrl(url) {
        if (this.elem) {
            this.elem.src = url;
        }
    }

    play() {
        if (this.elem) {
            this.elem.play();
        }
    }

    pause() {
        if (this.elem) {
            this.elem.pause();
        }
    }

    _render() {
        let elem = document.createElement(HtmlTags.kVideoTag);
        if (elem) {
            elem.setAttribute('width', this.width);
            elem.setAttribute('height', this.height);
        }

        if (this.onprogress) {
            elem.onprogress = this.onprogress;
        }
    
        if (this.ontimeupdate) {
            elem.ontimeupdate = this.ontimeupdate;
        }

        this.elem = elem;
        return elem;
    }
}

export class Label extends BoyiaWidget {
    constructor({forId, styleName}) { 
        super({styleName: styleName, id: ''});
        this.forId = forId;
    }

    _render() {
        let elem = document.createElement(HtmlTags.kLabelTag);
        if (this.forId) {
            elem.setAttribute('for', this.forId);
        }

        if (this.styleName) {
            elem.className = this.styleName;
        }
        return elem;
    }
}

// 不占用渲染节点，只添加事件响应
export class GestureDetector extends BoyiaStatelessWidget {
    constructor({
        onTap = undefined, 
        onHover = undefined,
        onTouchStart = undefined,
        onTouchEnd = undefined,
        onMouseDown = undefined,
        onMouseUp = undefined, 
        onContextMenu = undefined,
        onDragStart = undefined, // 开始拖动
        onDragOver = undefined, // 当被拖动元素在另一对象容器范围内拖动时
        onDragEnd = undefined, // 拖动结束
        onDrag = undefined, // 当元素正在被拖动时触发
        child
    }) { 
        super({styleName: '', id: ''})
        this.onTap = onTap;
        this.onHover = onHover;
        this.child = child;
        this.onTouchStart = onTouchStart;
        this.onTouchEnd = onTouchEnd;
        this.onMouseDown = onMouseDown;
        this.onMouseUp = onMouseUp;
        this.onContextMenu = onContextMenu;
        this.onDragStart = onDragStart;
        this.onDragOver = onDragOver;
        this.onDragEnd = onDragEnd;
        this.onDrag = onDrag;
    }

    build() {
        return this.child;
    }

    _render() {
        let elem = this.child.render();
        if (this.onTap) {
            elem.onclick = this.onTap;
        }

        if (this.onHover) {
            elem.onmouseover = this.onHover;
        }

        if (this.onMouseDown) {
            elem.onmousedown = this.onMouseDown;
        }

        if (this.onMouseUp) {
            elem.onmouseup = this.onMouseUp;
        }

        if (this.onTouchStart) {
            elem.ontouchstart = this.onTouchStart;
        }

        if (this.onTouchEnd) {
            elem.ontouchend = this.onTouchEnd;
        }

        if (this.onContextMenu) {
            elem.oncontextmenu = this.onContextMenu;
        }

        if (this.onDrag) {
            elem.ondrag = this.onDrag;
        }

        if (this.onDragStart) {
            elem.ondragstart = this.onDragStart;
        }

        if (this.onDragEnd) {
            elem.ondragend = this.onDragEnd;
        }

        if (this.onDragOver) {
            elem.ondragover = this.onDragOver;
        }

        return elem;
    }
}

export class CanvasWidget extends BoyiaWidget {
    constructor({width = 0, height = 0, onready = undefined}) { 
        super({styleName: '', id: '', onready});
        this.width = width;
        this.height = height;
    }

    setCanvasSize(width, height) {
        this.width = width;
        this.height = height;
        if (this.elem) {
            this.elem.width = this.width;
            this.elem.height = this.height;
        }
    }

    imageData() {
        if (this.context) {
            return this.context.getImageData(0, 0, this.width, this.height);
        }

        return null;
    }

    putImageData(imageData, width, height) {
        if (this.context) {
            this.context.putImageData(imageData, width, height);
        }
    }

    _render() {
        let elem = document.createElement(HtmlTags.kCanvasTag);
        elem.width = this.width;
        elem.height = this.height;
        this.context = elem.getContext('2d');
        return elem;
    }
}
 
// 导航
export class BoyiaNavigator {
    static _root;
    static _stack = [];

    static init() {
        BoyiaNavigator._root = document.getElementById('root');
        // 处理导航返回
        window.onpopstate = function(e) {
            console.log('onpopstate e = ', e.state);
            BoyiaNavigator.pop();
        }
    }

    static push({page, path, title}) {
        if (!BoyiaNavigator._root || !page) {
            return;
        }    

        // page为一个生成widget的函数
        let widget = page();
        if (!(widget instanceof BoyiaWidget)) {
            return;
        }

        /// UI压栈
        {
            BoyiaNavigator._stack.push(widget);
            // 删除先有dom节点
            let node = BoyiaNavigator._root;
            BoyiaNavigator._removeAll(BoyiaNavigator._root);

            node.appendChild(widget.render());
        }

        /// 修改路由
        history.pushState({title, path}, title, path);
    }

    static _removeAll(node) {
        while(node.hasChildNodes()) {
            node.removeChild(node.lastChild);
        }
    }

    static pop() {
        if (!BoyiaNavigator._root) {
            return;
        }

        if (BoyiaNavigator._stack.length <= 1) {
            return;
        }

        let node = BoyiaNavigator._root;
        BoyiaNavigator._removeAll(node);

        let stack = BoyiaNavigator._stack;
        let popWidgets = stack.splice(stack.length - 1, 1);
        if (popWidgets) {
            for (let i = 0; i < popWidgets.length; i++) {
                popWidgets[i].disposeWidget();
            }
        }

        if (stack.length > 0) {
            node.appendChild(stack[stack.length - 1].render());
        }
    }

    static replace({page, path, title}) {
        if (BoyiaNavigator._stack.length == 0) {
            BoyiaNavigator.push({page, path, title});
        }

        if (!BoyiaNavigator._root || !page) {
            return;
        }

        // page为一个生成widget的函数
        let widget = page();
        if (!(widget instanceof BoyiaWidget)) {
            return;
        }

        /// UI压栈
        {
            let replaceWidget = BoyiaNavigator._stack[BoyiaNavigator._stack.length - 1];
            if (replaceWidget) {
                replaceWidget.disposeWidget();
            }

            // 清空数组
            BoyiaNavigator._stack[BoyiaNavigator._stack.length - 1] = widget;
            let node = BoyiaNavigator._root;
            BoyiaNavigator._removeAll(BoyiaNavigator._root);

            node.appendChild(widget.render());
        }

        /// 修改路由
        history.replaceState({title, path}, title, path);
    }
}

export class EventHub {
    static _events = {};
    static addEvent(key, callback) {
        if (!key || !callback) {
            return;
        }

        let callbacks = EventHub._events[key];
        if (!callbacks) {
            callbacks = [];
            EventHub._events[key] = callbacks;
        }

        callbacks.push(callback);
    }

    static removeAll() {
        _events = {};
    }

    static removeEvent(key, callback) {
        if (!key || !callback) {
            return;
        }

        let callbacks = EventHub._events[key];
        if (!callbacks || callbacks.length == 0) {
            return;
        }

        for (let i = 0; i < callbacks.length; i++) {
            if (callbacks[i] == callback) {
                callbacks.splice(i, 1);
                break;
            }
        }
    }

    static sendEvent(key, data) {
        let callbacks = EventHub._events[key];
        if (!callbacks || !(callbacks instanceof Array)) {
            return;
        }

        callbacks.forEach((callback) => {
            callback(data);
        })
    }
}

// Only BoyiaStateWidget can invoke setstate
export class BoyiaVDOMDriver {
    constructor(oldWidget, newWidget) {
        this.oldWidget = oldWidget;
        this.newWidget = newWidget;
    }

    static _rebuildComponent(widget, old) {
        if (old) {
            // If has old, reuse the old props for diff
            widget.initProps = old.initProps;
        } else {
            // If has not old, the widget is new create
            // now need to call initWidget() to init the props
            widget.initWidget();
        }

        BoyiaVDOMDriver.rebuild(widget.rebuild(), old ? old.child : null);
    }

    // Recur component widget build method.
    static rebuild(widget, old) {
        let isSame = old && old.classType() == widget.classType();
        if (widget.isContainer()) {
            // If the widget is container, rebuild its child.
            widget.children.forEach((child, index) => {
                // Not the same type will be replaced, so get null.
                let oldChild = isSame ? old.children[index] : null;
                BoyiaVDOMDriver.rebuild(child, oldChild);
            });
        } else if (widget.isComponent()) {
            BoyiaVDOMDriver._rebuildComponent(widget, isSame ? old : null);
        } else {
            console.log('other type');
        }
    }

    static isFoundationType(value) {
        return typeof value === 'string'
            || typeof value === 'number';
    }

    static isBoyiaWidget(obj) {
        return obj instanceof BoyiaWidget;
    }
    
    // Clone widget only shallow
    static cloneWidget(obj) {
        if (!BoyiaVDOMDriver.isBoyiaWidget(obj)) {
            throw new Error('obj is not a boyia widget');
        }
        
        let cloneObj = new obj.constructor({
            styleName: obj.styleName,
            onready: obj.onready
        });
        for (let key in obj) {
            cloneObj[key] = obj[key];
        }
        
        return cloneObj;
    }

    diff() {
        // newWidget only build，and will not call render, just compare with old and new.
        // build will not call initWidget，so you can add crucial variable in initWidget method.
        BoyiaVDOMDriver.rebuild(this.newWidget, this.oldWidget);
        let oldRoot = this.oldWidget.child;
        let newRoot = this.newWidget.child;
        this.diffImpl(oldRoot, newRoot, this.oldWidget);

    }

    diffImpl(oldWidget, newWidget, parent) {
        // If class type is not the same, replace the widget to the old parent
        try {
            if (oldWidget.classType() != newWidget.classType()) {
                this._replaceWidget(oldWidget, newWidget, parent);
                return;
            }
        } catch(e) {
            console.error('compare type', e);
        }

        if (oldWidget.isContainer()) {
            this._diffContainer(oldWidget, newWidget);
        } else if (oldWidget.isComponent()) {
            for (let key in newWidget) {
                if (BoyiaVDOMDriver.isFoundationType(newWidget[key])) {
                    oldWidget[key] = newWidget[key];
                }
            }
            let oldRoot = oldWidget.child
            let newRoot = newWidget.child
            this.diffImpl(oldRoot, newRoot, oldWidget);
        } else if (oldWidget.isText()) {
            if (oldWidget.text != newWidget.text) {
                oldWidget.setText(newWidget.text);
            }
        } else if (oldWidget.isImage()) {
            if (newWidget.url && oldWidget.url != newWidget.url) {
                oldWidget.setImageUrl(newWidget.url);
            }
        }
    }

    // Compare the container
    _diffContainer(oldWidget, newWidget) {
        let children = newWidget.children;
        let oldChildren = oldWidget.children;
        let oldSize = oldChildren.length;

        // 1, Update node
        // If the old children length large than new children, delete the widget element from old children
        if (children.length < oldChildren.length) {
            for (let i = children.length; i < oldChildren.length; i++) {
                oldWidget.elem.removeChild(oldChildren[i].elem);
            }
            oldChildren.splice(children.length, oldChildren.length - children.length);
        } else if (children.length > oldChildren.length) {
            // If the old children length less than new children, add the widget element to old children
            for (let i = oldChildren.length; i < children.length; i++) {
                oldWidget.elem.appendChild(children[i].render());
            }
            
            oldChildren.push.apply(oldChildren, children.slice(oldChildren.length, children.length));
        }

        // 2, Update the properties of widget
        let size = children.length > oldSize ? oldSize : children.length;
        for (let i = 0; i < size; i++) {
            this.diffImpl(oldChildren[i], children[i], oldWidget);
        }

        try {
            if (newWidget.styleName != oldWidget.styleName) {
                oldWidget.setStyleName(newWidget.styleName ?? '');
            }

            if (newWidget.style != oldWidget.style) {
                oldWidget.setStyle(newWidget.style);
            }
        } catch(e) {
            console.error('set class name error', e);
        }
    }

    _replaceWidget(oldWidget, newWidget, parent) {
        if (parent.isContainer()) {
            let index = parent.children.indexOf(oldWidget);
            parent.children[index] = newWidget;
            if (parent.elem) {
                parent.elem.replaceChild(newWidget.render(), oldWidget.elem);
            }
        } else if (parent.isComponent()) {
            parent.child = newWidget;
            if (oldWidget.elem && oldWidget.elem.parentNode) {
                let elem = newWidget.render();
                oldWidget.elem.parentNode.replaceChild(elem, oldWidget.elem);
                // Reset the parent elem
                parent.elem = elem;
            }
        }

        oldWidget.disposeWidget();
    }
}
////// core.js end //////////