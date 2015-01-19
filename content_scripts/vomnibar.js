// Generated by CoffeeScript 1.8.0
(function() {
  "use strict";
  var BackgroundCompleter, Vomnibar, VomnibarUI;

  Vomnibar = {
    vomnibarUI: null,
    defaultRefreshInterval: 500,
    completers: {},
    getCompleter: function(name) {
      if (!(name in this.completers)) {
        this.completers[name] = new BackgroundCompleter(name);
      }
      return this.completers[name];
    },
    activateWithCompleter: function(completerName, selectFirstResult, forceNewTab, initialQueryValue) {
      var completer = this.getCompleter(completerName), vomnibarUI = this.vomnibarUI;
      if (!vomnibarUI) {
        vomnibarUI = this.vomnibarUI = VomnibarUI;
        vomnibarUI.init();
      }
      vomnibarUI.initialSelectionValue = selectFirstResult ? 0 : -1;
      vomnibarUI.completer = completer;
      vomnibarUI.refreshInterval = this.defaultRefreshInterval || 250;
      vomnibarUI.forceNewTab = forceNewTab ? true : false;
      vomnibarUI.reset(initialQueryValue);
    },
    activate: function() {
      this.activateWithCompleter("omni");
    },
    activateInNewTab: function() {
      this.activateWithCompleter("omni", false, true);
    },
    activateTabSelection: function() {
      this.activateWithCompleter("tabs", true);
    },
    activateBookmarks: function() {
      this.activateWithCompleter("bookmarks", true);
    },
    activateBookmarksInNewTab: function() {
      this.activateWithCompleter("bookmarks", true, true);
    },
    activateHistory: function() {
      this.activateWithCompleter("history", true);
    },
    activateHistoryInNewTab: function() {
      this.activateWithCompleter("history", true, true);
    },
    activateEditUrl: function() {
      this.activateWithCompleter("omni", false, false, window.location.href);
    },
    activateEditUrlInNewTab: function() {
      this.activateWithCompleter("omni", false, true, window.location.href);
    },
    getUI: function() {
      return this.vomnibarUI;
    }
  };

  VomnibarUI = {
    box: null,
    completer: null,
    completionInput: {
      url: "",
      action: "navigateToUrl",
      performAction: null
    },
    completionList: null,
    completions: null,
    forceNewTab: false,
    handlerId: 0,
    initialSelectionValue: -1,
    input: null,
    isSelectionChanged: false,
    onUpdate: null,
    openInNewTab: false,
    refreshInterval: 0,
    selection: -1,
    timer: 0,
    _initStep: [0],
    show: function() {
      if (this._initStep[0] !== 2) {
        this._initStep.push(this.show);
        return;
      }
      this.box.style.display = "";
      this.input.value = this.completionInput.url;
      this.input.focus();
      this.input.addEventListener("input", this.onInput);
      this.completionList.addEventListener("click", this.onClick);
      this.box.addEventListener("mousewheel", DomUtils.suppressPropagation);
      this.box.addEventListener("keyup", this.onKeyEvent);
      this.handlerId = handlerStack.push({
        keydown: this.onKeydown
      });
    },
    hide: function() {
      if (this.timer) {
        window.clearTimeout(this.timer);
        this.timer = 0;
      }
      this.box.style.display = "none";
      this.input.blur();
      this.completionList.innerHTML = "";
      handlerStack.remove(this.handlerId);
      this.handlerId = 0;
      this.input.removeEventListener("input", this.onInput);
      this.completionList.removeEventListener("click", this.onClick);
      this.box.removeEventListener("mousewheel", DomUtils.suppressPropagation);
      this.box.removeEventListener("keyup", this.onKeyEvent);
      this.onUpdate = null;
      this.completions = null;
    },
    reset: function(input) {
      this.completionInput.url = input || "";
      this.update(0, this.show);
    },
    update: function(updateDelay, callback) {
      this.onUpdate = callback;
      if (typeof updateDelay === "number") {
        if (this.timer) {
          window.clearTimeout(this.timer);
          this.timer = 0;
        }
        if (updateDelay <= 0) {
          this.onTimer();
          return;
        }
      } else if (this.timer) {
        return;
      } else {
        updateDelay = this.refreshInterval;
      }
      this.timer = setTimeout(this.onTimer, updateDelay);
    },
    populateUI: function() {
      this.completionList.innerHTML = this.renderItems(this.completions);
      if (this.completions.length > 0) {
        this.completionList.style.display = "";
        this.selection = (this.completions[0].type === "search") ? 0 : this.initialSelectionValue;
      } else {
        this.completionList.style.display = "none";
        this.selection = -1;
      }
      this.updateSelection();
      this.isSelectionChanged = false;
    },
    updateSelection: function() {
      for (var _i = 0, _ref = this.completionList.children, selected = this.selection; _i < _ref.length; ++_i) {
        (_i != selected) && _ref[_i].classList.remove("vimS");
      }
      if (selected >= 0 && selected < _ref.length) {
        _ref = _ref[selected];
        _ref.classList.add("vimS");
        _ref.scrollIntoViewIfNeeded();
      }
    },
    actionFromKeyEvent: function(event) {
      if (KeyboardUtils.isEscape(event)) {
        return "dismiss";
      } else if (event.keyCode === keyCodes.enter) {
        return "enter";
      }
      var key = KeyboardUtils.getKeyChar(event);
      if (key === "up" || (event.shiftKey && event.keyCode === keyCodes.tab)
          || (event[keyCodes.modifier] && (key === "k" || key === "p"))) {
        return "up";
      } else if (key === "down" || (event.keyCode === keyCodes.tab && !event.shiftKey)
          || (event[keyCodes.modifier] && (key === "j" || key === "n"))) {
        return "down";
      }
      return "";
    },
    onKeydown: function(event) {
      var action = this.actionFromKeyEvent(event);
      if (action) {
        this.openInNewTab = this.forceNewTab || (event.shiftKey || event.ctrlKey || event.metaKey);
      } else {
        if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey || this.timer) {
        }
        else if (event.keyCode === 32) {
          if ((this.selection >= 0 && this.isSelectionChanged || this.completions.length <= 1) //
            && this.input.value.endsWith("  ")) {
            action = "enter";
          }
        }
        else if (this.selection >= 0 && this.isSelectionChanged || document.activeElement !== this.input) {
          var n = action = event.keyCode - 48;
          if (n === 0) { n = 10; }
          if (n > 0 && n <= this.completions.length) {
            this.selection = n - 1;
            action = "enter";
          } else {
            action = "";
          }
        }
        if (!action) {
          return true;
        }
        this.openInNewTab = this.forceNewTab;
      }
      this.onAction(action);
      KeydownEvents.push(event);
      return false;
    },
    onAction: function(action) {
      switch(action) {
      case "dismiss": this.hide(); break;
      case "up":
        this.isSelectionChanged = true;
        if (this.selection <= -1) this.selection = this.completions.length;
        this.selection -= 1;
        if (this.selection == -1) this.input.focus();
        this.input.value = this.completions[this.selection].url;
        this.updateSelection();
        break;
      case "down":
        this.isSelectionChanged = true;
        this.selection += 1;
        if (this.selection >= this.completions.length) {
          this.selection = -1;
          this.input.focus();
        }
        this.input.value = this.completions[this.selection].url;
        this.updateSelection();
        break;
      case "enter":
        action = function() {
          this.completions[this.selection].performAction(this);
          this.hide();
        };
        if (this.timer) {
          this.update(0, action);
        } else if (this.selection >= 0 || this.input.value.trim().length > 0) {
          action.call(this);
        }
        break;
      default: break;
      }
    },
    onClick: function(event) {
      var el = event.target, ulist = this.completionList;
      while(el && el.parentElement != ulist) { el = el.parentElement; }
      for (var _i = 0, _ref = ulist.children; _i < _ref.length; ++_i) {
        if (_ref[_i] === el) {
          break;
        }
      }
      if (_i < _ref.length) {
        this.selection = _i;
        this.openInNewTab = this.forceNewTab || (event.shiftKey || event.ctrlKey || event.metaKey);
        this.onAction("enter");
      }
      DomUtils.suppressEvent(event);
    },
    onInput: function() {
      if (this.completions[this.selection].url.trimRight() != this.input.value.trim()) {
        this.update();
      }
      this.completionInput.url = this.input.value.trimLeft();
      return false;
    },
    onTimer: function() {
      this.timer = 0;
      this.completer.filter(this.completionInput.url, this.onCompletions);
    },
    onCompletions: function(completions) {
      if (completions) {
        completions[-1] = this.completionInput;
        this.completions = completions;
      }
      if (this._initStep[0] !== 2) {
        this._initStep.push(this.onCompletions);
        return;
      }
      this.populateUI();
      if (this.onUpdate) {
        var onUpdate = this.onUpdate;
        this.onUpdate = null;
        onUpdate.call(this);
      }
    },
    onKeyEvent: function(event) {
      if (event.altKey || KeyboardUtils.isFunctionKey(event)) {
        return;
      }
      else if ((event[keyCodes.modifier] || event.shiftKey) && (event.keyCode == keyCodes.left || event.keyCode == keyCodes.right)) {
      }
      else if (event.ctrlKey || event.metaKey || (event.shiftKey && !event.keyIdentifier.startsWith("U+"))) {
        return;
      }
      DomUtils.suppressEvent(event);
    },
    init: function() {
      if (this._initStep[0]) { return; }
      this.box = document.createElement("div");
      this.box.className = "vimB vimR";
      this.box.id = "vomnibar";
      this.box.style.display = "none";
      document.body.appendChild(this.box);
      mainPort.postMessage({
        handler: "initVomnibar"
      }, this.init_dom.bind(this));
      this._initStep[0] = 1;
      this.completionInput.performAction = BackgroundCompleter.performAction;
      this.onKeydown = this.onKeydown.bind(this);
      this.onInput = this.onInput.bind(this);
      this.onClick = this.onClick.bind(this);
      this.onTimer = this.onTimer.bind(this);
      this.onCompletions = this.onCompletions.bind(this);
      this.onKeyEvent = this.onKeyEvent.bind(this);
    },
    init_dom: function(html) {
      this._initStep[0] = 2;
      this.box.innerHTML = html;
      this.input = this.box.querySelector("#vomnibarInput");
      this.completionList = this.box.querySelector("#vomnibarList");
      this.renderItems = Utils.makeListRender(this.box.querySelector("#vomnibarItemTemplate").innerHTML);
      for (var i = 1, ref = this._initStep, len = ref.length; i < len; i++) {
        ref[i].call(this);
      }
      this._initStep = [2];
    },
    renderItems: null
  };

  function BackgroundCompleter(name) {
    this.name = name;
    this.refresh();
    this.getPort();
  }

  BackgroundCompleter.prototype.getPort = function() {
    var port = BackgroundCompleter._port;
    if (!port) {
      try {
        port = BackgroundCompleter._port = chrome.runtime.connect({ name: "filterCompleter" });
        port.onDisconnect.addListener(BackgroundCompleter._clearPort);
        port.onMessage.addListener(BackgroundCompleter._onFilter.bind(BackgroundCompleter));
      } catch (e) {
        BackgroundCompleter._port = null;
        return mainPort.fakePort;
      }
    }
    return port;
  };

  BackgroundCompleter.prototype.refresh = function() {
    mainPort.postMessage({
      handler: "refreshCompleter",
      name: this.name
    });
  };

  BackgroundCompleter.whiteSpaceRegex = /\s+/g;
  BackgroundCompleter.prototype.filter = function(query, callback) {
    BackgroundCompleter._id = Utils.createUniqueId();
    BackgroundCompleter._callback = callback;
    this.getPort().postMessage({
      name: this.name,
      id: BackgroundCompleter._id,
      query: query.replace(BackgroundCompleter.whiteSpaceRegex, ' ').trim()
    });
  };

  extend(BackgroundCompleter, {
    _port: null,
    _id: 0,
    _callback: null,
    _clearPort: function() {
      BackgroundCompleter._port = null;
    },
    _onFilter: function(msg) {
      if (this._id != msg.id) { return; }
      this.maxCharNum = Math.ceil((window.innerWidth * 0.8 - 70) / 7.72);
      var prepare = this.prepareToRender, act = this.performAction,
      results = msg.results.map(function(result) {
        prepare.call(result);
        result.action = (result.type === "tab") ? "switchToTab"
          : ("sessionId" in result) ? "restoreSession"
          : "navigateToUrl";
        result.performAction = act;
        return result;
      });
      var callback = this._callback;
      this._callback = null;
      if (callback) {
        callback(results);
      }
    },

    showRelevancy: false,
    maxCharNum: 160,
    showFavIcon: window.location.protocol.startsWith("chrome"),
    cutUrl: function(string, ranges, strCoded) {
      if (ranges.length == 0 || string.startsWith("javascript:")) {
        if (string.length <= BackgroundCompleter.maxCharNum) {
          return Utils.escapeHtml(string);
        } else {
          return Utils.escapeHtml(string.substring(0, BackgroundCompleter.maxCharNum - 3)) + "...";
        }
      }
      var out = [], cutStart = -1, temp, lenCut, i, end, start;
      if (! (string.length <= BackgroundCompleter.maxCharNum)) {
        cutStart = strCoded.indexOf("://");
        if (cutStart >= 0) {
          cutStart = strCoded.indexOf("/", cutStart + 4);
          if (cutStart >= 0) {
            temp = string.indexOf("://");
            cutStart = string.indexOf("/", (temp < 0 || temp > cutStart) ? 0 : (temp + 4));
          }
        }
      }
      cutStart = (cutStart < 0) ? string.length : (cutStart + 1);
      for(i = 0, lenCut = 0, end = 0; i < ranges.length; i += 2) {
        start = ranges[i];
        temp = (end >= cutStart) ? end : cutStart;
        if (temp + 20 > start) {
          out.push(Utils.escapeHtml(string.substring(end, start)));
        } else {
          out.push(Utils.escapeHtml(string.substring(end, temp + 10)));
          out.push("...");
          out.push(Utils.escapeHtml(string.substring(start - 6, start)));
          lenCut += start - temp - 19;
        }
        end = ranges[i + 1];
        out.push("<span class=\"vimB vimI vimOmniS\">");
        out.push(Utils.escapeHtml(string.substring(start, end)));
        out.push("</span>");
      }
      temp = BackgroundCompleter.maxCharNum + lenCut;
      if (! (string.length > temp)) {
        out.push(Utils.escapeHtml(string.substring(end)));
      } else {
        out.push(Utils.escapeHtml(string.substring(end,
          (temp - 3 > end) ? (temp - 3) : (end + 10))));
        out.push("...");
      }
      return out.join("");
    },
    prepareToRender: function() {
      this.text = BackgroundCompleter.cutUrl(this.text, this.textSplit, this.url);
      if ((BackgroundCompleter.showFavIcon || this.type === "tab") && this.url.indexOf("://") >= 0) {
        this.favIconUrl = " vomnibarIcon\" style=\"background-image: url(" + (this.favIconUrl ||
          ("chrome://favicon/size/16/" + this.url)) + ")";
      } else {
        this.favIconUrl = "";
      }
      if (BackgroundCompleter.showRelevancy) {
        this.relevancy = "\n\t\t\t<span class=\"vimB vimI vomnibarRelevancy\">" + this.relevancy + "</span>";
      } else {
        this.relevancy = "";
      }
    },
    performAction: function() {
      var action = BackgroundCompleter.completionActions[this.action] || this.action;
      if (typeof action !== "function") return;
      return action.apply(this, arguments);
    },
    completionActions: {
      navigateToUrl: function(data) {
        if (this.url.startsWith("javascript:")) {
          var script = document.createElement('script');
          script.textContent = decodeURIComponent(this.url.slice("javascript:".length));
          (document.documentElement || document.body || document.head).appendChild(script);
        } else {
          mainPort.postMessage({
            handler: data.openInNewTab ? "openUrlInNewTab" : "openUrlInCurrentTab",
            url: this.url.trimRight()
          });
        }
      },
      switchToTab: function() {
        mainPort.postMessage({
          handler: "selectSpecificTab",
          sessionId: this.sessionId
        });
      },
      restoreSession: function() {
        mainPort.postMessage({
          handler: "restoreSession",
          sessionId: this.sessionId,
        });
      }
    }
  });

  (typeof exports !== "undefined" && exports !== null ? exports : window).Vomnibar = Vomnibar;

})();
