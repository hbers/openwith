Components.utils.import('resource://gre/modules/Services.jsm');
Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');

let OpenWith = {

	locations: [],

	onLoad: function() {
		window.removeEventListener('load', OpenWith.onLoad, false);
		OpenWith.init();
	},

	init: function() {
		Components.utils.import('resource://openwith/openwith.jsm');

		let contextMenu = document.getElementById('mailContext');
		contextMenu.addEventListener('popupshowing', this.popupShowing, false);
		contextMenu.addEventListener('popuphidden', this.popupHidden, false);

		let separator = document.getElementById('mailContext-sep-open-browser') || document.getElementById('mailContext-sep-link');

		/** context menu (links) **/
		this.contextMenuLinkPlaceholder = document.getElementById('openwith-contextmenulinkplaceholder');
		this.contextMenuLinkItems = [];
		this.locations.push({
			prefName: 'contextmenulink',
			targetType: OpenWithCore.TARGET_LINK,
			container: this.contextMenuLinkItems
		});
		contextMenu.insertBefore(this.contextMenuLinkPlaceholder, separator);

		/** context menu (links) submenu **/
		this.contextLinkSubmenu = document.getElementById('openwith-contextlinksubmenu');
		this.contextLinkSubmenuPopup = document.getElementById('openwith-contextlinksubmenupopup');
		this.locations.push({
			prefName: 'contextmenulink.submenu',
			targetType: OpenWithCore.TARGET_LINK,
			container: this.contextLinkSubmenuPopup
		});
		contextMenu.insertBefore(this.contextLinkSubmenu, separator);

		OpenWithCore.loadList(false);
		OpenWith.loadLists();

		Services.obs.addObserver(this, 'openWithListChanged', true);
		Services.obs.addObserver(this, 'openWithLocationsChanged', true);
	},

	QueryInterface: XPCOMUtils.generateQI([
		Components.interfaces.nsIObserver,
		Components.interfaces.nsISupportsWeakReference,
		Components.interfaces.nsISupports
	]),

	observe: function(subject, topic, data) {
		OpenWith.loadLists();
	},

	loadLists: function() {
		this.emptyList = OpenWithCore.list.length == 0;
		OpenWithCore.refreshUI(document, this.locations, {});
	},

	popupShowing: function(event) {
		if (event.target != this) {
			return;
		}
		let contextMenuLinkPref = OpenWithCore.prefs.getBoolPref('contextmenulink');
		let contextSubmenuLinkPref = OpenWithCore.prefs.getBoolPref('contextmenulink.submenu');

		// from http://mxr.mozilla.org/mozilla-central/source/browser/base/content/nsContextMenu.js
		let shouldShow = !(gContextMenu.isContentSelected || gContextMenu.onLink ||
			gContextMenu.onImage || gContextMenu.onCanvas || gContextMenu.onVideo ||
			gContextMenu.onAudio || gContextMenu.onTextInput);

		OpenWith.contextMenuLinkPlaceholder.hidden = true;
		OpenWith.contextLinkSubmenu.hidden = !contextSubmenuLinkPref ||
					OpenWith.emptyList || !gContextMenu.onLink || gContextMenu.onMailtoLink;

		if (contextMenuLinkPref && gContextMenu.onLink && !gContextMenu.onMailtoLink) {
			let next = OpenWith.contextMenuLinkPlaceholder.nextSibling;
			for (let item of OpenWith.contextMenuLinkItems) {
				if ('__MenuEdit_insertBefore_orig' in this) {
					this.__MenuEdit_insertBefore_orig(item, next);
				} else {
					this.insertBefore(item, next);
				}
			}
		}
	},

	popupHidden: function(event) {
		if (event.target != this) {
			return;
		}

		OpenWith.contextMenuLinkPlaceholder.hidden = false;

		let next = OpenWith.contextMenuLinkPlaceholder.nextSibling;
		while (next && next.className.indexOf('openwith') == 0) {
			if ('__MenuEdit_removeChild_orig' in this) {
				this.__MenuEdit_removeChild_orig(next);
			} else {
				this.removeChild(next);
			}
			next = OpenWith.contextMenuLinkPlaceholder.nextSibling;
		}
	}
};

window.addEventListener('load', OpenWith.onLoad, false);
