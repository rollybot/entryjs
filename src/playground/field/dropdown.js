/*
 */
'use strict';

/*
 *
 */
Entry.FieldDropdown = function(content, blockView, index) {
    this._block = blockView.block;
    this._blockView = blockView;

    this.box = new Entry.BoxModel();

    this.svgGroup = null;

    this._contents = content;
    this._noArrow = content.noArrow;

    var arrowColor = content.arrowColor;
    var { deletable, emphasized } = this._block;

    if (deletable === Entry.Block.DELETABLE_FALSE_LIGHTEN || emphasized) {
        arrowColor = blockView._fillColor;
    }

    this._arrowColor = arrowColor;
    this._index = index;
    this.setValue(this.getValue());

    this._CONTENT_HEIGHT = this.getContentHeight(content.dropdownHeight);

    this._font_size = this.getFontSize(content.fontSize);

    this._ROUND = content.roundValue || 3;

    this.renderStart();
};

Entry.Utils.inherit(Entry.Field, Entry.FieldDropdown);

(function(p) {
    p.renderStart = function() {
        var blockView = this._blockView;
        var isBig = Entry.isMobile();
        var X_PADDING = isBig ? 33 : 20;
        var X_PADDING_SUBT = isBig ? 24 : 10;
        var that = this;
        var CONTENT_HEIGHT = this._CONTENT_HEIGHT;
        var arrowInfo = this.getArrow();

        if (!this.svgGroup) {
            this.svgGroup = blockView.contentSvgGroup.elem('g', {
                class: 'entry-field-dropdown',
            });
        }

        if (!this._header) {
            this._header = this.svgGroup.elem('rect', {
                height: CONTENT_HEIGHT,
                y: -CONTENT_HEIGHT / 2,
                rx: that._ROUND,
                ry: that._ROUND,
                fill: '#fff',
                'fill-opacity': 0.4,
            });
        }

        if (!this.textElement) {
            this.textElement = this.svgGroup.elem('text', {
                x: 5,
                style: 'white-space: pre;',
                'font-size': +that._font_size + 'px',
            });
        }

        if (!this._noArrow && !this._arrow) {
            this._arrow = this.svgGroup.elem('polygon', {
                points: arrowInfo.points,
                fill: arrowInfo.color,
                stroke: arrowInfo.color,
            });
        }

        if (this instanceof Entry.FieldDropdownDynamic) {
            this._updateValue();
        }

        this._setTextValue();

        var bBox = this.getTextBBox();

        this.textElement.attr({
            y: bBox.height * 0.27,
        });

        var width = bBox.width + X_PADDING;

        if (this._noArrow) width -= X_PADDING_SUBT;

        this._header.attr({ width: width });

        if (!this._noArrow) {
            this._arrow.attr({
                transform:
                    'translate(' +
                    (width - arrowInfo.width - 5) +
                    ',' +
                    -arrowInfo.height / 2 +
                    ')',
            });
        }

        this._bindRenderOptions();

        this.box.set({
            x: 0,
            y: 0,
            width: width,
            height: CONTENT_HEIGHT,
        });
    };

    p.resize = function() {
        var isBig = Entry.isMobile();
        var X_PADDING = isBig ? 33 : 20;
        var X_PADDING_SUBT = isBig ? 24 : 10;
        var width = this.textElement.getBoundingClientRect().width + X_PADDING;

        if (!this._noArrow) {
            var arrowInfo = this.getArrow();
            this._arrow.attr({
                transform:
                    'translate(' +
                    (width - arrowInfo.width - 5) +
                    ',' +
                    -arrowInfo.height / 2 +
                    ')',
            });
        } else width -= X_PADDING_SUBT;

        this._header.attr({
            width: width,
        });

        this.box.set({ width: width });
        this._block.view.dAlignContent();
    };

    p.renderOptions = function() {
        var that = this;

        this._attachDisposeEvent(() => {
            that.destroyOption(undefined, true);
        });

        this.optionGroup = Entry.Dom('ul', {
            class: 'entry-widget-dropdown',
            parent: $('body'),
        });

        var OPTION_X_PADDING = 30;
        var maxWidth = 0;
        var options = this._contents.options;

        var CONTENT_HEIGHT = this._CONTENT_HEIGHT + 4;

        this.optionGroup.bind('mousedown touchstart', (e) =>
            e.stopPropagation()
        );

        this.optionGroup.on('mouseup', '.rect', function(e) {
            e.stopPropagation();
            that.applyValue(this._value);
            that.destroyOption(undefined, true);
            that._selectBlockView();
            $(that._blockView.contentSvgGroup).trigger('optionChanged', {block:that._block, value:that.getValue(), index:that._index});
        });

        var fragment = document.createDocumentFragment();

        options.forEach((option) => {
            var text = (option[0] = this._convert(option[0], option[1]));
            var value = option[1];
            var element = Entry.Dom('li', {
                class: 'rect',
            });
            var elem = element[0];
            elem._value = value;

            var left = Entry.Dom('span', {
                class: 'left',
                parent: element,
            });

            Entry.Dom('span', {
                class: 'right',
                parent: element,
            }).text(text);

            if (this.getValue() == value) left.text('\u2713');
            fragment.appendChild(elem);
        });

        this.optionGroup[0].appendChild(fragment);
        this._position();

        this.optionDomCreated();
    };

    p._position = function() {
        //inspect enough space below
        var pos = this.getAbsolutePosFromDocument();
        pos.y += this.box.height / 2;

        var documentHeight = $(document).height();
        var optionGroupHeight = this.optionGroup.height();
        var optionGroupWidth = this.optionGroup.width() + 30;

        //not enough space below
        if (documentHeight < pos.y + optionGroupHeight + 30) {
            var domHeight = this._blockView.getBoard().svgDom.height();
            var relPos = this.getAbsolutePosFromBoard();
            //above the half of dom
            if (this._blockView.y < domHeight / 2) {
                pos.x += this.box.width / 2 - optionGroupWidth / 2;

                domHeight -= relPos.y + 30;
                this.optionGroup.height(domHeight);
            } else {
                pos.x += this.box.width + 1;

                domHeight -= domHeight - relPos.y;

                if (domHeight - 30 < optionGroupHeight) {
                    domHeight -= domHeight % 30;
                    this.optionGroup.height(domHeight);
                }

                pos.y -= this.optionGroup.height();
            }
        } else pos.x += this.box.width / 2 - optionGroupWidth / 2;

        this.optionGroup.addClass('rendered');
        this.optionGroup.css({
            left: pos.x,
            top: pos.y,
            width: optionGroupWidth,
        });

        this.optionGroup.find('.right').width(optionGroupWidth - 20);
    };

    p.applyValue = function(value) {
        if (this.value != value) this.setValue(value);
        this._setTextValue();
        this.resize();
    };

    p.getTextByValue = function(value) {
        var reg = /&value/gm;
        if (reg.test(value)) return value.replace(reg, '');

        if ((!value && typeof value !== 'number') || value === 'null')
            return Lang.Blocks.no_target;

        var matched = _.find(this._contents.options, ([, cValue]) => {
            return cValue == value;
        });

        if (matched) {
            return _.head(matched);
        }

        //no match found
        //check should return value as it is
        if (this._shouldReturnValue(value)) return value;
        return Lang.Blocks.no_target;
    };

    p.getContentHeight = function(height) {
        height =
            height ||
            this._blockView.getSkeleton().dropdownHeight ||
            (Entry.isMobile() ? 22 : 16);
        return height;
    };

    p.getArrow = function() {
        var isBig = Entry.isMobile();
        return {
            color: this._arrowColor || this._blockView._schema.color,
            points: isBig ? '0,0 19,0 9.5,13' : '0,0 6.4,0 3.2,4.2',
            height: isBig ? 13 : 4.2,
            width: isBig ? 19 : 6.4,
        };
    };

    p._setTextValue = function() {
        var textValue = this.getTextByValue(this.getValue());
        var newValue = this._convert(textValue, this.getValue());
        if (this.getTextValue() !== newValue)
            this.textElement.textContent = newValue;
    };

    p.getTextValue = function() {
        return this.textElement.textContent;
    };
})(Entry.FieldDropdown.prototype);
