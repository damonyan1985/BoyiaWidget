/**
 * Created by yanbo on 2017/8/11.
 */
///// core.js begin
// 容器主要使用div
import {
    FeatureGatings
} from '../base/util.js'

const HtmlTags = {
    kContainerTag: 'div',
    kInputTag: 'input',
    kImageTag: 'img',
    kAudioTag: 'audio',
    kVideoTag: 'video',
    kLabelTag: 'label'
};

const InputType = {
    kTextFieldType: 'text',
    kButtonType: 'button',
    kFilePickType: 'file',
    kCheckboxType: 'checkbox'
};
 
// 虚拟DOM结构中的元素
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
            //this.elem = elem
            this.onready(this);
        }

        return this.elem;
    }

    _render() {
        return this.isComponent() ? this.build().render() : null;
    }
    // 如果是复合组件，本身没有渲染功能，完全依靠子组件
    isComponent() { return false; }

    className() {
        return this.constructor.name;
    }
}

// 无状态复合组件
export class BoyiaStatelessWidget extends BoyiaWidget {
    constructor({styleName, id = '', onready = undefined}) {
        super({styleName, id, onready})
    }

    isComponent() { return true }

    rebuild() {
        this.child = this.build()
        return this.child
    }

    // 首次渲染调用initWidget
    _render() {
        if (!this.child) {
            this.initWidget()
            this.child = this.build()
        }
        return this.child.render()
    }
}
 
// 有状态复合组件
export class BoyiaStateWidget extends BoyiaWidget {
    constructor({styleName, onready = undefined}) {
        super({styleName, onready})
        this.state = {}
        //this.root = this.build()
    }

    rebuild() {
        this.child = this.build()
        return this.child
    }

    isComponent() { return true }

    // 驱动刷新机制
    // 从父元素中移除自己，重新build之后再次添加
    setState(state) {
        if (FeatureGatings.USE_STATE) {
            this.state = state
            // let newWidget = Object.assign(new this.constructor({
            //     styleName: this.styleName,
            //     onready: this.onready
            // }) , this)
            let newWidget = BoyiaVDOMDriver.deepCloneWidget(this)
            new BoyiaVDOMDriver(this, newWidget).diff()
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
 
// 容器
export class Container extends BoyiaWidget {
    constructor({
        id = '',
        styleName = '',
        children = [],
        onready = undefined,
    }) { 
        super({styleName, id, onready});
        this.children = children;
    }

    setWidth(width) {
        if (this.elem) {
            this.elem.style.width = width;
        }
    }

    setStyle(style) {
        if (this.elem) {
            this.elem.className = style;
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

    isContainer() { return true }

    _render() {
        let elem = document.createElement(HtmlTags.kContainerTag);
        if (this.id) {
            elem.setAttribute('id', this.id);
        }
        if (this.styleName) {
            elem.className = this.styleName;
        }

        // 添加子元素
        this.children.forEach((child) => {
            try {
                // 子元素渲染
                elem.appendChild(child.render());
            } catch(e) {
                console.error('appendChild err:', e)
                console.log('child class: ' + child.constructor.name);
            }
        })

        return elem;
    }
}

export class ImageWidget extends BoyiaWidget {
    constructor({styleName, url, id= '', onready = undefined}) { 
        super({styleName, id, onready});
        this.url = url;
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
        return elem;
    }
}
 
export class InputWidget extends BoyiaWidget {
    constructor({styleName, id= '', name='', value='', onready = undefined, onChange}) { 
        super({styleName, id, onready}) 
        this.name = name
        this.value = value
        this.onChange = onChange
    }

    type() { return '' }

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
        return elem;
    }
}
 
export class TextField extends InputWidget {
    constructor({styleName, id= '', name='', value=''}) { 
        super({styleName, id, name, value}) 
    }

    type() { return InputType.kTextFieldType; }
}
 
export class Button extends InputWidget {
    constructor({styleName, id= '', name='', value='', onTap}) { 
        super({styleName, id, name, value});
        this.onTap = onTap;
    }

    type() { return InputType.kButtonType; }

    _render() {
        let elem = super._render()
        if (this.onTap) {
            elem.onclick = this.onTap
        }
        return elem
    }
}

export class FilePicker extends InputWidget {
    constructor({styleName, id= '', name='', value='', onChange}) { 
        super({styleName, id, name, value});
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
    constructor({styleName = '', id= '', name='', value='', onClick, onready = undefined}) { 
        super({styleName, id, name, value, onready});
        this.onClick = onClick;
    }

    type() { return InputType.kCheckboxType; }

    checked() {
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
            console.log('onpopstate e = ', e.state)
            BoyiaNavigator.pop()
        }
    }

    static push({page, path, title}) {
        if (!BoyiaNavigator._root || !page) {
            return;
        }    

        // page为一个生成widget的函数
        let widget = page();
        if (!(widget instanceof BoyiaWidget)) {
            return
        }

        /// UI压栈
        {
            BoyiaNavigator._stack.push(widget);
            // 删除先有dom节点
            let node = BoyiaNavigator._root;
            BoyiaNavigator._removeAll(BoyiaNavigator._root)

            node.appendChild(widget.render());
        }

        /// 修改路由
        history.pushState({title, path}, title, path)
    }

    static _removeAll(node) {
        while(node.hasChildNodes()) {
            node.removeChild(node.lastChild)
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
                popWidgets[i].disposeWidget()
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
    static _events = {}
    static addEvent(key, callback) {
        if (!key || !callback) {
            return
        }

        let callbacks = EventHub._events[key]
        if (!callbacks) {
            callbacks = []
            EventHub._events[key] = callbacks
        }

        callbacks.push(callback)
    }

    static removeAll() {
        _events = {}
    }

    static removeEvent(key, callback) {
        if (!key || !callback) {
            return
        }

        let callbacks = EventHub._events[key]
        if (!callbacks || callbacks.length == 0) {
            return
        }

        for (let i = 0; i < callbacks.length; i++) {
            if (callbacks[i] == callback) {
                callbacks.splice(i, 1)
                break
            }
        }
    }

    static sendEvent(key, data) {
        let callbacks = EventHub._events[key]
        if (!callbacks || !(callbacks instanceof Array)) {
            return
        }

        callbacks.forEach((callback) => {
            callback(data)
        })

        //delete EventHub._events[key]
    }
}

// BoyiaStateWidget才能setstate
export class BoyiaVDOMDriver {
    constructor(oldWidget, newWidget) {
        this.oldWidget = oldWidget
        this.newWidget = newWidget
    }

    // 遍历子元素中的component，全部build一遍
    static rebuild(widget) {
        if (widget.isContainer()) {
            widget.children.forEach((child) => {
                if (child.isComponent()) {
                    BoyiaVDOMDriver.rebuild(child.rebuild())
                } else if (child.isContainer()) {
                    BoyiaVDOMDriver.rebuild(child)
                }
            })
        } else if (widget.isComponent()) {
            BoyiaVDOMDriver.rebuild(widget.rebuild())
        } else {
            console.log('other type')
        }
    }

    static isBoyiaWidget(obj) {
        return obj instanceof BoyiaWidget
    }
    
    static deepCloneWidget(obj) {
        if (!BoyiaVDOMDriver.isBoyiaWidget(obj)) {
            throw new Error('obj is not a boyia widget')
        }
        
        let cloneObj = new obj.constructor({
            styleName: obj.styleName,
            onready: obj.onready
        })
        for (let key in obj) {
            cloneObj[key] = BoyiaVDOMDriver.isBoyiaWidget(obj[key]) ? BoyiaVDOMDriver.deepCloneWidget(obj[key]) : obj[key]
        }
        
        return cloneObj
    }

    diff() {
        BoyiaVDOMDriver.rebuild(this.newWidget);
        let oldRoot = this.oldWidget.child;
        let newRoot = this.newWidget.child;
        
        this.diffImpl(oldRoot, newRoot, this.oldWidget);

        if (this.newWidget.initProps) {
            this.oldWidget.initProps = this.newWidget.initProps;
        }
    }

    diffImpl(oldWidget, newWidget, parent) {
        // 不相等，完全替换
        try {
            if (oldWidget.className() != newWidget.className()) {
                this._replaceWidget(oldWidget, newWidget, parent);
                return;
            }
        } catch(e) {
            console.error('compare type', e);
        }

        if (oldWidget.isContainer()) {
            let children = newWidget.children;
            let oldChildren = oldWidget.children;
            let oldSize = oldChildren.length;

            // 1，更新结点(update node)
            // 如果老数组长度大于新数组长度，删除dom元素
            if (children.length < oldChildren.length) {
                for (let i = children.length; i < oldChildren.length; i++) {
                    oldWidget.elem.removeChild(oldChildren[i].elem);
                }
                oldChildren.splice(children.length, oldChildren.length - children.length);
            } else if (children.length > oldChildren.length) {
                for (let i = oldChildren.length; i < children.length; i++) {
                    oldWidget.elem.appendChild(children[i].render());
                }
                
                oldChildren.push.apply(oldChildren, children.slice(oldChildren.length, children.length));
            }

            // 2，更新节点属性(update props)
            let size = children.length > oldSize ? oldSize : children.length;
            for (let i = 0; i < size; i++) {
                this.diffImpl(oldChildren[i], children[i], oldWidget);
            }

            try {
                if (newWidget.styleName != oldWidget.styleName) {
                    oldWidget.styleName = newWidget.styleName;
                    oldWidget.elem.className = newWidget.styleName;
                }
            } catch(e) {
                console.error('set class name error', e);
            }

        } else if (oldWidget.isComponent()) {
            let oldRoot = oldWidget.child
            let newRoot = newWidget.child
            this.diffImpl(oldRoot, newRoot, oldWidget);
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
                oldWidget.elem.parentNode.replaceChild(newWidget.render(), oldWidget.elem);
            }
        }

        oldWidget.disposeWidget();
    }
}
////// core.js end //////////