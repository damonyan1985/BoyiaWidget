import {
    BoyiaNavigator,
    Container,
    BoyiaStateWidget,
    Text
} from '../framework/core/core.js'

import { SkinManager } from './player/skin-manager.js'

var IndexRouter = {
    login: {
        path: '/boyiaweb/index/login',
        title: 'login',
        page: () => { return new Container({styleName: ''}); },
    },
    home: {
        path: '/boyiaweb/index/home',
        title: 'home',
        page: () => { 
            return new IndexHomeWidget({styleName: ''}); 
        }
    }
};

class IndexHomeWidget extends BoyiaStateWidget {
    constructor({styleName = ''}) {
        super({styleName});
    }

    build() {
        return new Container({
            styleName: 'page-main',
            children: [
                new Text('hello boyia widget')
            ]
        });
    }
}

$(document).ready(function() {
    BoyiaNavigator.init();
    BoyiaNavigator.push(IndexRouter.home);
});