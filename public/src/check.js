/*
 * @fileOverview 客户端环境检测
 * @version 0.01
 * @author minggangqiu
 */
(function() {
    function Check() {
        this.checkChromeWord = "由于goole chrome浏览器有较好的浏览质量，\
                                因此我们的网站仅支持使用goole chrome，望谅解。";

        this.isChrome = window
            .navigator
            .userAgent
            .indexOf("Chrome") !== -1;
    };

    Check.prototype = {
        checkChrome: function() {
            if (!this.isChrome) {
                alert(this.checkChromeWord);
                return false;
            }
            return true;
        }
    };

    window.check = new Check;
})();
