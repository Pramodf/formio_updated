'use strict';
var datagrid, addMoreFlag = false, isAdmin = false, totalCnt = 0 , changedField = '', currentFormData = null, minMaxData = null;
var filtered_keys = (obj, filter) => {
  var key, keys = []
  for (key in obj)
    if (obj.hasOwnProperty(key) && filter.test(key))
      keys.push(key)
  return keys
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BaseComponent = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _vanillaTextMask = require('vanilla-text-mask');

var _vanillaTextMask2 = _interopRequireDefault(_vanillaTextMask);

var _nativePromiseOnly = require('native-promise-only');

var _nativePromiseOnly2 = _interopRequireDefault(_nativePromiseOnly);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _tooltip = require('tooltip.js');

var _tooltip2 = _interopRequireDefault(_tooltip);

var _i18next = require('i18next');

var _i18next2 = _interopRequireDefault(_i18next);

var _utils = require('../../utils');

var _utils2 = _interopRequireDefault(_utils);

var _Validator = require('../Validator');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * This is the BaseComponent class which all elements within the FormioForm derive from.
 */
var BaseComponent = function () {
  /**
   * Initialize a new BaseComponent.
   *
   * @param {Object} component - The component JSON you wish to initialize.
   * @param {Object} options - The options for this component.
   * @param {Object} data - The global data submission object this component will belong.
   */
  function BaseComponent(component, options, data) {
    _classCallCheck(this, BaseComponent);

    this.originalComponent = _lodash2.default.cloneDeep(component);
    /**
     * The ID of this component. This value is auto-generated when the component is created, but
     * can also be provided from the component.id value passed into the constructor.
     * @type {string}
     */
    this.id = component && component.id ? component.id : Math.random().toString(36).substring(7);

    /**
     * The options for this component.
     * @type {{}}
     */
    this.options = _lodash2.default.defaults(_lodash2.default.clone(options), {
      highlightErrors: true
    });

    // Use the i18next that is passed in, otherwise use the global version.
    this.i18next = this.options.i18next || _i18next2.default;

    /**
     * Determines if this component has a condition assigned to it.
     * @type {null}
     * @private
     */
    this._hasCondition = null;

    /**
     * The events that are triggered for the whole FormioForm object.
     */
    this.events = this.options.events;

    /**
     * The data object in which this component resides.
     * @type {*}
     */
    this.data = data || {};

    /**
     * The Form.io component JSON schema.
     * @type {*}
     */
    this.component = component || {};

    /**
     * The bounding HTML Element which this component is rendered.
     * @type {null}
     */
    this.element = null;

    /**
     * The HTML Element for the table body. This is relevant for the "multiple" flag on inputs.
     * @type {null}
     */
    this.tbody = null;

    /**
     * The HTMLElement that is assigned to the label of this component.
     * @type {null}
     */
    this.labelElement = null;

    /**
     * The HTMLElement for which the errors are rendered for this component (usually underneath the component).
     * @type {null}
     */
    this.errorElement = null;

    /**
     * The existing error that this component has.
     * @type {string}
     */
    this.error = '';

    /**
     * An array of all of the input HTML Elements that have been added to this component.
     * @type {Array}
     */
    this.inputs = [];

    /**
     * The basic component information which tells the BaseComponent how to render the input element of the components that derive from this class.
     * @type {null}
     */
    this.info = null;

    /**
     * The row path of this component.
     * @type {number}
     */
    this.row = component ? component.row : '';
    this.row = this.row || '';

    /**
     * Determines if this component is disabled, or not.
     *
     * @type {boolean}
     */
    this._disabled = false;

    /**
     * Determines if this component is visible, or not.
     */
    this._visible = true;

    /**
     * If this input has been input and provided value.
     *
     * @type {boolean}
     */
    this.pristine = true;

    /**
     * Points to the parent component.
     *
     * @type {BaseComponent}
     */
    this.parent = null;

    /**
     * Points to the root component, usually the FormComponent.
     *
     * @type {BaseComponent}
     */
    this.root = this;

    /**
     * The Input mask instance for this component.
     * @type {InputMask}
     */
    this.inputMask = null;

    this.options.name = this.options.name || 'data';

    /**
     * The validators that are assigned to this component.
     * @type {[string]}
     */
    this.validators = ['required', 'minLength', 'maxLength', 'custom', 'pattern', 'json', 'mask'];

    /**
     * Used to trigger a new change in this component.
     * @type {function} - Call to trigger a change in this component.
     */
    this.triggerChange = _lodash2.default.debounce(this.onChange.bind(this), 100);

    /**
     * An array of event handlers so that the destry command can deregister them.
     * @type {Array}
     */
    this.eventHandlers = [];

    // To force this component to be invalid.
    this.invalid = false;

    // Determine if the component has been built.
    this.isBuilt = false;

    /**
     * An array of the event listeners so that the destroy command can deregister them.
     * @type {Array}
     */
    this.eventListeners = [];

    if (this.component) {
      this.type = this.component.type;
      if (this.hasInput && this.component.key) {
        this.options.name += '[' + this.component.key + ']';
      }

      /**
       * The element information for creating the input element.
       * @type {*}
       */
      this.info = this.elementInfo();
    }
  }

  _createClass(BaseComponent, [{
    key: 't',


    /**
     * Translate a text using the i18n system.
     *
     * @param {string} text - The i18n identifier.
     * @param {Object} params - The i18n parameters to use for translation.
     */
    value: function t(text, params) {
      params = params || {};
      params.data = this.root ? this.root.data : this.data;
      params.row = this.data;
      params.component = this.component;
      params.nsSeparator = '::';
      params.keySeparator = '.|.';
      params.pluralSeparator = '._.';
      params.contextSeparator = '._.';
      var translated = this.i18next.t(text, params);
      return translated || text;
    }

    /**
     * Register for a new event within this component.
     *
     * @example
     * let component = new BaseComponent({
     *   type: 'textfield',
     *   label: 'First Name',
     *   key: 'firstName'
     * });
     * component.on('componentChange', (changed) => {
     *   console.log('this element is changed.');
     * });
     *
     *
     * @param {string} event - The event you wish to register the handler for.
     * @param {function} cb - The callback handler to handle this event.
     * @param {boolean} internal - This is an internal event handler.
     */

  }, {
    key: 'on',
    value: function on(event, cb, internal) {
      if (!this.events) {
        return;
      }
      var type = 'formio.' + event;
      this.eventListeners.push({
        type: type,
        listener: cb,
        internal: internal
      });
      return this.events.on(type, cb);
    }

    /**
     * Emit a new event.
     *
     * @param {string} event - The event to emit.
     * @param {Object} data - The data to emit with the handler.
     */

  }, {
    key: 'emit',
    value: function emit(event, data) {
      this.events.emit('formio.' + event, data);
    }

    /**
     * Returns an HTMLElement icon element.
     *
     * @param {string} name - The name of the icon to retrieve.
     * @returns {HTMLElement} - The icon element.
     */

  }, {
    key: 'getIcon',
    value: function getIcon(name) {
      return this.ce('i', {
        class: this.iconClass(name)
      });
    }
  }, {
    key: 'getBrowserLanguage',
    value: function getBrowserLanguage() {
      var nav = window.navigator;
      var browserLanguagePropertyKeys = ['language', 'browserLanguage', 'systemLanguage', 'userLanguage'];
      var language = void 0;

      // support for HTML 5.1 "navigator.languages"
      if (Array.isArray(nav.languages)) {
        for (var i = 0; i < nav.languages.length; i++) {
          language = nav.languages[i];
          if (language && language.length) {
            return language;
          }
        }
      }

      // support for other well known properties in browsers
      for (var _i = 0; _i < browserLanguagePropertyKeys.length; _i++) {
        language = nav[browserLanguagePropertyKeys[_i]];
        if (language && language.length) {
          return language;
        }
      }

      return null;
    }

    /**
     * Called before a next page is triggered allowing the components
     * to perform special functions.
     *
     * @return {*}
     */

  }, {
    key: 'beforeNext',
    value: function beforeNext() {
      return _nativePromiseOnly2.default.resolve(true);
    }

    /**
     * Called before a submission is triggered allowing the components
     * to perform special async functions.
     *
     * @return {*}
     */

  }, {
    key: 'beforeSubmit',
    value: function beforeSubmit() {
      return _nativePromiseOnly2.default.resolve(true);
    }
  }, {
    key: 'build',


    /**
     * Builds the component.
     */
    value: function build() {
      if (this.viewOnly) {
        this.viewOnlyBuild();
      } else {
        this.createElement();

        var labelAtTheBottom = this.component.labelPosition === 'bottom';
        if (!labelAtTheBottom) {
					this.createLabel(this.element);
        }

        if(this.type === "datetime" && this.component.datePicker) {
          if(minMaxData) {
            if(minMaxData[this.id] && this.row && this.row !== "" && this.row.indexOf('-') >  -1) {
            var row = this.row.split('-')[0] + "-0";
            if(minMaxData[this.id][row] && minMaxData[this.id][row].minDate) {
              var value = minMaxData[this.id][row].minDate;
              this.component.datePicker.minDate = minMaxData[this.id][row].minDate;
              }
            }
          }
        }

        if (!this.createWrapper()) {
					this.createInput(this.element, 0);
        }
        if (labelAtTheBottom) {
          this.createLabel(this.element);
        }
        this.createDescription(this.element);

        // Disable if needed.
        if (this.shouldDisable) {
          this.disabled = true;
				}

				// Making Admin field
				//custom requirement to add annotation buttons beside field which has propert linkAnnotation: true
				this.IsAdminData(this.element);
				if (!this.component.multiple) {
				this.createAnnotationButtons(this.element);
				}
        // Restore the value.
				this.restoreValue();

				if((window.chartNavCompRef.component.overReadUserAccess && !window.chartNavCompRef.component.enableFormIOAnnotationBtns))
				{
					setTimeout(a => {
						$('.mandatoryDelete').hide();
						$('.optionalDelete').hide();
						$('.numeratorDelete').hide();
					},400)

				 } else if((window.chartNavCompRef.component.overReadUserAccess 
									&& window.chartNavCompRef.component.enableFormIOAnnotationBtns)) {

						this.hideShowBlockDeleteBtns();
						this.enableDisableAnnotationBtns();
					} else {
						this.enableDisableAnnotationBtns();
				} 
      }
    }
	}, 
	{
		key: 'enableDisableAnnotationBtns',
		value: function enableDisableAnnotationBtns() {
			// setTimeout( a => {
				
			// }, 300);
			var formData = this.data;
			if (this.data) {
				var measureMandaotoryKey = filtered_keys(formData, /(_EXCLSN_FLG_MNDTRY)/);
				var measureOptionalKey = filtered_keys(formData, /(_EXCLSN_FLG_OPTNL)/);

				if(measureMandaotoryKey.length > 0) {
					measureMandaotoryKey = measureMandaotoryKey[0];
				} else {
					measureMandaotoryKey = "unknownMandatoryProperty";
				}

				if(measureOptionalKey.length > 0) {
					measureOptionalKey = measureOptionalKey[0];
				} else {
					measureOptionalKey = "unknownOptionProperty";
				}

				if(formData.hasOwnProperty(measureMandaotoryKey) && formData[measureMandaotoryKey] === true) {
					$('.mandatorySectionBtn').prop('disabled', false);
					$('.optionalSectionBtn').prop('disabled', true);
					$('.numeratorSectionBtn').prop('disabled', true);

				
					$('.mandatoryDelete').show();
					$('.optionalDelete').hide();
					$('.numeratorDelete').hide();

				} else if(formData.hasOwnProperty(measureOptionalKey) && formData[measureOptionalKey] === true) {
					$('.optionalSectionBtn').prop('disabled', false);
					$('.mandatorySectionBtn').prop('disabled', true);
					$('.numeratorSectionBtn').prop('disabled', true);
					$('.mandatorySectionBtn').removeClass('mandatoryError');

					$('.mandatoryDelete').hide();
					$('.optionalDelete').show(); 
					$('.numeratorDelete').hide();
				} else if((formData.hasOwnProperty(measureMandaotoryKey) && formData[measureMandaotoryKey] === false)
										|| (formData.hasOwnProperty(measureOptionalKey) && formData[measureOptionalKey] === false)){
					$('.numeratorSectionBtn').prop('disabled', false);
					$('.optionalSectionBtn').prop('disabled', true);
					$('.mandatorySectionBtn').prop('disabled', true);
					$('.mandatorySectionBtn').removeClass('mandatoryError');

					$('.mandatoryDelete').hide();
					$('.optionalDelete').hide();
					$('.numeratorDelete').show();
				}
			}
		}
	},
	{
		key: 'hideShowBlockDeleteBtns',
		value: function hideShowBlockDeleteBtns() {
		
			var formData = window.chartNavCompRef.component.submission.data;
			if (formData) {
				var measureMandaotoryKey = filtered_keys(formData, /(_EXCLSN_FLG_MNDTRY)/);
				var measureOptionalKey = filtered_keys(formData, /(_EXCLSN_FLG_OPTNL)/);

				if(measureMandaotoryKey.length > 0) {
					measureMandaotoryKey = measureMandaotoryKey[0];
				} else {
					measureMandaotoryKey = "unknownMandatoryProperty";
				}

				if(measureOptionalKey.length > 0) {
					measureOptionalKey = measureOptionalKey[0];
				} else {
					measureOptionalKey = "unknownOptionProperty";
				}
				if((formData.hasOwnProperty(measureMandaotoryKey) && formData[measureMandaotoryKey] === true)) {

          $('.mandatorySectionBtn').prop('disabled', false);
					$('.optionalSectionBtn').prop('disabled', true);
          $('.numeratorSectionBtn').prop('disabled', true);
					$('.mandatoryDelete').show();
					$('.optionalDelete').hide();
					$('.numeratorDelete').hide();
				} else if(formData.hasOwnProperty(measureOptionalKey) && formData[measureOptionalKey] === true) {
          $('.optionalSectionBtn').prop('disabled', false);
					$('.mandatorySectionBtn').prop('disabled', true);
          $('.numeratorSectionBtn').prop('disabled', true);
          $('.mandatorySectionBtn').removeClass('mandatoryError');
					$('.mandatoryDelete').hide();
					$('.optionalDelete').show();
					$('.numeratorDelete').hide();
				}else if((formData.hasOwnProperty(measureMandaotoryKey) && (formData[measureMandaotoryKey] === null || formData[measureMandaotoryKey] === false) 
						|| (formData.hasOwnProperty(measureOptionalKey) && (formData[measureOptionalKey] === null || formData[measureOptionalKey] === false ) ) ) ){
              $('.numeratorSectionBtn').prop('disabled', false);
					    $('.optionalSectionBtn').prop('disabled', true);
					    $('.mandatorySectionBtn').prop('disabled', true);
              $('.mandatorySectionBtn').removeClass('mandatoryError');
              $('.mandatoryDelete').hide();
							$('.optionalDelete').hide();
							$('.numeratorDelete').show();
				}

			}

		}
	}, {
    key: 'viewOnlyBuild',
    value: function viewOnlyBuild() {
      this.createViewOnlyElement();
      this.createViewOnlyLabel(this.element);
      this.createViewOnlyValue(this.element);
    }
  }, {
    key: 'createViewOnlyElement',
    value: function createViewOnlyElement() {
      this.element = this.ce('dl', {
        id: this.id
      });

      if (this.element) {
        // Ensure you can get the component info from the element.
        this.element.component = this.component;
      }

      return this.element;
    }
  }, {
    key: 'createViewOnlyLabel',
    value: function createViewOnlyLabel(container) {
      if (this.labelIsHidden()) {
        return;
      }

      this.labelElement = this.ce('dt');
      this.labelElement.appendChild(this.text(this.component.label));
      this.createTooltip(this.labelElement);
      container.appendChild(this.labelElement);
    }
  }, {
    key: 'createViewOnlyValue',
    value: function createViewOnlyValue(container) {
      this.valueElement = this.ce('dd');
      this.setupValueElement(this.valueElement);
      container.appendChild(this.valueElement);
    }
  }, {
    key: 'setupValueElement',
    value: function setupValueElement(element) {
      var value = this.getValue();
      value = this.isEmpty(value) ? this.defaultViewOnlyValue : this.getView(value);
      element.innerHTML = value;
    }
  }, {
    key: 'getView',
    value: function getView(value) {
      if (!value) {
        return '';
      }
      if (Array.isArray(value)) {
        return value.join(', ');
      }

      return value.toString();
    }
  }, {
    key: 'updateViewOnlyValue',
    value: function updateViewOnlyValue() {
      if (!this.valueElement) {
        return;
      }

      this.setupValueElement(this.valueElement);
    }
  }, {
    key: 'empty',
    value: function empty(element) {
      if (element) {
        while (element.firstChild) {
          element.removeChild(element.firstChild);
        }
      }
    }

    /**
     * Retrieves the CSS class name of this component.
     * @returns {string} - The class name of this component.
     */

  }, {
    key: 'getElement',


    /**
     * Returns the outside wrapping element of this component.
     * @returns {HTMLElement}
     */
    value: function getElement() {
      return this.element;
    }

    /**
     * Create the outside wrapping element for this component.
     * @returns {HTMLElement}
     */

  }, {
    key: 'createElement',
    value: function createElement() {
      // If the element is already created, don't recreate.
      if (this.element) {
        return this.element;
      }

      this.element = this.ce('div', {
        id: this.id,
        class: this.className,
        style: this.customStyle
      });

      // Ensure you can get the component info from the element.
      this.element.component = this.component;

      return this.element;
    }

    /**
     * Create the input wrapping element. For multiple, this may be the table wrapper for the elements.
     * @returns {boolean}
     */

  }, {
    key: 'createWrapper',
    value: function createWrapper() {
      if (!this.component.multiple) {
        return false;
      } else {
        var table = this.ce('table', {
          class: 'table table-bordered'
        });
        this.tbody = this.ce('tbody');
        table.appendChild(this.tbody);

        // Add a default value.
        if (!this.data[this.component.key] || !this.data[this.component.key].length) {
          this.addNewValue();
        }				
        // Build the rows.
        this.buildRows();

        this.setInputStyles(table);

        // Add the table to the element.
        this.append(table);
        return true;
      }
    }
  }, {
    key: 'setPristine',


    /**
     * Sets the pristine flag for this component.
     *
     * @param pristine {boolean} - TRUE to make pristine, FALSE not pristine.
     */
    value: function setPristine(pristine) {
      this.pristine = pristine;
    }

    /**
     * Adds a new empty value to the data array.
     */

  }, {
    key: 'addNewValue',
    value: function addNewValue() {
      if (!this.data[this.component.key]) {
        this.data[this.component.key] = [];
      }
      if (this.data[this.component.key] && !Array.isArray(this.data[this.component.key])) {
        this.data[this.component.key] = [this.data[this.component.key]];
      }
      this.data[this.component.key].push(this.defaultValue);
    }

    /**
     * Adds a new empty value to the data array, and add a new row to contain it.
     */

  }, {
    key: 'addValue',
    value: function addValue() {
			addMoreFlag = true;			
      this.addNewValue();
      this.buildRows('','', addMoreFlag);
      this.checkConditions(this.root ? this.root.data : this.data);
			this.restoreValue();
    }

    /**
     * Removes a value out of the data array and rebuild the rows.
     * @param {number} index - The index of the data element to remove.
     */

  }, {
    key: 'removeValue',
    value: function removeValue(index) {
      if (this.data.hasOwnProperty(this.component.key)) {
        this.data[this.component.key].splice(index, 1);
        this.triggerChange();
      }
      this.buildRows();
    }

    /**
     * Rebuild the rows to contain the values of this component.
     */

  }, {
    key: 'buildRows',
    value: function buildRows() {
      var _this = this;

      if (!this.tbody) {
        return;
      }
      this.inputs = [];
			this.tbody.innerHTML = '';
			var entireobj= this;
			
      _lodash2.default.each(this.data[this.component.key], (value, index) => {
				if (!addMoreFlag) {
					totalCnt = this.data[this.component.key].length;
				}
        var tr = _this.ce('tr');
        var td = _this.ce('td');
        var input = _this.createInput(td, index, totalCnt);
				input.value = value;
				// For valid individual inputs Changes (on ADD button) start
        if (input.value !== "") {
          input.className += ' remove-validation'
				}
				entireobj.IsAdminData(td, null, index);
				tr.appendChild(td);
				//custom requirement to add annotation buttons beside field which has propert linkAnnotation: true
				entireobj.createAnnotationButtons(td, null, null,index);
				tr.appendChild(td);
        if (!_this.shouldDisable) {
					var tdAdd = _this.ce('td');
					if ( index !== 0 && (index >= this.component.adminCount)) {
						tdAdd.appendChild(_this.removeButton(index, true, entireobj.component.key));
					}
					var tdBtn = _this.ce('td');
					if ( index === (this.data[this.component.key].length - 1)) {
						tdBtn.appendChild(this.addButton());
					}
					tr.appendChild(tdAdd);
					tr.appendChild(tdBtn);
				}
        _this.tbody.appendChild(tr);
			});
			
      if (this.shouldDisable) {
        this.disabled = true;
      }
    }
  }, {
    key: 'bootstrap4Theme',
    value: function bootstrap4Theme(name) {
      return name === 'default' ? 'secondary' : name;
    }
  }, {
    key: 'iconClass',
    value: function iconClass(name, spinning) {
      if (!this.options.icons || this.options.icons === 'glyphicon') {
        return spinning ? 'glyphicon glyphicon-' + name + ' glyphicon-spin' : 'glyphicon glyphicon-' + name;
      }
      switch (name) {
        case 'zoom-in':
          return 'fa fa-search-plus';
        case 'zoom-out':
          return 'fa fa-search-minus';
        case 'question-sign':
          return 'fa fa-question-circle';
        case 'remove-circle':
          return 'fa fa-times-circle-o';
        default:
          return spinning ? 'fa fa-' + name + ' fa-spin' : 'fa fa-' + name;
      }
    }

    /**
     * Adds a new button to add new rows to the multiple input elements.
     * @returns {HTMLElement} - The "Add New" button html element.
     */

  }, {
    key: 'addButton',
    value: function addButton(justIcon) {
      var _this2 = this;

      var addButton = this.ce('a', {
        class: 'btn btn-primary'
			});

      this.addEventListener(addButton, 'click', function (event) {
				event.preventDefault();
				if (window.chartNavCompRef && window.chartNavCompRef.component) {
					window.chartNavCompRef.component.onAddFormComponent();
					}
				_this2.addValue();
      });

      var addIcon = this.ce('i', {
        class: this.iconClass('plus')
      });

      if (justIcon) {
        addButton.appendChild(addIcon);
        return addButton;
      } else {
        addButton.appendChild(addIcon);
        addButton.appendChild(this.text(this.component.addAnother || ''));
        return addButton;
      }
    }

    /**
     * The readible name for this component.
     * @returns {string} - The name of the component.
     */

  }, {
    key: 'errorMessage',


    /**
     * Get the error message provided a certain type of error.
     * @param type
     * @return {*}
     */
    value: function errorMessage(type) {
      return this.component.errors && this.component.errors[type] ? this.component.errors[type] : type;
    }

    /**
     * Creates a new "remove" row button and returns the html element of that button.
     * @param {number} index - The index of the row that should be removed.
     * @returns {HTMLElement} - The html element of the remove button.
     */

  }, {
    key: 'removeButton',
    value: function removeButton(index, IsMultiple, key, gridCnt, isGridAdmin) {
			if (isGridAdmin && index < gridCnt) {
				return '';
			}

			var className = 'numeratorDelete'
			if (this.component.mandatory === true) {
				className = 'mandatoryDelete';
			} else if (this.component.optional === true) {
				className = 'optionalDelete';
			} 

      var _this3 = this;
			datagrid = this;
      var removeButton = this.ce('button', {
        type: 'button',
        class: 'btn btn-primary '+ className,
        tabindex: '-1'
			});
			this.addEventListener(removeButton, 'click', function (event) {
			  event.preventDefault();
				if (window.chartNavCompRef && window.chartNavCompRef.component) {
					var removekey = IsMultiple === true ? index + '-' + key : key; 
					window.chartNavCompRef.component.onRemoveFormComponent(index,IsMultiple,removekey);
				}
				// workaround to fix issue of date data loss in block delete 
				var processedArray = {};
				if(_this3.data && _this3.data.minMaxVal) {
					$.each(_this3.data.minMaxVal, (i, n) => {
						if(n[ index + "-"+ 0]) {
							delete n[ index + "-"+ 0];	
						} 
						var tempData = [], k = 0;
						Object.keys(n).forEach((key) => {
							tempData[ k + "-" + 0 ] = n[key];
							k++;
						});						
						processedArray[i] = tempData;
					}); 
				}
        _this3.data.minMaxVal = processedArray;
        if(processedArray === {}) {
          minMaxData = null;
        } else {
          minMaxData = processedArray;
        }
        // added manually for regenerate grid rows
        datagrid.buildRows(undefined, true);
				if(IsMultiple) {
          setTimeout(() => {
            if(window.chartNavCompRef.component.isFieldBlockDeleted) {
              _this3.removeValue(index);
            } else {
              setTimeout(() => {
                if(window.chartNavCompRef.component.isFieldBlockDeleted) {
                  _this3.removeValue(index);
                } else {
                  setTimeout(() => {
                    if(window.chartNavCompRef.component.isFieldBlockDeleted) {
                      _this3.removeValue(index);
                    }
                  }, 500);
                }
              }, 2000);
            }
          }, 1000);
        } else {
          _this3.removeValue(index);
        }
      });

      var removeIcon = this.ce('i', {
        class: this.iconClass('remove-circle')
      });
      removeButton.appendChild(removeIcon);
      return removeButton;
    }
  }, {
    key: 'labelOnTheLeft',
    value: function labelOnTheLeft(position) {
      return ['left-left', 'left-right'].indexOf(position) !== -1;
    }
  }, {
    key: 'labelOnTheRight',
    value: function labelOnTheRight(position) {
      return ['right-left', 'right-right'].indexOf(position) !== -1;
    }
  }, {
    key: 'rightAlignedLabel',
    value: function rightAlignedLabel(position) {
      return ['left-right', 'right-right'].indexOf(position) !== -1;
    }
  }, {
    key: 'labelOnTheLeftOrRight',
    value: function labelOnTheLeftOrRight(position) {
      return this.labelOnTheLeft(position) || this.labelOnTheRight(position);
    }
  }, {
    key: 'getLabelWidth',
    value: function getLabelWidth() {
      if (_lodash2.default.isUndefined(this.component.labelWidth)) {
        this.component.labelWidth = 30;
      }

      return this.component.labelWidth;
    }
  }, {
    key: 'getLabelMargin',
    value: function getLabelMargin() {
      if (_lodash2.default.isUndefined(this.component.labelMargin)) {
        this.component.labelMargin = 3;
      }

      return this.component.labelMargin;
    }
  }, {
    key: 'setInputStyles',
    value: function setInputStyles(input) {
      if (this.labelIsHidden()) {
        return;
      }

      if (this.labelOnTheLeftOrRight(this.component.labelPosition)) {
        var totalLabelWidth = this.getLabelWidth() + this.getLabelMargin();
        input.style.width = 100 - totalLabelWidth + '%';

        if (this.labelOnTheLeft(this.component.labelPosition)) {
          input.style.marginLeft = totalLabelWidth + '%';
        } else {
          input.style.marginRight = totalLabelWidth + '%';
        }
      }
    }
  }, {
    key: 'labelIsHidden',
    value: function labelIsHidden() {
      return !this.component.label || this.component.hideLabel || this.options.inputsOnly;
    }

    /**
     * Create the HTML element for the label of this component.
     * @param {HTMLElement} container - The containing element that will contain this label.
     */

  }, {
    key: 'createLabel',
    value: function createLabel(container) {
      if (this.labelIsHidden()) {
        return;
      }
      var className = 'control-label';
      var style = '';

      var labelPosition = this.component.labelPosition;

      // Determine label styles/classes depending on position.

      if (labelPosition === 'bottom') {
        className += ' control-label--bottom';
      } else if (labelPosition && labelPosition !== 'top') {
        var labelWidth = this.getLabelWidth();
        var labelMargin = this.getLabelMargin();

        // Label is on the left or right.
        if (this.labelOnTheLeft(labelPosition)) {
          style += 'float: left; width: ' + labelWidth + '%; margin-right: ' + labelMargin + '%; ';
        } else if (this.labelOnTheRight(labelPosition)) {
          style += 'float: right; width: ' + labelWidth + '%; margin-left: ' + labelMargin + '%; ';
        }
        if (this.rightAlignedLabel(labelPosition)) {
          style += 'text-align: right; ';
        }
      }

      if (this.hasInput && this.component.validate && this.component.validate.required) {
        className += ' field-required';
      }
      this.labelElement = this.ce('label', {
        class: className,
        style: style
      });
      if (this.info.attr.id) {
        this.labelElement.setAttribute('for', this.info.attr.id);
      }
      this.labelElement.appendChild(this.text(this.component.label));
			this.createTooltip(this.labelElement);
			container.appendChild(this.labelElement);
    }
  }, {
    key: 'addShortcutToLabel',
    value: function addShortcutToLabel(label, shortcut) {
      if (!label) {
        label = this.component.label;
      }

      if (!shortcut) {
        shortcut = this.component.shortcut;
      }

      if (!shortcut || !/^[A-Za-z]$/.test(shortcut)) {
        return label;
      }

      var match = label.match(new RegExp(shortcut, 'i'));

      if (!match) {
        return label;
      }

      var index = match.index + 1;
      var lowLineCombinator = '\u0332';

      return label.substring(0, index) + lowLineCombinator + label.substring(index);
    }
  }, {
    key: 'addShortcut',
    value: function addShortcut(element, shortcut) {
      // Avoid infinite recursion.
      if (this.root === this) {
        return;
      }

      if (!element) {
        element = this.labelElement;
      }

      if (!shortcut) {
        shortcut = this.component.shortcut;
      }

      this.root.addShortcut(element, shortcut);
    }
  }, {
    key: 'removeShortcut',
    value: function removeShortcut(element, shortcut) {
      // Avoid infinite recursion.
      if (this.root === this) {
        return;
      }

      if (!element) {
        element = this.labelElement;
      }

      if (!shortcut) {
        shortcut = this.component.shortcut;
      }

      this.root.removeShortcut(element, shortcut);
    }

    /**
     * Create the HTML element for the tooltip of this component.
     * @param {HTMLElement} container - The containing element that will contain this tooltip.
     */

  }, {
    key: 'createTooltip',
    value: function createTooltip(container, component, classes) {
      component = component || this.component;
      classes = classes || this.iconClass('question-sign') + ' text-muted';
      if (!component.tooltip || component.adminCount > 0) {
        return;
      }
      this.tooltip = this.ce('i', {
        class: classes
			});
      container.appendChild(this.text(' '));
			container.appendChild(this.tooltip);
      new _tooltip2.default(this.tooltip, {
        delay: {
          hide: 100
        },
        placement: 'right',
        html: true,
        title: component.tooltip.replace(/(?:\r\n|\r|\n)/g, '<br />')
      });
    }

    /**
     * Creates the description block for this input field.
     * @param container
     */

	},{
		key: 'IsAdminData',
    value: function IsAdminData(container, component, index) {
			component = component || this.component;

			if (this.IsAdminBlock(component, index) && (component.isBlock || component.type !== 'datetime')) {
					$(this).attr("disabled", "disabled");
					var elem = this.element.children[this.element.children.length - 1];
					var adminIndicator = this.ce('span', {
						style: 'margin-top:10px;margin-right:-20px;font-family:Segoe UI !important;font-size:0.6875rem;font-weight:400;color:#BBBBBB;letter-spacing:0;line-height:1.5em;'
					});
					adminIndicator.appendChild(this.text('(ADMIN)'));
					if (component.type !== 'datetime') {
						this.element.append(adminIndicator);
					} else {
						elem.appendChild(adminIndicator);
					}
			}
    }
	},
	{
    key: 'IsLinkAnnotationComponent',
    value: function IsLinkAnnotationComponent() {
			if (!this.component.linkAnnotation || !window.chartNavCompRef || !window.chartNavCompRef.component) {
        return false;
			} else {
				return true;
			}
    }

    /**
     * Returns boolean whether current component is annotation button.
     *
     * @returns {bool} - The icon element.
     */

	},
	{
    key: 'IsAdminBlock',
    value: function IsAdminBlock(component, rowindex) {
			var isAdminblock = false;
      if (component.adminCount && component.adminCount > 0) {
				var index = component.multiple ? rowindex : (component.row) ? component.row.split('-')[0] : 0;
				isAdminblock = (index < component.adminCount);
			}
			return isAdminblock;
    }

    /**
     * Returns is current block is admin allowed.
     *
     * @param {string} component - component value.
     */

  }, {
		/**
		 *  custom function to create button beside field which has LinkAnnotation Property 
		 *  @param {container} - element to which buttons need to append ; 
		 * 				 {component} - component is each tag field/table/panel in json
		 * 				 {classes} - class to add to button
		 * 				 {rowindex} - is index of row where button will add
		 * */
    key: 'createAnnotationButtons',
    value: function createAnnotationButtons(container, component, classes,rowindex) {
			component = component || this.component;

			if (!this.IsLinkAnnotationComponent()) {
        return;
			}

      if (this.IsAdminBlock(component, rowindex)) {
        return;
			}
			 
			var btnGroup = this.ce('div', {
				class: 'btn-group'
			});
			
			var showGoTO = false; 
			var isMandatory = false;
			var markClearBtnClass =  'markAnnotationBtn';
			if(component.validate instanceof Object && component.validate.required) {
				// markClearBtnClass ='markAnnotationBtn mandatoryError';
				isMandatory = true;
			}

			if (window.chartNavCompRef.component.annotationService.annotationKeyValObj != undefined) {
				var obj = window.chartNavCompRef.component.annotationService.annotationKeyValObj.keys;
				if(obj[component.key] !== undefined && obj[component.key] !== []) {
					var indexid = component.multiple ? rowindex : component.row.split('-')[0];
					
					if(!component.multiple && component.row === "") {
						indexid = 0;
					}

					if(obj[component.key].length > Number(indexid)) {
						if(obj[component.key][indexid] !== null && obj[component.key][indexid].annotationId !== -1) {
							markClearBtnClass = 'clearAnnotationBtn';
							showGoTO = true;
						}
					}
				}
			}

			if(component.mandatory === true) {
				markClearBtnClass = markClearBtnClass + ' ' + 'mandatorySectionBtn';
			} else if(component.optional === true) {
				markClearBtnClass = markClearBtnClass + ' ' + 'optionalSectionBtn';
			} else {
				markClearBtnClass = markClearBtnClass + ' ' + 'numeratorSectionBtn';
			}

			this.buttonGoAnnot = this.ce('BUTTON', {
				class: 'gotoAnnotationBtn',
				style: showGoTO ? 'display: block' : 'display: none' 
			});

			this.buttonMarkAnnot = this.ce('BUTTON', {
        class: markClearBtnClass
			});
			
			var isDisabled = false;

			if((window.chartNavCompRef.component.overReadUserAccess && !window.chartNavCompRef.component.enableFormIOAnnotationBtns) || isDisabled) {
				this.buttonMarkAnnot.disabled = true;
			}

			this.addEventListener(this.buttonGoAnnot, 'click', function (event) {
				var rowID = component.multiple ? rowindex : component.row !== '' ? component.row.split('-')[0] : 0;
				window.chartNavCompRef.component.goToAnnotation(Number(rowID) + '-' + component.key);
			});

			this.addEventListener(this.buttonMarkAnnot, 'click', function (event) {
				var rowID = component.multiple ? rowindex : component.row !== '' ? component.row.split('-')[0] : 0;
				var action='mark';
				if ($(this).hasClass('clearAnnotationBtn')) {
					action = 'clear';
				}
				window.chartNavCompRef.component.setKeyOrClearAnnotation(Number(rowID) + '-' + component.key,$(this),action,isMandatory);
				// if(action == 'clear') {
				// 	$(this).closest(':has(button.gotoAnnotationBtn)').find('button.gotoAnnotationBtn').css('display','none');
				// }
			});
			
			//container.appendChild(this.button);
			btnGroup.appendChild(this.buttonGoAnnot);
			btnGroup.appendChild(this.buttonMarkAnnot);

			container.appendChild(this.text(' '));
      container.appendChild(this.text(' '));
			
			container.appendChild(btnGroup);
      
			
    }

    /**
     * Creates the description block for this input field.
     * @param container
     */

  }, {
    key: 'createDescription',
    value: function createDescription(container) {
      if (!this.component.description) {
        return;
      }
      this.description = this.ce('div', {
        class: 'help-block'
      });
      this.description.innerHTML = this.t(this.component.description);
      container.appendChild(this.description);
    }

    /**
     * Creates a new error element to hold the errors of this element.
     */

  }, {
    key: 'createErrorElement',
    value: function createErrorElement() {
      if (!this.errorContainer) {
        return;
      }
      this.errorElement = this.ce('div', {
        class: 'formio-errors invalid-feedback'
      });
      this.errorContainer.appendChild(this.errorElement);
    }

    /**
     * Adds a prefix html element.
     *
     * @param {HTMLElement} input - The input element.
     * @param {HTMLElement} inputGroup - The group that will hold this prefix.
     * @returns {HTMLElement} - The html element for this prefix.
     */

  }, {
    key: 'addPrefix',
    value: function addPrefix(input, inputGroup) {
      var prefix = null;
      if (this.component.prefix) {
        prefix = this.ce('div', {
          class: 'input-group-addon'
        });
        prefix.appendChild(this.text(this.component.prefix));
        inputGroup.appendChild(prefix);
      }
      return prefix;
    }

    /**
     * Adds a suffix html element.
     *
     * @param {HTMLElement} input - The input element.
     * @param {HTMLElement} inputGroup - The group that will hold this suffix.
     * @returns {HTMLElement} - The html element for this suffix.
     */

  }, {
    key: 'addSuffix',
    value: function addSuffix(input, inputGroup) {
      var suffix = null;
      if (this.component.suffix) {
        suffix = this.ce('div', {
          class: 'input-group-addon'
        });
        suffix.appendChild(this.text(this.component.suffix));
        inputGroup.appendChild(suffix);
      }
      return suffix;
    }

    /**
     * Adds a new input group to hold the input html elements.
     *
     * @param {HTMLElement} input - The input html element.
     * @param {HTMLElement} container - The containing html element for this group.
     * @returns {HTMLElement} - The input group element.
     */

  }, {
    key: 'addInputGroup',
    value: function addInputGroup(input, container) {
      var inputGroup = null;
      if (this.component.prefix || this.component.suffix) {
				if (this.component.linkAnnotation && container.tagName === 'TD') {
					//custom requirement to add annotation buttons beside field which has propert linkAnnotation: true
					inputGroup = this.ce('div', {
						class: 'input-group displayInlineFlex'
					});
				}
				else {
					inputGroup = this.ce('div', {
						class: 'input-group'
					});
				}
        
        container.appendChild(inputGroup);
      }
      return inputGroup;
    }

    /**
     * Creates a new input mask placeholder.
     * @param {HTMLElement} mask - The input mask.
     * @returns {string} - The placeholder that will exist within the input as they type.
     */

  }, {
    key: 'maskPlaceholder',
    value: function maskPlaceholder(mask) {
      return mask.map(function (char) {
        return char instanceof RegExp ? '_' : char;
      }).join('');
    }

    /**
     * Sets the input mask for an input.
     * @param {HTMLElement} input - The html input to apply the mask to.
     */

  }, {
    key: 'setInputMask',
    value: function setInputMask(input) {
      if (input && this.component.inputMask) {
        var mask = _utils2.default.getInputMask(this.component.inputMask);
        this._inputMask = mask;
        this.inputMask = (0, _vanillaTextMask2.default)({
          inputElement: input,
          mask: mask
        });
        if (mask.numeric) {
          input.setAttribute('pattern', '\\d*');
        }
        if (!this.component.placeholder) {
          input.setAttribute('placeholder', this.maskPlaceholder(mask));
        }
      }
    }

    /**
     * Creates a new input element.
     * @param {HTMLElement} container - The container which should hold this new input element.
     * @returns {HTMLElement} - Either the input or the group that contains the input.
     */

  }, {
    key: 'createInput',
    value: function createInput(container, index, gridCnt) {
      var input = this.ce(this.info.type, this.info.attr);
      this.setInputMask(input);
      var inputGroup = this.addInputGroup(input, container);
      this.addPrefix(input, inputGroup);
      this.addInput(input, inputGroup || container);
      this.addSuffix(input, inputGroup, gridCnt, index);
      this.errorContainer = container;
      this.setInputStyles(inputGroup || input);
      return inputGroup || input;
    }

    /**
     * Wrapper method to add an event listener to an HTML element.
     *
     * @param obj
     *   The DOM element to add the event to.
     * @param evt
     *   The event name to add.
     * @param func
     *   The callback function to be executed when the listener is triggered.
     */

  }, {
    key: 'addEventListener',
    value: function addEventListener(obj, evt, func) {
      this.eventHandlers.push({ type: evt, func: func });
      if ('addEventListener' in obj) {
        obj.addEventListener(evt, func, false);
      } else if ('attachEvent' in obj) {
        obj.attachEvent('on' + evt, func);
      }
    }
  }, {
    key: 'redraw',
    value: function redraw() {
      // Don't bother if we have not built yet.
      if (!this.isBuilt) {
        return;
			}
			
			if (this.component.type !== 'checkbox') {
				this.clear();
			}
			this.build();
    }

    /**
     * Remove all event handlers.
     */

  }, {
    key: 'destroy',
    value: function destroy(all) {
      var _this4 = this;

      if (this.inputMask) {
        this.inputMask.destroy();
      }
      _lodash2.default.each(this.eventListeners, function (listener) {
        if (all || listener.internal) {
          _this4.events.off(listener.type, listener.listener);
        }
      });
      _lodash2.default.each(this.eventHandlers, function (handler) {
        if (handler.event) {
          window.removeEventListener(handler.event, handler.func);
        }
      });
      this.inputs = [];
    }

    /**
     * Render a template string into html.
     *
     * @param template
     * @param data
     * @param actions
     *
     * @return {HTMLElement} - The created element.
     */

  }, {
    key: 'renderTemplate',
    value: function renderTemplate(template, data) {
      var actions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

      // Create a container div.
      var div = this.ce('div');

      // Interpolate the template and populate
      div.innerHTML = _utils2.default.interpolate(template, data);

      // Add actions to matching elements.
      actions.forEach(function (action) {
        var elements = div.getElementsByClassName(action.class);
        Array.prototype.forEach.call(elements, function (element) {
          element.addEventListener(action.event, action.action);
        });
      });

      return div;
    }

    /**
     * Append different types of children.
     *
     * @param child
     */

  }, {
    key: 'appendChild',
    value: function appendChild(element, child) {
      var _this5 = this;

      if (Array.isArray(child)) {
        child.forEach(function (oneChild) {
          _this5.appendChild(element, oneChild);
        });
      } else if (child instanceof HTMLElement || child instanceof Text) {
        element.appendChild(child);
      } else if (child) {
        element.appendChild(this.text(child.toString()));
      }
    }

    /**
     * Alias for document.createElement.
     *
     * @param {string} type - The type of element to create
     * @param {Object} attr - The element attributes to add to the created element.
     * @param {Various} children - Child elements. Can be a DOM Element, string or array of both.
     * @param {Object} events
     *
     * @return {HTMLElement} - The created element.
     */

  }, {
    key: 'ce',
    value: function ce(type, attr) {
      var children = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

      // Create the element.
      var element = document.createElement(type);

      // Add attributes.
      if (attr) {
        this.attr(element, attr);
			}
			
			// checkbox enable/disabled case handling
			if(element.type === 'checkbox' && element.disabled === false &&  this !=undefined && this.disabled === true)
			{
				this.disabled = false;
			}
      // Append the children.
      this.appendChild(element, children);
      return element;
    }

    /**
     * Alias to create a text node.
     * @param text
     * @returns {Text}
     */

	}
	, {
    key: 'text',
    value: function text(_text) {
      return document.createTextNode(this.t(_text));
    }

    /**
     * Adds an object of attributes onto an element.
     * @param {HtmlElement} element - The element to add the attributes to.
     * @param {Object} attr - The attributes to add to the input element.
     */

  }, {
    key: 'attr',
    value: function attr(element, _attr) {
      var _this6 = this;

      _lodash2.default.each(_attr, function (value, key) {
        if (typeof value !== 'undefined') {
          if (key.indexOf('on') === 0) {
            // If this is an event, add a listener.
            _this6.addEventListener(element, key.substr(2).toLowerCase(), value);
          } else {
            // Otherwise it is just an attribute.
            element.setAttribute(key, value);
          }
        }
      });
    }

    /**
     * Adds a class to a DOM element.
     *
     * @param element
     *   The element to add a class to.
     * @param className
     *   The name of the class to add.
     */

  }, {
    key: 'addClass',
    value: function addClass(element, className) {
      var classes = element.getAttribute('class');
      if (!classes || classes.indexOf(className) === -1) {
        element.setAttribute('class', classes + ' ' + className);
      }
    }

    /**
     * Remove a class from a DOM element.
     *
     * @param element
     *   The DOM element to remove the class from.
     * @param className
     *   The name of the class that is to be removed.
     */

  }, {
    key: 'removeClass',
    value: function removeClass(element, className) {
      var cls = element.getAttribute('class');
      if (cls) {
        cls = cls.replace(new RegExp(className, 'g'), '');
        element.setAttribute('class', cls);
      }
    }

    /**
     * Determines if this component has a condition defined.
     *
     * @return {null}
     */

  }, {
    key: 'hasCondition',
    value: function hasCondition() {
      if (this._hasCondition !== null) {
        return this._hasCondition;
      }

      this._hasCondition = _utils2.default.hasCondition(this.component);
      return this._hasCondition;
    }

    /**
     * Check for conditionals and hide/show the element based on those conditions.
     */

  }, {
    key: 'checkConditions',
    value: function checkConditions(data) {
      // Check advanced conditions
      var result = void 0;

      if (!this.hasCondition()) {
        result = this.show(true);
      } else {
        result = this.show(_utils2.default.checkCondition(this.component, this.data, data));
      }

      if (this.fieldLogic(data)) {
				this.redraw();
      }

      return result;
    }

    /**
     * Check all triggers and apply necessary actions.
     *
     * @param data
     */

  }, {
    key: 'fieldLogic',
    value: function fieldLogic(data) {
			var _this7 = this;

      var logics = this.component.logic || [];

      // If there aren't logic, don't go further.
      if (logics.length === 0) {
        return;
      }
      var newComponent = _lodash2.default.cloneDeep(this.originalComponent);
			var resultval;
			var logicaction = 'property';
      var changed = logics.reduce(function (changed, logic) {
        var result = _utils2.default.checkTrigger(newComponent, logic.trigger, _this7.data, data);
				resultval = result;
        if (result) {
          changed |= logic.actions.reduce(function (changed, action) {
						logicaction = action.type;
            switch (action.type) {
              case 'property':
              if(newComponent.isBlock && newComponent.type === "datetime" && newComponent.blockId && data && data.minMaxVal) {
                  var block = newComponent.blockId;
                  if(data[block] && newComponent.row !== "") {
                    if(data[block][newComponent.row.split('-')[0]]) {
                    _this7.data = newComponent.data =  data[block][newComponent.row.split('-')[0]];
                    }
                  }
                }
                _utils2.default.setActionProperty(newComponent, action, _this7.data, data, newComponent, result);
								break;
							case 'value':
              {
                var newValue = new Function('row', 'data', 'component', 'result', action.value)(_this7.data, data, newComponent, result);
                if (!_lodash2.default.isEqual(_this7.getValue(), newValue)) {
                  _this7.setValue(newValue);
                   changed = true;
                }
                 break;
              }
              case 'checkboxSetValue':
                {
                  var newValue = new Function('row', 'data', 'component', 'result', action.value)(_this7.data, data, newComponent, result);
									if(newValue === undefined && newComponent.type === 'checkbox')
									newValue = action.value;

									if (newComponent.type === 'checkbox' && !_lodash2.default.isEqual(_this7.getValue(), newValue) && changedField !== _this7.id) {
										_this7.setValue(newValue);
									//	try{
										_this7.value = newValue;
									//	} catch(e){

									//	} finally {
											changed = true;
									//	}
                  }
                  break;
                }
              case 'validation':
                // TODO
                break;
            }
            return changed;
          }, false);
        }
        return changed;
      }, false);

			// // checkbox enable/disabled case handling
			if(resultval === false && this.originalComponent.type === "checkbox" && logicaction === 'property'  && this.component.disabled === true  
					&& this !== undefined && this.originalComponent !== undefined){
				this.component.disabled = false;
				changed = true;
			} else  if(resultval === true && this.originalComponent.type === "checkbox" && logicaction === 'property' && this.originalComponent.disabled === false  
			&& this !== undefined && this.originalComponent !== undefined){
				this.component.disabled = true;
				changed = true;
			}
      // If component definition changed, replace and mark as changed.
      if (!_lodash2.default.isEqual(this.component, newComponent) && this.originalComponent.type !== "checkbox") {
        this.component = newComponent;
        changed = true;
      }

      return changed;
    }

    /**
     * Add a new input error to this element.
     *
     * @param message
     * @param dirty
     */

  }, {
    key: 'addInputError',
    value: function addInputError(message, dirty) {
      var _this8 = this;

      if (!message) {
        return;
      }

      if (this.errorElement) {
        var errorMessage = this.ce('p', {
          class: 'help-block'
        });
        errorMessage.appendChild(this.text(message));
        this.errorElement.appendChild(errorMessage);
      }

			// Add error classes
			this.addClass(this.element, 'has-error');
      this.inputs.forEach(function (input) {
        // For valid individual inputs Changes start
        if (input.value === "") {
          if (input.parentElement.classList.contains('remove-validation')) {
            input.parentElement.classList.remove('remove-validation');
          }
          return _this8.addClass(input, 'is-invalid');
        } else {
          return _this8.addClass(input.parentElement, 'remove-validation');
        }
        //  For valid individual inputs Changes End
			});
			if (dirty && this.options.highlightErrors) {
       this.addClass(this.element, 'alert alert-danger');
      }
    }

    /**
     * Hide or Show an element.
     *
     * @param show
     */

  }, {
    key: 'show',
    value: function show(_show) {
      // Execute only if visibility changes.
      if (!_show === !this._visible) {
        return _show;
      }

      this._visible = _show;
      this.showElement(_show && !this.component.hidden);
      this.clearOnHide(_show);
      return _show;
    }

    /**
     * Show or hide the root element of this component.
     *
     * @param show
     */

  }, {
    key: 'showElement',
    value: function showElement(show) {
      var element = this.getElement();
      if (element) {
        if (show) {
          element.removeAttribute('hidden');
          element.style.visibility = 'visible';
          element.style.position = 'relative';
        } else {
          element.setAttribute('hidden', true);
          element.style.visibility = 'hidden';
          element.style.position = 'absolute';
        }
      }
      return show;
    }
  }, {
    key: 'clearOnHide',
    value: function clearOnHide(show) {
      // clearOnHide defaults to true for old forms (without the value set) so only trigger if the value is false.
      if (this.component.clearOnHide !== false) {
        if (!show) {
					delete this.data[this.component.key];
					if (this.inputs && this.inputs.length > 0) {
            this.inputs[0].value = '';
          }
        } else if (!this.data || this.data.hasOwnProperty(this.component.key)) {
          // If shown, ensure the default is set.
          this.setValue(this.defaultValue, {
            noUpdateEvent: true
          });
        }
        this.redraw();
        this.pristine = true;
			}
    }
  }, {
    key: 'onResize',
    value: function onResize() {}

    /**
     * Allow for options to hook into the functionality of this renderer.
     * @return {*}
     */

  }, {
    key: 'hook',
    value: function hook() {
      var name = arguments[0];
      var fn = typeof arguments[arguments.length - 1] === 'function' ? arguments[arguments.length - 1] : null;
      if (this.options && this.options.hooks && this.options.hooks[name]) {
        return this.options.hooks[name].apply(this, Array.prototype.slice.call(arguments, 1));
      } else {
        // If this is an async hook instead of a sync.
        if (fn) {
          return fn(null, arguments[1]);
        } else {
          return arguments[1];
        }
      }
    }
  }, {
    key: 'onChange',
    value: function onChange(flags, fromRoot) {
      flags = flags || {};
      if (!flags.noValidate) {
        this.pristine = false;
      }

      // Set the changed variable.
      var changed = {
        component: this.component,
        value: this.value,
        flags: flags
      };

			if (changed.component.id !== undefined) {
				changedField = changed.component.id;
			}

      // Emit the change.
      this.emit('componentChange', changed);
      $('button.markAnnotationBtn').removeClass('mandatoryError');
      $('.blockSameDateErrorMessage').removeClass('alert-danger');
      // Bubble this change up to the top.
      if (this.root && !fromRoot) {
        // $('button.markAnnotationBtn').removeClass('mandatoryError');
        this.root.triggerChange(flags, changed);
			}
    }
  }, {
    key: 'addInputSubmitListener',
    value: function addInputSubmitListener(input) {
      var _this9 = this;

      if (!this.options.submitOnEnter) {
        return;
      }
      this.addEventListener(input, 'keypress', function (event) {
        var key = event.keyCode || event.which;
        if (key === 13) {
          event.preventDefault();
          event.stopPropagation();
          _this9.emit('submitButton');
        }
      });
    }

    /**
     * Add new input element listeners.
     *
     * @param input
     */

  }, {
    key: 'addInputEventListener',
    value: function addInputEventListener(input) {
      var _this10 = this;

      this.addEventListener(input, this.info.changeEvent, function () {
        return _this10.updateValue({ changed: true });
      });
    }

    /**
     * Add a new input to this comonent.
     *
     * @param input
     * @param container
     * @param noSet
     */

  }, {
    key: 'addInput',
    value: function addInput(input, container) {
      if (input && container) {
        this.inputs.push(input);
				input = container.appendChild(input);
      }
      this.hook('input', input, container);
      this.addInputEventListener(input);
      this.addInputSubmitListener(input);
    }

    /**
     * Get the static value of this component.
     * @return {*}
     */

  }, {
    key: 'getValueAt',


    /**
     * Get the value at a specific index.
     *
     * @param index
     * @returns {*}
     */
    value: function getValueAt(index) {
      return this.inputs[index].value;
    }

    /**
     * Get the input value of this component.
     *
     * @return {*}
     */

  }, {
    key: 'getValue',
    value: function getValue() {
      if (!this.hasInput) {
        return;
      }
      if (this.viewOnly) {
        return this.value;
      }
      var values = [];
      for (var i in this.inputs) {
        if (this.inputs.hasOwnProperty(i)) {
          if (!this.component.multiple) {
            return this.getValueAt(i);
          }
          values.push(this.getValueAt(i));
        }
      }
      return values;
    }

    /**
     * Determine if the value of this component has changed.
     *
     * @param before
     * @param after
     * @return {boolean}
     */

  }, {
    key: 'hasChanged',
    value: function hasChanged(before, after) {
      return !_lodash2.default.isEqual(before, after);
    }

    /**
     * Update a value of this component.
     *
     * @param flags
     */

  }, {
    key: 'updateValue',
    value: function updateValue(flags) {
      if (!this.hasInput) {
        return false;
      }

      flags = flags || {};
      var value = this.data[this.component.key];
      this.data[this.component.key] = this.getValue(flags);
      if (this.viewOnly) {
        this.updateViewOnlyValue(this.value);
      }

      var changed = flags.changed || this.hasChanged(value, this.data[this.component.key]);
      delete flags.changed;
      if (!flags.noUpdateEvent && changed) {
        this.triggerChange(flags);
      }
      return changed;
    }

    /**
     * Restore the value of a control.
     */

  }, {
    key: 'restoreValue',
    value: function restoreValue() {
      if (this.data && this.data.hasOwnProperty(this.component.key)) {
        this.setValue(this.data[this.component.key], {
          noUpdateEvent: true
        });
      } else {
        var defaultValue = this.defaultValue;
        if (!this.data.hasOwnProperty(this.component.key) && defaultValue) {
          this.setValue(defaultValue, {
            noUpdateEvent: true
          });
        }
      }
    }

    /**
     * Perform a calculated value operation.
     *
     * @param data - The global data object.
     *
     * @return {boolean} - If the value changed during calculation.
     */

  }, {
    key: 'calculateValue',
    value: function calculateValue(data, flags) {
      if (!this.component.calculateValue) {
        return false;
      }

      flags = flags || {};
      flags.noCheck = true;
      var changed = false;

      // If this is a string, then use eval to evalulate it.
      if (typeof this.component.calculateValue === 'string') {
        try {
          var value = new Function('component', 'row', 'data', 'value = []; ' + this.component.calculateValue + '; return value;')(this, this.data, data);
          changed = this.setValue(value, flags);
        } catch (err) {
          /* eslint-disable no-console */
          console.warn('An error occurred calculating a value for ' + this.component.key, err);
          changed = false;
          /* eslint-enable no-console */
        }
      } else {
        try {
          var val = _utils2.default.jsonLogic.apply(this.component.calculateValue, {
            data: data,
            row: this.data,
            _: _lodash2.default
          });
          changed = this.setValue(val, flags);
        } catch (err) {
          /* eslint-disable no-console */
          console.warn('An error occurred calculating a value for ' + this.component.key, err);
          changed = false;
          /* eslint-enable no-console */
        }
      }

      return changed;
    }

    /**
     * Get this component's label text.
     *
     */

  }, {
    key: 'getRoot',


    /**
     * Get FormioForm element at the root of this component tree.
     *
     */
    value: function getRoot() {
      return this.root;
    }

    /**
     * Returns the invalid message, or empty string if the component is valid.
     *
     * @param data
     * @param dirty
     * @return {*}
     */

  }, {
    key: 'invalidMessage',
    value: function invalidMessage(data, dirty) {
      // No need to check for errors if there is no input or if it is pristine.
      if (!this.hasInput || !dirty && this.pristine) {
        return '';
      }

      return _Validator.Validator.check(this, data);
    }

    /**
     * Returns if the component is valid or not.
     *
     * @param data
     * @param dirty
     * @return {boolean}
     */

  }, {
    key: 'isValid',
    value: function isValid(data, dirty) {
      return !this.invalidMessage(data, dirty);
    }
  }, {
    key: 'checkValidity',
    value: function checkValidity(data, dirty) {
      // Force valid if component is conditionally hidden.
      if (!_utils2.default.checkCondition(this.component, data, this.data)) {
        return true;
      }

      var message = this.invalid || this.invalidMessage(data, dirty);
      this.setCustomValidity(message, dirty);
      return message ? false : true;
    }
  }, {
    key: 'getRawValue',
    value: function getRawValue() {
      return this.data[this.component.key];
    }
  }, {
    key: 'isEmpty',
    value: function isEmpty(value) {
      return value == null || value.length === 0;
    }

    /**
     * Check if a component is eligible for multiple validation
     *
     * @return {boolean}
     */

  }, {
    key: 'validateMultiple',
    value: function validateMultiple(value) {
      return this.component.multiple && Array.isArray(value);
    }
  }, {
    key: 'interpolate',
    value: function interpolate(string, data) {
      return _utils2.default.interpolate(string, data);
    }
  }, {
    key: 'setCustomValidity',
    value: function setCustomValidity(message, dirty) {
      var _this11 = this;

      if (this.errorElement && this.errorContainer) {
        this.errorElement.innerHTML = '';
        this.removeChildFrom(this.errorElement, this.errorContainer);
      }
      this.removeClass(this.element, 'has-error');
      this.inputs.forEach(function (input) {
        return _this11.removeClass(input, 'is-invalid');
      });
      if (this.options.highlightErrors) {
        this.removeClass(this.element, 'alert alert-danger');
      }
      if (message) {
        this.error = {
          component: this.component,
          message: message
        };
        this.emit('componentError', this.error);
        this.createErrorElement();
        this.addInputError(message, dirty);
      } else {
        this.error = null;
      }
      _lodash2.default.each(this.inputs, function (input) {
        if (typeof input.setCustomValidity === 'function') {
          input.setCustomValidity(message, dirty);
        }
      });
    }

    /**
     * Set the value at a specific index.
     *
     * @param index
     * @param value
     */

  }, {
    key: 'setValueAt',
    value: function setValueAt(index, value) {
      if (value === null || value === undefined) {
        value = this.defaultValue;
      }
      this.inputs[index].value = value;
    }
  }, {
    key: 'getFlags',
    value: function getFlags() {
      return typeof arguments[1] === 'boolean' ? {
        noUpdateEvent: arguments[1],
        noValidate: arguments[2]
      } : arguments[1] || {};
    }
  }, {
    key: 'whenReady',
    value: function whenReady() {
      return _nativePromiseOnly2.default.resolve();
    }

    /**
     * Set the value of this component.
     *
     * @param value
     * @param flags
     *
     * @return {boolean} - If the value changed.
     */

  }, {
    key: 'setValue',
    value: function setValue(value, flags) {
      flags = this.getFlags.apply(this, arguments);
      if (!this.hasInput) {
        return false;
      }
      if (this.component.multiple && !Array.isArray(value)) {
        value = [value];
      }
      this.buildRows();
      var isArray = Array.isArray(value);
      for (var i in this.inputs) {
        if (this.inputs.hasOwnProperty(i)) {
          this.setValueAt(i, isArray ? value[i] : value);
        }
      }
      return this.updateValue(flags);
    }

    /**
     * Prints out the value of this component as a string value.
     */

  }, {
    key: 'asString',
    value: function asString(value) {
      value = value || this.getValue();
      return Array.isArray(value) ? value.join(', ') : value.toString();
    }

    /**
     * Return if the component is disabled.
     * @return {boolean}
     */

  }, {
    key: 'setDisabled',
    value: function setDisabled(element, disabled) {
      element.disabled = disabled;
      if (disabled) {
        element.setAttribute('disabled', 'disabled');
      } else {
        element.removeAttribute('disabled');
      }
    }
  }, {
    key: 'setLoading',
    value: function setLoading(element, loading) {
      if (element.loading === loading) {
        return;
      }

      element.loading = loading;
      if (!element.loader && loading) {
        element.loader = this.ce('i', {
          class: this.iconClass('refresh', true) + ' button-icon-right'
        });
      }
      if (element.loader) {
        if (loading) {
          this.appendTo(element.loader, element);
        } else {
          this.removeChildFrom(element.loader, element);
        }
      }
    }
  }, {
    key: 'selectOptions',
    value: function selectOptions(select, tag, options, defaultValue) {
      var _this12 = this;

      _lodash2.default.each(options, function (option) {
        var attrs = {
          value: option.value
        };
        if (defaultValue !== undefined && option.value === defaultValue) {
          attrs.selected = 'selected';
        }
        var optionElement = _this12.ce('option', attrs);
        optionElement.appendChild(_this12.text(option.label));
        select.appendChild(optionElement);
      });
    }
  }, {
    key: 'setSelectValue',
    value: function setSelectValue(select, value) {
      var options = select.querySelectorAll('option');
      _lodash2.default.each(options, function (option) {
        if (option.value === value) {
          option.setAttribute('selected', 'selected');
        } else {
          option.removeAttribute('selected');
        }
      });
      if (select.onchange) {
        select.onchange();
      }
      if (select.onselect) {
        select.onchange();
      }
    }
  }, {
    key: 'clear',
    value: function clear() {
      this.destroy();
      this.empty(this.getElement());
    }
  }, {
    key: 'appendTo',
    value: function appendTo(element, container) {
      if (container) {
        container.appendChild(element);
      }
    }
  }, {
    key: 'append',
    value: function append(element) {
      this.appendTo(element, this.element);
    }
  }, {
    key: 'prependTo',
    value: function prependTo(element, container) {
      if (container) {
        if (container.firstChild) {
          try {
            container.insertBefore(element, container.firstChild);
          } catch (err) {
            console.warn(err);
            container.appendChild(element);
          }
        } else {
          container.appendChild(element);
        }
      }
    }
  }, {
    key: 'prepend',
    value: function prepend(element) {
      this.prependTo(element, this.element);
    }
  }, {
    key: 'removeChildFrom',
    value: function removeChildFrom(element, container) {
      if (container && container.contains(element)) {
        try {
          container.removeChild(element);
        } catch (err) {
          console.warn(err);
        }
      }
    }
  }, {
    key: 'removeChild',
    value: function removeChild(element) {
      this.removeChildFrom(element, this.element);
    }

    /**
     * Get the element information.
     */

  }, {
    key: 'elementInfo',
    value: function elementInfo() {
      var attributes = {
        name: this.options.name,
        type: this.component.inputType || 'text',
        class: 'form-control',
        lang: this.options.language
      };

      if (this.component.placeholder) {
        attributes.placeholder = this.t(this.component.placeholder);
      }

      if (this.component.tabindex) {
        attributes.tabindex = this.component.tabindex;
      }

      if (this.component.autofocus) {
        attributes.autofocus = this.component.autofocus;
      }

      return {
        type: 'input',
        component: this.component,
        changeEvent: 'change',
        attr: attributes
      };
    }
  }, {
    key: 'hasInput',
    get: function get() {
      return this.component.input || this.inputs.length;
    }
  }, {
    key: 'shouldDisable',
    get: function get() {
      return this.options.readOnly || this.component.disabled;
    }
  }, {
    key: 'viewOnly',
    get: function get() {
      return this.options.readOnly && this.options.viewAsHtml;
    }
  }, {
    key: 'defaultViewOnlyValue',
    get: function get() {
      return '-';
    }
  }, {
    key: 'className',
    get: function get() {
      var className = this.hasInput ? 'form-group has-feedback ' : '';
      className += 'formio-component formio-component-' + this.component.type + ' ';
      if (this.component.key) {
        className += 'formio-component-' + this.component.key + ' ';
      }
      if (this.component.customClass) {
        className += this.component.customClass;
      }
      if (this.hasInput && this.component.validate && this.component.validate.required) {
        className += ' required';
      }
      return className;
    }

    /**
     * Build the custom style from the layout values
     * @return {string} - The custom style
     */

  }, {
    key: 'customStyle',
    get: function get() {
      var customCSS = '';
      _lodash2.default.each(this.component.style, function (value, key) {
        if (value !== '') {
          customCSS += key + ':' + value + ';';
        }
      });
      return customCSS;
    }
  }, {
    key: 'defaultValue',
    get: function get() {
      var defaultValue = '';
      if (this.component.defaultValue) {
        defaultValue = this.component.defaultValue;
      } else if (this.component.customDefaultValue) {
        if (typeof this.component.customDefaultValue === 'string') {
          try {
            defaultValue = new Function('component', 'row', 'data', 'var value = \'\'; ' + this.component.customDefaultValue + '; return value;')(this, this.data, this.data);
          } catch (e) {
            defaultValue = null;
            /* eslint-disable no-console */
            console.warn('An error occurred getting default value for ' + this.component.key, e);
            /* eslint-enable no-console */
          }
        } else {
          try {
            defaultValue = _utils2.default.jsonLogic.apply(this.component.customDefaultValue, {
              data: this.data,
              row: this.data,
              _: _lodash2.default
            });
          } catch (err) {
            defaultValue = null;
            /* eslint-disable no-console */
            console.warn('An error occurred calculating a value for ' + this.component.key, err);
            /* eslint-enable no-console */
          }
        }
      }

      if (this._inputMask) {
        defaultValue = (0, _vanillaTextMask.conformToMask)(defaultValue, this._inputMask).conformedValue;
        if (!_utils2.default.matchInputMask(defaultValue, this._inputMask)) {
          defaultValue = '';
        }
      }

      return defaultValue;
    }
  }, {
    key: 'name',
    get: function get() {
      return this.t(this.component.label || this.component.placeholder || this.component.key);
    }

    /**
     * Returns the error label for this component.
     * @return {*}
     */

  }, {
    key: 'errorLabel',
    get: function get() {
      return this.t(this.component.errorLabel || this.component.label || this.component.placeholder || this.component.key);
    }
  }, {
    key: 'visible',
    set: function set(visible) {
      this.show(visible);
    },
    get: function get() {
      return this._visible;
    }
  }, {
    key: 'value',
    get: function get() {
      if (!this.data) {
        return null;
      }
      return this.data[this.component.key];
    }
  }, {
    key: 'label',
    get: function get() {
      return this.component.label;
    }

    /**
     * Set this component's label text and render it.
     *
     * @param value - The new label text.
     */
    ,
    set: function set(value) {
      this.component.label = value;
      if (this.labelElement) {
        this.labelElement.innerText = value;
      }
    }
  }, {
    key: 'errors',
    get: function get() {
      return this.error ? [this.error] : [];
    }
  }, {
    key: 'disabled',
    get: function get() {
      return this._disabled;
    }

    /**
     * Disable this component.
     *
     * @param {boolean} disabled
     */
    ,
    set: function set(disabled) {
      var _this13 = this;

      // Do not allow a component to be disabled if it should be always...
      if (!disabled && this.shouldDisable) {
        return;
      }

      this._disabled = disabled;

      // Disable all inputs.
      _lodash2.default.each(this.inputs, function (input) {
        return _this13.setDisabled(input, disabled);
      });
    }
  }]);

  return BaseComponent;
}();

exports.BaseComponent = BaseComponent;


BaseComponent.externalLibraries = {};
BaseComponent.requireLibrary = function (name, property, src, polling) {
  if (!BaseComponent.externalLibraries.hasOwnProperty(name)) {
    BaseComponent.externalLibraries[name] = {};
    BaseComponent.externalLibraries[name].ready = new _nativePromiseOnly2.default(function (resolve, reject) {
      BaseComponent.externalLibraries[name].resolve = resolve;
      BaseComponent.externalLibraries[name].reject = reject;
    });

    var callbackName = name + 'Callback';

    if (!polling && !window[callbackName]) {
      window[callbackName] = function () {
        this.resolve();
      }.bind(BaseComponent.externalLibraries[name]);
    }

    // See if the plugin already exists.
    var plugin = _lodash2.default.get(window, property);
    if (plugin) {
      BaseComponent.externalLibraries[name].resolve(plugin);
    } else {
      src = Array.isArray(src) ? src : [src];
      src.forEach(function (lib) {
        var attrs = {};
        var elementType = '';
        if (typeof lib === 'string') {
          lib = {
            type: 'script',
            src: lib
          };
        }
        switch (lib.type) {
          case 'script':
            elementType = 'script';
            attrs = {
              src: lib.src,
              type: 'text/javascript',
              defer: true,
              async: true
            };
            break;
          case 'styles':
            elementType = 'link';
            attrs = {
              href: lib.src,
              rel: 'stylesheet'
            };
            break;
        }

        // Add the script to the top page.
        var script = document.createElement(elementType);
        for (var attr in attrs) {
          script.setAttribute(attr, attrs[attr]);
        }
        document.getElementsByTagName('head')[0].appendChild(script);
      });

      // if no callback is provided, then check periodically for the script.
      if (polling) {
        setTimeout(function checkLibrary() {
          var plugin = _lodash2.default.get(window, property);
          if (plugin) {
            BaseComponent.externalLibraries[name].resolve(plugin);
          } else {
            // check again after 200 ms.
            setTimeout(checkLibrary, 200);
          }
        }, 200);
      }
    }
  }
  return BaseComponent.externalLibraries[name].ready;
};

BaseComponent.libraryReady = function (name) {
  if (BaseComponent.externalLibraries.hasOwnProperty(name) && BaseComponent.externalLibraries[name].ready) {
    return BaseComponent.externalLibraries[name].ready;
  }

  return _nativePromiseOnly2.default.reject(name + ' library was not required.');
};