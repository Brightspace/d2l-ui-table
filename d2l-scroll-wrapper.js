/**
# D2L Scroll Wrapper

<link rel="import" href="d2l-scroll-wrapper.html">
<div>
	<d2l-scroll-wrapper
		id="scroll-wrapper"
		style="width: 300px"
		show-actions>
		 <div style="width: 350px; height: 100px">
			Stuff
		 </div>
	</d2l-scroll-wrapper>
</div>

## Usage
```
	<link rel="import" href="d2l-scroll-wrapper.html">
	The attributes are optional
	<d2l-scroll-wrapper
		id="scroll-wrapper"
		style="width: 300px">
		<div style="width: 350px">Stuff</div>
	</d2l-scroll-wrapper>
```
@demo ./demo/d2l-scroll-wrapper.html Scroll Wrapper Demo
*/
/*
  FIXME(polymer-modulizer): the above comments were extracted
  from HTML and may be out of place here. Review them and
  then delete this comment!
*/
import '@polymer/polymer/polymer-legacy.js';

import 'd2l-icons/tier1-icons.js';
import { IronResizableBehavior } from '@polymer/iron-resizable-behavior/iron-resizable-behavior.js';
import './d2l-sticky-element.js';
import './d2l-table-circle-button.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';
const $_documentContainer = document.createElement('template');

const SCROLL_DURATION = 500;
const SCROLL_AMOUNT = 0.8;

$_documentContainer.innerHTML = `<dom-module id="d2l-scroll-wrapper">
	<template strip-whitespace="">
		<style>
			:host {
				display: block;
				width: 100%;
				/* For sticky buttons. Prevents Stickyfill from forcing layout
				   changes by setting position itself */
				position: relative;
			}

			.wrapper {
				outline: none;
				overflow-x: auto;
				box-sizing: border-box;
			}

			:host([is-sticky]) .wrapper {
				overflow-x: initial;
			}

			.inner-wrapper {
				@apply --d2l-scroll-wrapper-inner;
			}

			:host([is-sticky][h-scrollbar]) .wrapper,
			:host([is-sticky][h-scrollbar][show-actions]) .wrapper {
				border-right: none;
			}
			:host([h-scrollbar][show-actions]) .wrapper {
				border-left: 1px dashed var(--d2l-color-mica);
				border-right: 1px dashed var(--d2l-color-mica);
			}

			:host([is-rtl][scrollbar-right][show-actions]) .wrapper,
			:host(:not([is-rtl])[scrollbar-left][show-actions]) .wrapper {
				border-left: none;
			}

			:host([is-rtl][scrollbar-left][show-actions]) .wrapper,
			:host(:not([is-rtl])[scrollbar-right][show-actions]) .wrapper {
				border-right: none;
			}

			.action {
				display: inline;
				top: 4px;
			}

			.sticky {
				display: none;
				height: 0;
				overflow: visible;
			}

			:host([is-rtl]) .left.action,
			.right.action {
				left: auto;
				right: -10px;
			}

			:host([is-rtl]) .right.action,
			.left.action {
				left: -10px;
				right: auto;
			}

			:host([is-rtl]) .left,
			.right {
				position: absolute;
				right: 0;
				left: auto;
			}
			:host([is-rtl]) .right,
			.left {
				position: absolute;
				left: 0;
				right: auto;
			}

			:host([is-sticky]) .right,
			:host([is-sticky]) .left {
				display: none !important;
			}

			:host([show-actions][h-scrollbar]) .sticky {
				display: block;
			}

			/* Hide the start/end buttons depending on the state */
			:host([show-actions][scrollbar-right]) .right.action,
			:host([show-actions][scrollbar-left]) .left.action {
				display: none;
			}
		</style>
		<d2l-sticky-element class="sticky" disabled="[[_stickyIsDisabled]]">
			<d2l-table-circle-button class="left action" icon="tier1:chevron-left" on-tap="handleTapLeft" aria-hidden="true" type="button"></d2l-table-circle-button>
			<d2l-table-circle-button class="right action" icon="tier1:chevron-right" on-tap="handleTapRight" aria-hidden="true" type="button"></d2l-table-circle-button>
		</d2l-sticky-element>
		<div id="wrapper" class="wrapper">
			<div class="inner-wrapper"><slot></slot></div>
		</div>
	</template>
	
</dom-module>`;

document.head.appendChild($_documentContainer.content);
var getScrollType = (function() {
	var type;

	try {
		type = sessionStorage.getItem('d2l-scroll-wrapper-rtl-scroll-type');

		if (typeof type !== 'string'
			|| (type !== 'default'
				&& type !== 'reverse'
				&& type !== 'negative'
			)) {
			type = null;
		}
	} catch (e) {
		type = null;
	}

	return function getScrollType() {
		if (type) {
			return type;
		}
		type = 'reverse';
		var div = document.createElement('div');
		div.innerHTML = '<div dir="rtl" style="font-size: 14px; width: 1px; height: 1px; position: absolute; top: -1000px; overflow: scroll">ABCD</div>';
		var definer = div.firstChild;
		document.body.appendChild(div);
		if (definer.scrollLeft > 0) {
			type = 'default';
		} else {
			definer.scrollLeft = 1;
			if (definer.scrollLeft === 0) {
				type = 'negative';
			}
		}
		document.body.removeChild(div);

		try {
			sessionStorage.setItem('d2l-scroll-wrapper-rtl-scroll-type', type);
		} catch (e) { /* noop */ }

		return type;
	};
})();
Polymer({
	is: 'd2l-scroll-wrapper',
	behaviors: [IronResizableBehavior],

	properties: {
		/** Whether this element has a horizontal scrollbar */
		hScrollbar: {
			type: Boolean,
			reflectToAttribute: true,
			notify: true,
			value: false,
			readOnly: true,
			observer: '_updateStyles'
		},

		/** Whether this element is scrolled to the left */
		scrollbarLeft: {
			type: Boolean,
			reflectToAttribute: true,
			notify: true,
			value: true,
			readOnly: true,
			observer: '_updateStyles'
		},

		/** Whether this element is scrolled to the right */
		scrollbarRight: {
			type: Boolean,
			reflectToAttribute: true,
			notify: true,
			value: true,
			readOnly: true,
			observer: '_updateStyles'
		},

		/** The browser doesn't change scroll behavior on RTL. Use for styling buttons and applying mixins on RTL. See scrollRtlReverse and scrollRtlNegative */
		scrollRtlDefault: {
			type: Boolean,
			notify: true,
			value: false,
			readOnly: true
		},
		/** The browser reverses the scrollLeft value on RTL */
		scrollRtlReverse: {
			type: Boolean,
			notify: true,
			value: false,
			readOnly: true
		},
		/** The browser negates the scrollLeft value on RTL */
		scrollRtlNegative: {
			type: Boolean,
			notify: true,
			value: false,
			readOnly: true
		},
		isRtl: {
			type: Boolean,
			value: false,
			computed: '_calculateRTL(isAttached)',
			reflectToAttribute: true
		},

		isSticky: {
			type: Boolean,
			value: false,
			reflectToAttribute: true
		},

		showActions: {
			type: Boolean,
			reflectToAttribute: true
		},

		/** IE and Edge requires the value to be 1 in some cases **/
		/**
			Background: In some occasions in IE and Edge, there is a
			little deviation in the lowerScrollValue used in checkScrollThresholds for not being 0.
			I have seen it being 1 in IE and Edge. Resulting the scroll arrow icon being shown
			incorrectly when there is no overflow happening in UI.
		**/
		checkScrollDeltaValue: {
			type: Number,
			value: 0
		},
		_stickyIsDisabled: {
			type: Boolean,
			computed: '_computeStickyIsDisabled(scrollbarLeft, scrollbarRight)'
		}
	},

	attached: function() {
		// Defer the offsetWidth/scrollWidth calculations until after the page has rendered
		afterNextRender(this, function() {
			if (this.isAttached) {
				this.listen(this, 'iron-resize', 'checkScrollbar');
				this.listen(this.$.wrapper, 'scroll', 'checkScrollThresholds');
				this.checkScrollbar();
			}
		}.bind(this));
	},

	detached: function() {
		this.unlisten(this, 'iron-resize', 'checkScrollbar');
		this.unlisten(this.$.wrapper, 'scroll', 'checkScrollThresholds');
	},

	_updateStyles: function() {
		this.updateStyles();
	},

	_calculateRTL: function(isAttached) {
		var isRTL = false;

		if (isAttached) {
			if (this.$$('[dir="rtl"] *')) {
				isRTL = true;
			} else {
				try {
					isRTL = !!this.$$(':host-context([dir="rtl"]) *');
				} catch (e) {
					isRTL = false;
				}
			}
		}

		if (isRTL) {
			this._checkRTLScrollType();
		}

		return isRTL;
	},

	_checkRTLScrollType: function() {
		var scrollType = getScrollType();

		this._setScrollRtlDefault(scrollType === 'default');
		this._setScrollRtlReverse(scrollType === 'reverse');
		this._setScrollRtlNegative(scrollType === 'negative');
	},

	/* Scrolls to the left. Right when dir=rtl */
	handleTapLeft: function() {
		var scrollDistance = this.$.wrapper.clientWidth * SCROLL_AMOUNT;
		this.scrollDistance(-scrollDistance, true);
	},

	/* Scrolls to the right. Left when dir=rtl */
	handleTapRight: function() {
		var scrollDistance = this.$.wrapper.clientWidth * SCROLL_AMOUNT;
		this.scrollDistance(scrollDistance, true);
	},

	/* Scrolls the set distance. positive === right, negative === left. Reversed when dir=rtl */
	scrollDistance: function(distance, smooth) {
		if (this.isRtl) {
			if (this.scrollRtlReverse) {
				this.scroll(this.$.wrapper.scrollLeft + distance, smooth);
			} else {
				this.scroll(this.$.wrapper.scrollLeft - distance, smooth);
			}
		} else {
			this.scroll(this.$.wrapper.scrollLeft + distance, smooth);
		}
	},

	/* Sets scrollLeft to the argument. Optionally scroll smoothly. Behavior depends when dir=rtl */
	scroll: function(left, smooth) {
		if (smooth) {
			var easingFn = function easeOutQuad(t, b, c, d) {
				t /= d;
				return -c * t * (t - 2) + b;
			};
			var animationId = Math.random();
			var startTime = Date.now();
			var currentScrollLeft = this.$.wrapper.scrollLeft;
			var deltaScrollLeft = left - currentScrollLeft;
			this._currentAnimationId = animationId;
			(function updateFrame() {
				var now = Date.now();
				var elapsedTime = now - startTime;
				if (elapsedTime > SCROLL_DURATION) {
					this.$.wrapper.scrollLeft = left;
				} else if (this._currentAnimationId === animationId) {
					this.$.wrapper.scrollLeft = easingFn(elapsedTime, currentScrollLeft, deltaScrollLeft, SCROLL_DURATION);
					requestAnimationFrame(updateFrame.bind(this));
				}
			}).call(this);
		} else {
			this.$.wrapper.scrollLeft = left;
		}
	},

	checkScrollbar: function() {
		var hScrollbar = Math.abs(this.$.wrapper.offsetWidth - this.$.wrapper.scrollWidth);

		this._setHScrollbar(hScrollbar > 0 && hScrollbar !== this.checkScrollDeltaValue) ;
		this.checkScrollThresholds();
	},

	checkScrollThresholds: function() {
		var lowerScrollValue = this.$.wrapper.scrollWidth - this.$.wrapper.offsetWidth - Math.abs(this.$.wrapper.scrollLeft);

		if (this.isRtl && this.scrollRtlDefault) {
			this._setScrollbarRight(this.$.wrapper.scrollLeft === 0);
			this._setScrollbarLeft(lowerScrollValue <= this.checkScrollDeltaValue);
		} else {
			this._setScrollbarLeft(this.$.wrapper.scrollLeft === 0);
			this._setScrollbarRight(lowerScrollValue <= this.checkScrollDeltaValue);
		}
	},

	_computeStickyIsDisabled: function(scrollbarLeft, scrollbarRight) {
		return Boolean(scrollbarLeft) && Boolean(scrollbarRight);
	}
});