function Barfix(ver) {
    var _bx = this;

    _bx.init = function () {
    }

    var doReplaceLoopItems = function (templateContainer, listName, i) {
        var dataValues = $(templateContainer).find('[data-loop], [data-loop-keep], [data-if], [data-bind], [data-bind-once], [data-attr], [data-attr-once]');
        dataValues.push(templateContainer);
        dataValues.each(function () {
            //if ($(this).closest('[module]').attr('data-checked') == "true") return;
            if ($(this).closest('[data-loop-template]').length > 0) return;

            var value;

            value = $(this).attr('data-loop');
            if (value) $(this).attr('data-loop', value.replace(/#item/gi, listName + '[' + i + ']').replace(/#index/gi, i));

            value = $(this).attr('data-loop-keep');
            if (value) $(this).attr('data-loop-keep', value.replace(/#item/gi, listName + '[' + i + ']').replace(/#index/gi, i));

            value = $(this).attr('data-if');
            if (value) $(this).attr('data-if', value.replace(/#item/gi, listName + '[' + i + ']').replace(/#index/gi, i));

            value = $(this).attr('data-bind');
            if (value) $(this).attr('data-bind', value.replace(/#item/gi, listName + '[' + i + ']').replace(/#index/gi, i));

            value = $(this).attr('data-bind-once');
            if (value) $(this).attr('data-bind-once', value.replace(/#item/gi, listName + '[' + i + ']').replace(/#index/gi, i));

            value = $(this).attr('data-attr');
            if (value) $(this).attr('data-attr', value.replace(/#item/gi, listName + '[' + i + ']').replace(/#index/gi, i));

            value = $(this).attr('data-attr-once');
            if (value) $(this).attr('data-attr-once', value.replace(/#item/gi, listName + '[' + i + ']').replace(/#index/gi, i));
        });
    };

    var doDataLoop = function (sender, isLoopPrepend) {
        $(sender).each(function () {
            var $loop = $(this);

            //if ($(this).closest('[module]').attr('data-checked') == "true") return;
            if ($loop.closest('[data-loop-template]').length > 0) return;

            var listName = $loop.attr('data-loop') || $loop.attr('data-loop-keep');
            var list = eval(listName);
            var template = $loop.children('[data-loop-template]');
            var loopSticks = $loop.children('[data-loop-stick]');
            if (template.length > 0) {

                if ($loop.attr('data-loop')) {
                    $loop.empty();
                    $loop.append(template);
                }

                //Doing Inner Loops
                var templateContainer = $(template.get(0).outerHTML).attr('data-loop-template', null);
                templateContainer.show();
                template.hide();

                var innerDataLoops = $(templateContainer).find('[data-loop], [data-loop-keep]');
                innerDataLoops.each(function () {
                    doDataLoop(this, isLoopPrepend);
                });

                if (list) {
                    if (isLoopPrepend) {
                        for (var i = list.length - 1; i >= 0; i--) {
                            var templateContainerClone = (i < list.length - 1) ? $(templateContainer.get(0).outerHTML) : $(templateContainer);
                            doReplaceLoopItems(templateContainerClone, listName, i);
                            $loop.prepend(/*templateTagName == 'TR' ?*/ templateContainerClone.get(0).outerHTML /*: templateContainerClone.html()*/);

                            templateContainerClone.remove();
                            templateContainerClone = undefined;
                        }
                    } else {
                        for (var i = 0; i < list.length; i++) {
                            var templateContainerClone = (i < list.length - 1) ? $(templateContainer.get(0).outerHTML) : $(templateContainer);
                            doReplaceLoopItems(templateContainerClone, listName, i);
                            $loop.append(/*templateTagName == 'TR' ?*/ templateContainerClone.get(0).outerHTML /*: templateContainerClone.html()*/);

                            templateContainerClone.remove();
                            templateContainerClone = undefined;
                        }
                    }
                }
                templateContainer.remove();
                templateContainer = undefined;
            }
            loopSticks.each(function () {
                var $loopStick = $(this);
                if ($loopStick.attr('data-loop-stick') == 'first') {
                    $loop.prepend($loopStick);
                }
                else {
                    $loop.append($loopStick);
                }
            });
        });
    };

    _bx.doRepeatLoopTemplate = function (sender, strDataLoop, strDataBind, strDataAttr) {
        var $sender = $(sender);
        var dataLoop = eval(strDataLoop);
        if (!dataLoop || dataLoop.length == 0) {
            $sender.empty();
            return;
        }

        var $loop = $sender.closest('[data-loop],[data-loop-keep]');
        var $template = $loop.children('[data-loop-template]');
        $sender.attr('data-loop', strDataLoop);
        var $templateClone = $template.clone();
        if (strDataAttr) {
            $templateClone.attr('data-attr', strDataAttr);
        }
        if (strDataBind) {
            $templateClone.attr('data-bind', strDataBind);
        }
        $sender.append($templateClone);
        _bx.evalBindings($sender);
    }

    _bx.evalBindings = function (selector, isLoopPrepend) {
        var $selector = $(selector);

        //debugger;
        var moduleElements = $selector.find('module');
        var notTemplatedModules = [];
        moduleElements.each(function () {
            var $module = $(this);
            if (!$module.attr('data-loop-template') && $module.parents('[data-loop-template]').length == 0) {
                notTemplatedModules.push($module);
            }
        });
        //if ($(selector).find('module').length) {
        if (notTemplatedModules.length) {
            window.setTimeout(function () {
                _bx.evalBindings(selector, isLoopPrepend);
            }, 100);
            return;
        }

        var dataLoops = $selector.find('[data-loop], [data-loop-keep]');
        $selector.each(function () {
            if (this.hasAttribute('data-loop') || this.hasAttribute('data-loop-keep')) {
                dataLoops.push($selector);
            }
        });
        dataLoops.each(function () {
            doDataLoop(this, isLoopPrepend);
        });

        var dataIfs = $selector.find('[data-if]');
        dataIfs.each(function () {
            var $this = $(this);
            //if ($this.closest('[module]').attr('data-checked') == "true") return;
            if ($this.closest('[data-loop-template]').length > 0) return;

            //debugger;
            var condition = $this.attr('data-if');
            if (eval(condition)) {
                var children = $this.children();
                for (var i = children.length - 1; i >= 0; i--) {
                    $this.after($(children[i]).clone());
                }
            }
            $this.remove();
        });

        var dataAttrs = $selector.find('[data-attr], [data-attr-once]');
        dataAttrs.each(function () {
            //if ($(this).closest('[module]').attr('data-checked') == "true") return;
            if ($(this).closest('[data-loop-template]').length > 0) return;

            var dataAttr = $(this).attr('data-attr') || $(this).attr('data-attr-once');
            var parts = dataAttr.split('::');
            for (var i = 0; i < parts.length; i++) {
                var columnIndex = parts[i].indexOf(':');
                var attr = parts[i].substr(0, columnIndex).trim();
                var value = parts[i].substr(columnIndex + 1).trim();

                try {
                    eval('$(this).attr("' + attr + '", ' + value + ')');
                } catch (ex) {
                    //debugger;
                    console.error(ex);
                }
            }
            if ($(this).attr('data-attr-once')) {
                $(this).attr('data-attr-once', null);
            }
            if (this.hasAttribute("module")) {
                $(this).attr('data-checked', 'false');
            }
        });

        var dataBinds = $selector.find('[data-bind], [data-bind-once]');
        dataBinds.each(function () {
            //if ($(this).closest('[module]').attr('data-checked') == "true") return;
            if ($(this).closest('[data-loop-template]').length > 0) return;

            var dataBind = $(this).attr('data-bind') || $(this).attr('data-bind-once');
            var parts = dataBind.split('::');
            for (var i = 0; i < parts.length; i++) {
                var columnIndex = parts[i].indexOf(':');
                var func = parts[i].substr(0, columnIndex).trim();
                var value = parts[i].substr(columnIndex + 1).trim();

                try {
                    switch (func) {
                        case "do":
                            eval(value);
                            break;
                        default:
                            eval('$(this).' + func + '(' + value + ')');
                    }
                } catch (ex) {
                    //debugger;
                    console.error(ex);
                }
            }
            if ($(this).attr('data-bind-once')) {
                $(this).attr('data-bind-once', null);
            }
            if (this.hasAttribute("module")) {
                $(this).attr('data-checked', 'false');
            }
        });
    }

    _bx.evalBack = function (sender) {
        var dataBind = $(sender).attr('data-bind');
        if (dataBind.length) {
            var parts = dataBind.split('::');
            for (var i = 0; i < parts.length; i++) {
                var columnIndex = parts[i].indexOf(':');
                var func = parts[i].substr(0, columnIndex).trim();
                var value = parts[i].substr(columnIndex + 1).trim();

                try {
                    eval(value + ' = $(sender).' + func + '()');
                } catch (ex) {
                    //debugger;
                    console.error(ex);
                }
            }
        }
    };

    _bx.evalBackAttr = function (sender) {
        var dataAttr = $(sender).attr('data-attr');
        if (dataAttr.length) {
            var parts = dataAttr.split('::');
            for (var i = 0; i < parts.length; i++) {
                var columnIndex = parts[i].indexOf(':');
                var attr = parts[i].substr(0, columnIndex).trim();
                var value = parts[i].substr(columnIndex + 1).trim();

                try {
                    eval(value + ' = $(sender).attr("' + attr + '")');
                } catch (ex) {
                    //debugger;
                    console.error(ex);
                }
            }
        }
    };

    _bx.init();

    return _bx;
};

var barfix = new Barfix();