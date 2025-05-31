function Barfix() {
    var _bx = this;

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //  Data Binding Functions...
    //
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //  Module Loading Functions...
    //
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    var moduleFetched = function (type) {
        if (window[type]) {

            if (activeModules.indexOf(type) < 0) {
                activeModules.push(type);
            }
            setLoadQueue(type, true);

            eval(type + '.init()');
        }
        else {
            setTimeout(function () {
                moduleFetched(type);
            }, 100);
        }
    };

    appCommon.fetchModules = function (types) {
        var key = JSON.stringify(types).replace(/ /gi, '_');;
        _isAllQueued['appCommon.importModules.' + key] = false;

        for (var i = 0; i < types.length; i++) {
            var type = types[i];

            setLoadQueue(type, false);

            var moduleSourceClass = '.modules-container .' + type;
            var moduleSource = $(document).find(moduleSourceClass);
            if (moduleSource.length) {
                moduleFetched(type);
            }
            else {
                $('.modules-container').append($('<div class="' + type + '"></div>'));
                moduleSource = $(document).find(moduleSourceClass);
                appCommon.loadHtml(moduleSourceClass, plusVersion('pages/modules/' + type + '.html'), function (type) {
                    moduleFetched(type);
                });
            }
        }

        _isAllQueued['appCommon.importModules.' + key] = true;
    };

    appCommon.loadActiveModules = function () {
        //debugger;
        $('.page-container [data-loop-template="true"]').each(function () {
            if ($(this).css('display') != 'none') {
                $(this).closest('[module]').attr('data-checked', 'false');
            }
        });

        //$('.page-container [media-id="-1"]').each(function () {
        //    var parentModule = $(this).closest('[module]');
        //    if (parentModule) {
        //        parentModule.attr('data-checked', 'false');
        //    }
        //});

        for (var i = 0; i < activeModules.length; i++) {
            var type = activeModules[i];
            var $module = $('.modules-container').children('.' + type);
            if ($module.length == 0) continue;

            $('.page-container module[type="' + type + '"]').each(function () {
                var $this = $(this);
                if ($this.attr('data-loop-template') || $this.parents('[data-loop-template]').length) return;

                var $moduleClone = $($module.children()[0].outerHTML);

                //Copying module attributes
                $.each(this.attributes, function (i, attrib) {
                    if (attrib.name !== 'type' && attrib.name !== 'container') {
                        if (attrib.name === 'class') {
                            $moduleClone.addClass(attrib.value);
                        } else {
                            $moduleClone.attr(attrib.name, attrib.value);
                        }
                    }
                });

                $this.after($moduleClone);
                $this.remove();
            });

            $('.page-container [module="' + type + '"]').each(function () {
                var $this = $(this);
                if ($this.attr('data-checked') == 'true' || $this.closest('[data-loop-template]').length) return;

                eval(type + '.checkModule(this)');
            });

            var editorOf = $($module.children()[0]).attr('editor-of');
            if (editorOf) {
                //debugger;
                $('.page-container [module="' + editorOf + '"]').each(function () {
                    var $this = $(this);
                    if ($this.attr('data-checked') != 'true' || $this.attr('editor') == 'loaded') return;

                    var $moduleClone = $($module.children()[0].outerHTML);
                    $this.append($moduleClone);
                    $this.attr('editor', 'loaded');
                });
            }
        }
        //});
    };
    moduleLoaderTimer = window.setInterval(appCommon.loadActiveModules, 100);

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //  Page Loading Functions...
    //
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    let myLoadQueue = {};
    let _isAllQueued = {};
    let activeModules = [];
    let activePageUrl = '';
    let moduleLoaderTimer;

    _bx.loadHtml = function (container, url, callback) {
        var key = (url +container).replace(/ /gi, '_');
        if (myLoadQueue[key]!= null) return;
        setLoadQueue(key, false);

        $(container).load(url, function () {
            if (_hrefPrefix) {
                $(container).find('a').each(function (i) {
                    var href = $(this).attr('href');
                    if (href) {
                        $(this).attr('href', _hrefPrefix + href);
                    }
                });
            }
            setLoadQueue(key, true);
            if (callback) callback($(container).attr('class'));
        });
    };

    var setLoadQueue = function (url, isLoaded) {
        if (isLoaded && !myLoadQueue.hasOwnProperty(url)) return;

        myLoadQueue[url] = isLoaded;
        //alert(url + ' : ' + isLoaded);
        checkAllLoaded();
    };

    var checkAllLoaded = function () {
        //if (!isAllQueued) return;
        for (var key in _isAllQueued) {
            if (!_isAllQueued[key]) return;
        }
        _isAllQueued = {};

        for (var key in myLoadQueue) {
            if (!myLoadQueue[key]) return;
        }
        myLoadQueue = {};

        //documentReady();

        //All Files loaded
        $('.loading-panel-fill').fadeOut();
        $('.loading-panel').fadeOut();
    };

    appCommon.enqueueImage = function (selector) {
        var img = $(selector);
        if (!img.attr('src')) return;

        setLoadQueue('img.src=' + img.attr('src'), false);

        img.one("load", function () {
            setLoadQueue('img.src=' + img.attr('src'), true);
        }).on("error", function () {
            setLoadQueue('img.src=' + img.attr('src'), true);
        }).each(function () {
            if (this.complete) $(this).load();
        });
    };

    appCommon.enqueueAllImages = function (container) {
        _isAllQueued['appCommon.enqueueAllImages' + container] = false;

        var imgs = $(container).find('img');
        for (var i = 0; i < imgs.length; i++) {
            appCommon.enqueueImage(imgs[i]);
        }

        _isAllQueued['appCommon.enqueueAllImages' + container] = true;
        checkAllLoaded();
    };

    appCommon.recheckElement = function (element) {
        window.clearInterval(moduleLoaderTimer);
        $(element).attr('data-checked', 'false');
        moduleLoaderTimer = window.setInterval(appCommon.loadActiveModules, 100);
    };

    appCommon.recheckAllElements = function (selector) {
        if (!selector) selector = '.page-container';
        appCommon.recheckElement(selector + ' [data-checked="true"]');
    };

    /////////////////////////////////////////////////
    _bx.init = function () {
    }

    _bx.init();

    return _bx;
};

var barfix = new Barfix();