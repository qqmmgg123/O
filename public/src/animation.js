/*
 * @fileOverview 动画处理
 * @version 0.1
 * @author minggangqiu
 */
(function() {
    function Animation() {
        // 事件集合
        this.events = {};

        // 帧循环
        window.requestAnimFrame = (function () {
            return window.requestAnimationFrame || 
                window.webkitRequestAnimationFrame;
        })();
    }

    Animation.prototype = {
        // 添加动画处理事件
        addHandle: function(evt, callback) {
            var nevt = {
                name: evt,
                callback: callback
            };
            if (!(evt in this.events)) 
                this.events[evt] = [];
            this.events[evt].push(nevt);
        },
        // 注册动画
        registerAnimation: function() {
            // 触发所有tick事件
            var events = this.events;

            var evt = events['tick'];
            for (var evi=0;evi<evt.length;++evi) {
                var ev=evt[evi];
                ev.callback.call(this, ev);
            }

            var self = this;
            var animation = function() {
                self.registerAnimation.call(self)
            }
            window.requestAnimFrame(animation);
        }
    }

    window.animation = new Animation;
})();
