(function(exports) {
    /*
     * Global Configuration
     */

    // 调整浏览器窗口大小
    window.resizeTo(1024, 768);

    // 添加渲染器
    var renderer = new O.Renderer(1440, 768, { transparent: true });
    document.body.appendChild(renderer.view);

    // Disable the right mouse button, drag, and select the text.
    tools.unselectable();

    var senceOutSide = new O.Container();

    // 添加舞台
    var stage = senceOutSide;

    // Defined window focus
    STAGE_FOCUS = 0;
    CHAT_WIN_FOCUS = 1;

    current_focus = STAGE_FOCUS;

    // 定义用户序号
    user_num  = 0;

    // 定义场景序号
    sence_num = 0;

    /////////////////////////////////////////////////////////////////////

    var Sence = Class.extend({
        init: function(opts) {
            if (!opts)
                opts = {};

            this._id = ++sence_num;

            if (opts.create) 
                this.create = opts.create;
        }
    });

    // 弹出窗口
    var Popup = Class.extend({
        init: function(opts) {
            if (!opts)
                opts = {};

            this.visible = false;
            this.width = opts.width || 400,
            this.height = typeof opts.height == 'number'? 
                opts.height:(typeof opts.height == "string"? 0:320);

            this.defaultOpts = {
                width: this.width,
                height: this.height,
                arrow: true,
                direction: 'top',
                modal: false,
                left: 0,
                top: 0
            }

            this.div = document.createElement('div');
            this.div.className = "dialog none";

            this.settings = opts;
        },
        setOpts: function(opts) {
            var self = this;
            for (var o in this.defaultOpts) {
                switch (o) {
                    case 'width':
                    case 'height':
                    case 'left':
                    case 'top':
                        var value = opts[o]? opts[o]:this.defaultOpts[o];
                        if (typeof value == "number")
                            value += 'px';

                        this.div.style[o] = value;
                        break;
                    case 'arrow':
                        if (typeof opts[o] != "boolean") 
                            opts[o] = this.defaultOpts[o]

                        if (opts[o]) {
                            var arrowCls = ['arrow-border', 'arrow'];
                            for (var i=0;i<arrowCls.length;++i) {
                                var div = document.createElement('div');
                                div.className = arrowCls[i];
                                this.div.appendChild(div);
                                div = null;
                            }
                        }
                        break;
                     case 'direction':
                        var cls = opts[o]? opts[o]:this.defaultOpts[o];
                        this.div.className += ' ' + cls;
                        break;
                     case 'modal':
                        if (opts[o]) {
                            this.modal = document.createElement('div');
                            this.modal.addEventListener('click', function(){
                                self.close();
                            }, false);
                        }
                        break;
                     case 'onShow':
                        this.onShow = opts[onShow];
                        break;
                    default:
                        break;
                }
            }
        },
        show: function() {
            current_focus = CHAT_WIN_FOCUS;

            var win_width = window.innerWidth;
            var win_height = window.innerHeight;

            this.defaultOpts.left = (win_width - this.width) * 0.5,
            this.defaultOpts.top  = (win_height - this.height) * 0.5,

            this.setOpts(this.settings);
            document.body.appendChild(this.div);
            document.body.appendChild(this.modal);

            this.div.className = this.div
                .className.replace(' none','');

            this.modal.className = "modal fade-out";
            var oheight = this.modal.offsetHeight;
            this.modal.className = "modal fade-in";

            this.visible = true;

            if (this.onShow) this.onShow();
        },
        close: function() {
            current_focus = STAGE_FOCUS;

            document.body.removeChild(this.div);
            document.body.removeChild(this.modal);
            // this.modal = this.div = null;
            this.visible = false;
        }
    });

    // 商品展示窗口
    var ProductWin = Popup.extend({
        init: function(opts) {
            this._super(opts);

            if (!opts)
                opts = {};

            this.data = opts.data || [];

            this.showProducts();
        },
        showProducts: function() {
            for (var i=0;i<this.data.length;++i) {
                var product = this.data[i];
                this.addProduct(product);
            }
        },
        addProduct: function(product) {
            var ctrlTpl = "<ul> \
                            <li>{{ price }}</li> \
                            <li><button>加入购物车 ></button></li> \
                          </ul>";

            var img = new Image
            img.src = product.imgurl;
            var imgBox = document.createElement('div');
            var ctrlArea =  document.createElement('div');
            var item = document.createElement('div');

            ctrlArea.innerHTML = tools.template(ctrlTpl,product);
            imgBox.appendChild(img);
            item.appendChild(imgBox);
            item.appendChild(ctrlArea);
            this.div.appendChild(item);
            img.onload = function() {
                //imgBox.
                this.onload = null;
            };
            img.onerror = function() {
                this.onerror = null;
            }
            imgBox = null;
            ctrlArea = null;
            img = null;
            item = null;
        },
        removeProduct: function() {

        }
    });

    // 聊天对话框
    var ChatWin = Popup.extend({
        init: function(opts) {
            this._super(opts);

            if (!opts)
                opts = {};

            // 当消息发送时触发,并调用该回调函数
            this.onSendMessage = opts.onSendMessage? opts.onSendMessage:null;

            //
            this.editor = document.createElement('div');
            this.editor.className = "chat-editor";
            this.editor.setAttribute('contenteditable', true);
            this.div.appendChild(this.editor);

            this.button = document.createElement('button');
            this.button.className = "chat-button-send";
            this.button.innerText = "确定";
            this.div.appendChild(this.button);

            var self = this;
            this.button.addEventListener('click', function() {
                var messages = self.editor.innerHTML;

                self.onSendMessage && self.onSendMessage(messages);

                self.close();
            }, false);
        },
        onShow: function() {
            // console.log('editor focus...');
            this.editor.innerHTML = '';
            this.editor.focus();
        }
    });

    //////////////////////////////////////////////////////////////////////

    // 角色
    var Role = Class.extend({
        init: function(opts) {
            if (!opts)
                opts = {};

            // 设置角色id
            this._id = ++user_num;

            this.defaultOpts = {
                isMainView: false,
                headUrl: "res/default-head.png",
                onWalk: null
            }

            this.actions = [];

            this.setOpts(opts);

            this.img = null;

            this.sprite = this.create();

            this.stand();

            this.initChatTips();

            this.initMoveRect();

            var self = this;

            animation.addHandle('tick', function() {
                self.move(360);
            });
        },
        setOpts: function(opts) {
            for (var o in this.defaultOpts) {
                switch (o) {
                    case 'isMainView':
                        if (typeof opts[o] != "boolean")
                            opts[o] = this.defaultOpts[o];

                        if (opts[o]) {
                            var img = new Image();
                            img.src = opts['headUrl'] || this.defaultOpts['headUrl'];

                            this.head = document.createElement('div');
                            this.head.className = "role-head";

                            this.head.onmouseover = function() {

                            }

                            this.head.appendChild(img);

                            document.body.appendChild(this.head);

                            img = null;
                        }
                        break;
                    case 'onWalk':
                        opts[o] && (this[o] = opts[o]);
                        break;
                    default:
                        break;
                }
            }
        },
        create: function() {
            var url = 'res/playeranimframe.png',
                width = 150;

            var player = new O.Sprite(url, function(img) {
                player.point.x = -width * .5;
                player.point.y = img.height;
            });
            player.start = 1;
            player.end = 1;
            player.width = width;
            player.height = 269;
            player.timer = 600;
            player.position.x = 0;
            player.position.y = -300;
            player.position.z = 0;
            // player.color = [255/255, 244/255, 172/255, 1];
            stage.addChild(player);

            return player;
        },
        move: function(speed) {
            if (this.fowardState || this.backState || this.upState || this.downState) {
                var inc = speed / 60;
                var incx, incz;
                if (this.fowardState) incx = inc;
                if (this.backState) incx = -inc;
                if (this.downState) incz = inc;
                if (this.upState) incz = -inc;

                var new_x, new_z;
                if (incx) {
                    new_x = (this.sprite.position.x += incx);
                    this.chatText.position.x = new_x - this.chatText.width * .9;
                    this.moveRect.offsetX(incx);
                };
                if (incz) {
                    new_z = (this.chatText.position.z = this.sprite.position.z += incz);
                    this.moveRect.offsetZ(incz);
                };

                if (incx) {
                    var offset = this.sprite.width * .5;
                    this.sprite.position.x = Math.max(Math.min(new_x,
                        renderer.view.width * .5 - offset), -renderer.view.width * .5 + offset);
                }

                if (new_x || new_z) {
                    this.onWalk();
                }
            }
        },
        action: function() {
            this.actions[0].call(this);
        },
        addAction: function(action) {
            if (this.actions.indexOf(action) == -1)
                this.actions.push(action);
        },
        removeAction: function(action) {
            var index = this.actions.indexOf(action);
            if (index != -1) {
                this.actions.splice(index, 1);
            }

        },
        up: function() {
            this.upState = true;
        },
        down: function() {
            this.downState = true;
        },
        foward: function() {
            this.fowardState = true;
            this.sprite.inversion = true;
            this.sprite.start = 2;
            this.sprite.end = 11;
        },
        stand: function() {
            this.downState = false;
            this.upState = false;
            this.fowardState = false;
            this.backState = false;
            this.sprite.start = 1;
            this.sprite.end = 1;
        },
        back: function() {
            this.backState = true;
            this.sprite.inversion = false;
            this.sprite.start = 2;
            this.sprite.end = 11;
        },
        initChatTips: function() {
            var style = {
                font : '14px 微软雅黑',
                fill : 0xff1010,
                align : 'center'
            };

            this.chatText = new O.BorderText('', style);
            this.updateChatTipsPos();
            // this.chatText.alpha = .25;
            stage.addChild(this.chatText);
        },
        updateChatTipsPos: function() {
            this.chatText.position.x = this.sprite.position.x - this.chatText.width * .9;
            this.chatText.position.y = this.sprite.position.y + this.sprite.height + this.chatText.height;
            this.chatText.position.z = this.sprite.position.z;
        },
        showChatTips: function(text) {
            this.updateChatTipsPos();
            this.chatText.showText(text);
        },
        initMoveRect: function() {
            this.moveRect = new O.Rand(O.RECT, [
                this.sprite.position.x - this.sprite.width * .5,
                this.sprite.position.x + this.sprite.width * .5,
                this.sprite.position.z - this.sprite.width * .5,
                this.sprite.position.z + this.sprite.width * .5
            ]);
        }
    });

    // 建筑物
    var Building = Class.extend({
        init: function() {
            // 在屋内的用户
            this.users = {};

            // 精灵
            this.sprite = this.create();

            // 内景
            this.interior = this.createInterior();

            // 初始化进门触发区
            this.initInDoorRect();

            this.direction = this.initDirection();
        },
        setOpts: function() {
            // TODO
        },
        create: function() {
            var url = 'res/shop.png';

            // 铺子
            var building = new O.Sprite(url, function(img) {
                // move the sprite to the center of the screen
                building.point.x = -img.width * .5;
                building.point.y = img.height;
                building.point.z = 0;
            });

            // center the sprite's anchor point
            building.end = 1;
            //building.inversion = true;
            building.width = 800;
            building.height = 681;
            building.timer = 150;
            building.position.x = 0;
            building.position.y = -300;
            building.position.z = 0;
            stage.addChild(building);

            return building;
        },
        createInterior: function() {
            var senceShopInterior = new O.Container();

            var url = 'res/counter.png';
            var counter = new O.Sprite(url, function(img) {
                counter.point.x = -img.width * .5;
                counter.point.y = img.height;
                counter.point.z = 0;
            });
            counter.width = 300;
            counter.height = 154;
            counter.timer = 150;
            counter.position.x = 0;
            counter.position.y = -300;
            senceShopInterior.addChild(counter);

            return senceShopInterior;
        },
        initInDoorRect: function() {
            var offset = 449;
            var width = 214;
            var left = this.sprite.position.x + (offset - this.sprite.width * .5);
            var right = left + width;
            this.inDoorRect = new O.Rand(O.RECT, [
                left,
                right,
                this.sprite.position.z,
                this.sprite.position.z + 200
            ]);
        },
        initDirection: function() {
            var url = 'res/direction.png';

            var direction = new O.Sprite(url, function(img) {
                direction.point.x = -img.width * .5;
                direction.point.y = img.height * .5;
                direction.point.z = 0;
            });

            direction.width = 69;
            direction.height = 59;
            direction.timer = 150;
            var offset = 499;
            var width = 114;
            direction.position.x = this.sprite.position.x +
                (offset - this.sprite.width * .5) + width * .5;

            direction.visible = false;
            direction.position.y = -300;
            direction.rotate.x = -90;
            direction.position.z = direction.height;
            stage.addChild(direction);

            return direction;
        },
        join: function(user) {
            if (!this.users['user_' + user._id])
                this.users['user_' + user._id] = user;
        },
        hasUser: function(user) {
            return !!this.users['user_' + user._id];
        }
    })

    ///////////////////////////////////////////////////////////////////////
    // Add shop
    var shop = new Building();

    // Add user
    var user = new Role({
        isMainView: true,
        onWalk: function() {
            var self = this;
            var actionInHouse = function() {
                senceOutSide.removeChild(self.sprite);
                stage = shop.interior;
                stage.addChild(self.sprite);
                shop.join(user);
            };

            if (this.moveRect.isInRand(shop.inDoorRect)) {
                shop.direction.visible = true;
                this.addAction(actionInHouse);
            } else {
                shop.direction.visible = false;
                this.removeAction(actionInHouse);
            }
        }
    });
    user.sprite.name = "user";
    user.sprite.addHandle('hover');

    // Add visitor
    var visitor = new Role();
    visitor.sprite.name = "visitor";
    var z = 10;
    
    visitor.sprite.position.z = z;
    visitor.sprite.addHandle('hover');


    // Chat dialog
    var chatWin = new ChatWin({
        height: 120,
        top: 10,
        left: 150,
        direction: 'right',
        modal: true,
        onSendMessage: function(messages) {
            user.showChatTips(messages);
        }
    });

    // 商品展示窗口实例
    /*var productWin = new ProductWin({
        width: 960,
        height: 'auto',
        top: 50,
        data: [{
            imgurl: 'res/TB1OWSwIXXXXXccXFXXSutbFXXX.jpg',
            price: 30,
        }, {
            imgurl: 'res/TB1OWSwIXXXXXccXFXXSutbFXXX.jpg',
            price: 30,
        }]
    });*/

    // 键盘操作聊天窗口
    keyboard.addHandle('ctrl + b', function() {
        if (!chatWin.visible) chatWin.show();
        else chatWin.close();
    });

    // 键盘操作产品窗口
    /*keyboard.addHandle('ctrl + q', function() {
        if (!productWin.visible) productWin.show();
        else productWin.close();
    });*/

    // 键盘用户动作操作
    keyboard.addHandle('down_keydown', function() {
        if (current_focus == STAGE_FOCUS) user.down();
    });

    keyboard.addHandle('up_keydown', function() {
        if (current_focus == STAGE_FOCUS) user.up();
    });

    keyboard.addHandle('right_keydown', function() {
        if (current_focus == STAGE_FOCUS) user.foward();
    });

    keyboard.addHandle('left_keydown', function() {
        if (current_focus == STAGE_FOCUS) user.back();
    });

    keyboard.addHandle('down_keyup', function() {
        if (current_focus == STAGE_FOCUS) user.stand();
    });

    keyboard.addHandle('up_keyup', function() {
        if (current_focus == STAGE_FOCUS) user.stand();
    });

    keyboard.addHandle('right_keyup', function() {
        if (current_focus == STAGE_FOCUS) user.stand();
    });

    keyboard.addHandle('left_keyup', function() {
         if (current_focus == STAGE_FOCUS) user.stand();
    });

    keyboard.addHandle('e_keydown', function() {
         if (current_focus == STAGE_FOCUS) user.action();
    });

    document.addEventListener('mousemove', function(ev) {
        var sh = renderer.view.height * .5,
            sw = renderer.view.width  * .5,
            mx = ev.clientX - sw,
            my = -(ev.clientY - sh),
            z = 0, deg = 30;

        var scaleWH = sw / sh;
        var cz = sh / Math.tan(tools.degToRad(deg));

        function inRect(point, rect) {
            var minx = rect.left, 
                maxx = rect.right, 
                miny = rect.top,
                maxy = rect.bottom;

            if (point.x > minx && point.x < maxx && point.y < miny && point.y > maxy) return true;
            return false;
        }

        var l = stage.children.length;
        for (var i = l - 1; i >= 0; --i) {
            var child = stage.children[i];

            if (child.hover) { 
                z = child.position.z;

                var csh = sh * cz / (cz - z);
                var scaleY = csh / sh;
                var csw = csh * scaleWH;
                var scaleX = csw / sw;

                var point = {};
                point.y = my / scaleY;
                point.x = mx / scaleX;

                var rect = {}; 
                rect.left = child.position.x + (child.point? child.point.x:0);
                rect.top = child.position.y + (child.point? child.point.y:0);
                rect.right = rect.left + child.width;
                rect.bottom = rect.top - child.height;

                if (inRect(point, rect)) {
                    child.color = [255/255, 244/255, 172/255, 1];
                    break;
                } else {
                    child.color = [1, 1, 1, 1];
                }
            }
        }
    }, false);

    /////////////////////////////////////////////////////////////////////////

    // 添加循环动画
    animation.addHandle('tick', function() {
        renderer.render(stage);
    });

    animation.registerAnimation();
})(this)
