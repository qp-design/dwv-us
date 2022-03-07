/** @namespace */
var dwv = dwv || {};

/**
 * Main application class.
 *
 * @class
 * @tutorial examples
 */
dwv.App = function () {
  // closure to self
  var self = this;

  // app options
  var options = null;

  // data controller
  var dataController = null;

  // toolbox controller
  var toolboxController = null;

  // layer controller
  var layerController = null;

  // load controller
  var loadController = null;

  // first load item flag
  var isFirstLoadItem = null;

  // UndoStack
  var undoStack = null;

  // Generic style
  var style = new dwv.gui.Style();

  /**
   * Listener handler.
   *
   * @type {object}
   * @private
   */
  var listenerHandler = new dwv.utils.ListenerHandler();

  /**
   * Get the image.
   *
   * @returns {Image} The associated image.
   */
  this.getImage = function () {
    return dataController.get(0).image;
  };
  /**
   * Set the image.
   *
   * @param {Image} img The associated image.
   */
  this.setImage = function (img) {
    dataController.setImage(img, 0);
  };

  /**
   * Get the meta data.
   *
   * @returns {object} The list of meta data.
   */
  this.getMetaData = function () {
    return dataController.get(0).meta;
  };

  /**
   * Is the data mono-slice?
   *
   * @returns {boolean} True if the data only contains one slice.
   */
  this.isMonoSliceData = function () {
    return loadController.isMonoSliceData();
  };
  /**
   * Is the data mono-frame?
   *
   * @returns {boolean} True if the data only contains one frame.
   */
  this.isMonoFrameData = function () {
    var viewLayer = layerController.getActiveViewLayer();
    var controller = viewLayer.getViewController();
    return controller.isMonoFrameData();
  };
  /**
   * Can the data be scrolled?
   *
   * @returns {boolean} True if the data has more than one slice or frame.
   */
  this.canScroll = function () {
    return !this.isMonoSliceData() || !this.isMonoFrameData();
  };

  /**
   * Can window and level be applied to the data?
   *
   * @returns {boolean} True if the data is monochrome.
   */
  this.canWindowLevel = function () {
    var viewLayer = layerController.getActiveViewLayer();
    var controller = viewLayer.getViewController();
    return controller.canWindowLevel();
  };

  /**
   * Get the layer scale on top of the base scale.
   *
   * @returns {object} The scale as {x,y}.
   */
  this.getAddedScale = function () {
    return layerController.getAddedScale();
  };

  /**
   * Get the base scale.
   *
   * @returns {object} The scale as {x,y}.
   */
  this.getBaseScale = function () {
    return layerController.getBaseScale();
  };

  /**
   * Get the layer offset.
   *
   * @returns {object} The offset.
   */
  this.getOffset = function () {
    return layerController.getOffset();
  };

  /**
   * Get the toolbox controller.
   *
   * @returns {object} The controller.
   */
  this.getToolboxController = function () {
    return toolboxController;
  };

  /**
   * Get the layer controller.
   * The controller is available after the first loaded item.
   *
   * @returns {object} The controller.
   */
  this.getLayerController = function () {
    return layerController;
  };

  /**
   * Get the app style.
   *
   * @returns {object} The app style.
   */
  this.getStyle = function () {
    return style;
  };

  /**
   * Add a command to the undo stack.
   *
   * @param {object} cmd The command to add.
   * @fires dwv.tool.UndoStack#undoadd
   */
  this.addToUndoStack = function (cmd) {
    if (undoStack !== null) {
      undoStack.add(cmd);
    }
  };

  /**
   * Initialise the application.
   *
   * @param {object} opt The application options.
   */
  this.init = function (opt) {
    // store
    options = opt;
    // defaults
    if (typeof options.containerDivId === 'undefined') {
      options.containerDivId = 'dwv';
    }
    if (typeof options.viewOnFirstLoadItem === 'undefined') {
      options.viewOnFirstLoadItem = true;
    }
    if (typeof options.nSimultaneousData === 'undefined') {
      options.nSimultaneousData = 1;
    }

    // undo stack
    undoStack = new dwv.tool.UndoStack();
    undoStack.addEventListener('undoadd', fireEvent);
    undoStack.addEventListener('undo', fireEvent);
    undoStack.addEventListener('redo', fireEvent);

    // tools
    if (options.tools && options.tools.length !== 0) {
      // setup the tool list
      var toolList = {};
      var keys = Object.keys(options.tools);
      for (var t = 0; t < keys.length; ++t) {
        var toolName = keys[t];
        var toolParams = options.tools[toolName];
        // find the tool in the dwv.tool namespace
        if (typeof dwv.tool[toolName] !== 'undefined') {
          // create tool instance
          toolList[toolName] = new dwv.tool[toolName](this);
          // register listeners
          if (typeof toolList[toolName].addEventListener !== 'undefined') {
            if (typeof toolParams.events !== 'undefined') {
              for (var j = 0; j < toolParams.events.length; ++j) {
                var eventName = toolParams.events[j];
                toolList[toolName].addEventListener(eventName, fireEvent);
              }
            }
          }
          // tool options
          if (typeof toolParams.options !== 'undefined') {
            var type = 'raw';
            if (typeof toolParams.type !== 'undefined') {
              type = toolParams.type;
            }
            var toolOptions = toolParams.options;
            if (type === 'instance' ||
                type === 'factory') {
              toolOptions = {};
              for (var i = 0; i < toolParams.options.length; ++i) {
                var optionName = toolParams.options[i];
                var optionClassName = optionName;
                if (type === 'factory') {
                  optionClassName += 'Factory';
                }
                var toolNamespace = toolName.charAt(0).toLowerCase() +
                  toolName.slice(1);
                if (typeof dwv.tool[toolNamespace][optionClassName] !==
                  'undefined') {
                  toolOptions[optionName] =
                    dwv.tool[toolNamespace][optionClassName];
                } else {
                  dwv.logger.warn('Could not find option class for: ' +
                    optionName);
                }
              }
            }
            toolList[toolName].setOptions(toolOptions);
          }
        } else {
          dwv.logger.warn('Could not initialise unknown tool: ' + toolName);
        }
      }
      // add tools to the controller
      toolboxController = new dwv.ToolboxController(toolList);
    }

    // create load controller
    loadController = new dwv.LoadController(options.defaultCharacterSet);
    loadController.onloadstart = onloadstart;
    loadController.onprogress = onprogress;
    loadController.onloaditem = onloaditem;
    loadController.onload = onload;
    loadController.onloadend = onloadend;
    loadController.onerror = onerror;
    loadController.onabort = onabort;

    // create data controller
    dataController = new dwv.DataController();
  };

  /**
   * Get the size available for the layer container div.
   *
   * @returns {object} The available width and height: {width:X; height:Y}.
   */
  this.getLayerContainerSize = function () {
    var size = layerController.getLayerContainerSize();
    return {width: size.x, height: size.y};
  };

  /**
   * Get a HTML element associated to the application.
   *
   * @param {string} name The name or id to find.
   * @returns {object} The found element or null.
   */
  this.getElement = function (name) {
    return dwv.gui.getElement(options.containerDivId, name);
  };

  /**
   * Reset the application.
   */
  this.reset = function () {
    // clear objects
    dataController.reset();
    layerController.empty();
    // reset undo/redo
    if (undoStack) {
      undoStack = new dwv.tool.UndoStack();
      undoStack.addEventListener('undoadd', fireEvent);
      undoStack.addEventListener('undo', fireEvent);
      undoStack.addEventListener('redo', fireEvent);
    }
  };

  /**
   * Reset the layout of the application.
   */
  this.resetLayout = function () {
    layerController.reset();
    layerController.draw();
  };

  /**
   * Add an event listener to this class.
   *
   * @param {string} type The event type.
   * @param {object} callback The method associated with the provided
   *   event type, will be called with the fired event.
   */
  this.addEventListener = function (type, callback) {
    listenerHandler.add(type, callback);
  };

  /**
   * Remove an event listener from this class.
   *
   * @param {string} type The event type.
   * @param {object} callback The method associated with the provided
   *   event type.
   */
  this.removeEventListener = function (type, callback) {
    listenerHandler.remove(type, callback);
  };

  // load API [begin] -------------------------------------------------------

  /**
   * Load a list of files. Can be image files or a state file.
   *
   * @param {Array} files The list of files to load.
   * @fires dwv.App#loadstart
   * @fires dwv.App#loadprogress
   * @fires dwv.App#loaditem
   * @fires dwv.App#loadend
   * @fires dwv.App#error
   * @fires dwv.App#abort
   */
  this.loadFiles = function (files) {
    loadController.loadFiles(files);
  };

  /**
   * Load a list of URLs. Can be image files or a state file.
   *
   * @param {Array} urls The list of urls to load.
   * @param {object} options The options object, can contain:
   *  - requestHeaders: an array of {name, value} to use as request headers
   *  - withCredentials: boolean xhr.withCredentials flag to pass to the request
   *  - batchSize: the size of the request url batch
   * @fires dwv.App#loadstart
   * @fires dwv.App#loadprogress
   * @fires dwv.App#loaditem
   * @fires dwv.App#loadend
   * @fires dwv.App#error
   * @fires dwv.App#abort
   */
  this.loadURLs = function (urls, options) {
    loadController.loadURLs(urls, options);
  };

  /**
   * Load a list of ArrayBuffers.
   *
   * @param {Array} data The list of ArrayBuffers to load
   *   in the form of [{name: "", filename: "", data: data}].
   * @fires dwv.App#loadstart
   * @fires dwv.App#loadprogress
   * @fires dwv.App#loaditem
   * @fires dwv.App#loadend
   * @fires dwv.App#error
   * @fires dwv.App#abort
   */
  this.loadImageObject = function (data) {
    loadController.loadImageObject(data);
  };

  /**
   * Abort the current load.
   */
  this.abortLoad = function () {
    loadController.abort();
  };

  // load API [end] ---------------------------------------------------------

  /**
   * Fit the display to the given size. To be called once the image is loaded.
   */
  this.fitToContainer = function () {
    layerController.fitToContainer();
    layerController.draw();
    // update style
    style.setBaseScale(layerController.getBaseScale());
  };

  /**
   * Init the Window/Level display
   */
  this.initWLDisplay = function () {
    var viewLayer = layerController.getActiveViewLayer();
    var controller = viewLayer.getViewController();
    controller.initialise();
  };

  /**
   * Render the current data.
   */
  this.render = function () {
    layerController.draw();
  };

  /**
   * Zoom to the layers.
   *
   * @param {number} step The step to add to the current zoom.
   * @param {number} cx The zoom center X coordinate.
   * @param {number} cy The zoom center Y coordinate.
   */
  this.zoom = function (step, cx, cy) {
    // 最大放大3倍
    if(layerController.getScale().x > 3 * layerController.getBaseScale().x && step > 0) {
      return
    }

    layerController.addScale(step, {x: cx, y: cy});
    layerController.draw();
  };

  /**
   * Apply a translation to the layers.
   *
   * @param {number} tx The translation along X.
   * @param {number} ty The translation along Y.
   */
  this.translate = function (tx, ty) {
    layerController.addTranslation({x: tx, y: ty});
    layerController.draw();
  };

  /**
   * Set the image layer opacity.
   *
   * @param {number} alpha The opacity ([0:1] range).
   */
  this.setOpacity = function (alpha) {
    var viewLayer = layerController.getActiveViewLayer();
    viewLayer.setOpacity(alpha);
    viewLayer.draw();
  };

  /**
   * Get the list of drawing display details.
   *
   * @returns {object} The list of draw details including id, slice, frame...
   */
  this.getDrawDisplayDetails = function () {
    var drawController =
      layerController.getActiveDrawLayer().getDrawController();
    return drawController.getDrawDisplayDetails();
  };

  /**
   * Get a list of drawing store details.
   *
   * @returns {object} A list of draw details including id, text, quant...
   */
  this.getDrawStoreDetails = function () {
    var drawController =
      layerController.getActiveDrawLayer().getDrawController();
    return drawController.getDrawStoreDetails();
  };
  /**
   * Set the drawings on the current stage.
   *
   * @param {Array} drawings An array of drawings.
   * @param {Array} drawingsDetails An array of drawings details.
   */
  this.setDrawings = function (drawings, drawingsDetails) {
    var viewController =
      layerController.getActiveViewLayer().getViewController();
    var drawController =
      layerController.getActiveDrawLayer().getDrawController();

    drawController.setDrawings(
      drawings, drawingsDetails, fireEvent, this.addToUndoStack);

    drawController.activateDrawLayer(
      viewController.getCurrentPosition(),
      viewController.getCurrentFrame());
  };
  /**
   * Update a drawing from its details.
   *
   * @param {object} drawDetails Details of the drawing to update.
   */
  this.updateDraw = function (drawDetails) {
    var drawController =
      layerController.getActiveDrawLayer().getDrawController();
    drawController.updateDraw(drawDetails);
  };
  /**
   * Delete all Draws from all layers.
   */
  this.deleteDraws = function () {
    var drawController =
      layerController.getActiveDrawLayer().getDrawController();
    drawController.deleteDraws(fireEvent, this.addToUndoStack);
  };
  /**
   * Check the visibility of a given group.
   *
   * @param {object} drawDetails Details of the drawing to check.
   * @returns {boolean} True if the group is visible.
   */
  this.isGroupVisible = function (drawDetails) {
    var drawController =
      layerController.getActiveDrawLayer().getDrawController();
    return drawController.isGroupVisible(drawDetails);
  };
  /**
   * Toggle group visibility.
   *
   * @param {object} drawDetails Details of the drawing to update.
   */
  this.toogleGroupVisibility = function (drawDetails) {
    var drawController =
      layerController.getActiveDrawLayer().getDrawController();
    drawController.toogleGroupVisibility(drawDetails);
  };

  /**
   * Get the JSON state of the app.
   *
   * @returns {object} The state of the app as a JSON object.
   */
  this.getState = function () {
    var state = new dwv.State();
    return state.toJSON(self);
  };

  // Handler Methods -----------------------------------------------------------

  /**
   * Handle resize: fit the display to the window.
   * To be called once the image is loaded.
   * Can be connected to a window 'resize' event.
   *
   * @param {object} _event The change event.
   * @private
   */
  this.onResize = function (_event) {
    self.fitToContainer();
  };

  /**
   * Key down callback. Meant to be used in tools.
   *
   * @param {object} event The key down event.
   * @fires dwv.App#keydown
   */
  this.onKeydown = function (event) {
    /**
     * Key down event.
     *
     * @event dwv.App#keydown
     * @type {KeyboardEvent}
     * @property {string} type The event type: keydown.
     * @property {string} context The tool where the event originated.
     */
    fireEvent(event);
  };

  /**
   * Key down event handler example.
   * - CRTL-Z: undo
   * - CRTL-Y: redo
   * - CRTL-ARROW_LEFT: next frame
   * - CRTL-ARROW_UP: next slice
   * - CRTL-ARROW_RIGHT: previous frame
   * - CRTL-ARROW_DOWN: previous slice
   *
   * @param {object} event The key down event.
   * @fires dwv.tool.UndoStack#undo
   * @fires dwv.tool.UndoStack#redo
   */
  this.defaultOnKeydown = function (event) {
    var viewController =
      layerController.getActiveViewLayer().getViewController();
    if (event.ctrlKey) {
      if (event.keyCode === 37) { // crtl-arrow-left
        event.preventDefault();
        viewController.decrementFrameNb();
      } else if (event.keyCode === 38) { // crtl-arrow-up
        event.preventDefault();
        viewController.incrementSliceNb();
      } else if (event.keyCode === 39) { // crtl-arrow-right
        event.preventDefault();
        viewController.incrementFrameNb();
      } else if (event.keyCode === 40) { // crtl-arrow-down
        event.preventDefault();
        viewController.decrementSliceNb();
      } else if (event.keyCode === 89) { // crtl-y
        undoStack.redo();
      } else if (event.keyCode === 90) { // crtl-z
        undoStack.undo();
      }
    }
  };

  // Internal members shortcuts-----------------------------------------------

  /**
   * Reset the display
   */
  this.resetDisplay = function () {
    self.resetLayout();
    self.initWLDisplay();
  };

  /**
   * Reset the app zoom.s
   */
  this.resetZoom = function () {
    self.resetLayout();
  };

  /**
   * Set the colour map.
   *
   * @param {string} colourMap The colour map name.
   */
  this.setColourMap = function (colourMap) {
    var viewController =
      layerController.getActiveViewLayer().getViewController();
    viewController.setColourMapFromName(colourMap);
  };

  /**
   * Set the window/level preset.
   *
   * @param {object} preset The window/level preset.
   */
  this.setWindowLevelPreset = function (preset) {
    var viewController =
      layerController.getActiveViewLayer().getViewController();
    viewController.setWindowLevelPreset(preset);
  };

  /**
   * Set the tool
   *
   * @param {string} tool The tool.
   */
  this.setTool = function (tool) {
    var layer = null;
    var previousLayer = null;
    if (tool === 'Draw' ||
      tool === 'Livewire' ||
      tool === 'Floodfill') {
      layer = layerController.getActiveDrawLayer();
      previousLayer = layerController.getActiveViewLayer();
    } else {
      layer = layerController.getActiveViewLayer();
      previousLayer = layerController.getActiveDrawLayer();
    }
    if (previousLayer) {
      toolboxController.detachLayer(previousLayer);
    }
    // detach to avoid possible double attach
    toolboxController.detachLayer(layer);

    toolboxController.attachLayer(layer);
    toolboxController.setSelectedTool(tool);
  };

  /**
   * Set the draw shape.
   *
   * @param {string} shape The draw shape.
   */
  this.setDrawShape = function (shape) {
    toolboxController.setSelectedShape(shape);
  };

  /**
   * Set the image filter
   *
   * @param {string} filter The image filter.
   */
  this.setImageFilter = function (filter) {
    toolboxController.setSelectedFilter(filter);
  };

  /**
   * Run the selected image filter.
   */
  this.runImageFilter = function () {
    toolboxController.runSelectedFilter();
  };

  /**
   * Set the draw line colour.
   *
   * @param {string} colour The line colour.
   */
  this.setDrawLineColour = function (colour) {
    toolboxController.setLineColour(colour);
  };

  /**
   * Set the filter min/max.
   *
   * @param {object} range The new range of the data: {min:a, max:b}.
   */
  this.setFilterMinMax = function (range) {
    toolboxController.setRange(range);
  };

  /**
   * Undo the last action
   *
   * @fires dwv.tool.UndoStack#undo
   */
  this.undo = function () {
    undoStack.undo();
  };

  /**
   * Redo the last action
   *
   * @fires dwv.tool.UndoStack#redo
   */
  this.redo = function () {
    undoStack.redo();
  };


  // Private Methods -----------------------------------------------------------

  /**
   * Fire an event: call all associated listeners with the input event object.
   *
   * @param {object} event The event to fire.
   * @private
   */
  function fireEvent(event) {
    listenerHandler.fireEvent(event);
  }

  /**
   * Data load start callback.
   *
   * @param {object} event The load start event.
   * @private
   */
  function onloadstart(event) {
    isFirstLoadItem = true;

    if (event.loadtype === 'image' &&
      dataController.length() === options.nSimultaneousData) {
      self.reset();
    }

    /**
     * Load start event.
     *
     * @event dwv.App#loadstart
     * @type {object}
     * @property {string} type The event type: loadstart.
     * @property {string} loadType The load type: image or state.
     * @property {*} source The load source: string for an url,
     *   File for a file.
     */
    event.type = 'loadstart';
    fireEvent(event);
  }

  /**
   * Data load progress callback.
   *
   * @param {object} event The progress event.
   * @private
   */
  function onprogress(event) {
    /**
     * Load progress event.
     *
     * @event dwv.App#loadprogress
     * @type {object}
     * @property {string} type The event type: loadprogress.
     * @property {string} loadType The load type: image or state.
     * @property {*} source The load source: string for an url,
     *   File for a file.
     * @property {number} loaded The loaded percentage.
     * @property {number} total The total percentage.
     */
    event.type = 'loadprogress';
    fireEvent(event);
  }

  /**
   * Data load callback.
   *
   * @param {object} event The load event.
   * @private
   */
  function onloaditem(event) {
    // check event
    if (typeof event.data === 'undefined') {
      dwv.logger.error('Missing loaditem event data ' + event);
    }
    if (typeof event.loadtype === 'undefined') {
      dwv.logger.error('Missing loaditem event load type ' + event);
    }

    // number returned by image.appendSlice
    var sliceNb = null;

    var eventMetaData = null;
    if (event.loadtype === 'image') {
      if (isFirstLoadItem) {
        dataController.addNew(event.data.image, event.data.info);
      } else {
        sliceNb = dataController.updateCurrent(
          event.data.image, event.data.info);
      }

      eventMetaData = event.data.info;
    } else if (event.loadtype === 'state') {
      var state = new dwv.State();
      state.apply(self, state.fromJSON(event.data));
      eventMetaData = 'state';
    }

    /**
     * Load item event: fired when a load item is successfull.
     *
     * @event dwv.App#loaditem
     * @type {object}
     * @property {string} type The event type: loaditem.
     * @property {string} loadType The load type: image or state.
     * @property {*} source The load source: string for an url,
     *   File for a file.
     * @property {object} data The loaded meta data.
     */
    fireEvent({
      type: 'loaditem',
      data: eventMetaData,
      source: event.source,
      loadtype: event.loadtype
    });

    // adapt context
    if (event.loadtype === 'image') {
      if (isFirstLoadItem) {
        // create layer controller if not done yet
        // warn: needs a loaded DOM
        if (!layerController) {
          layerController =
            new dwv.LayerController(self.getElement('layerContainer'));
        }
        // initialise or add view
        var dataIndex = dataController.getCurrentIndex();
        var data = dataController.get(dataIndex);
        if (layerController.getNumberOfLayers() === 0) {
          initialiseBaseLayers(data.image, data.meta, dataIndex);
        } else {
          addViewLayer(data.image, data.meta, dataIndex);
        }
      } else {
        // update slice number if new slice was inserted before
        var controller =
          layerController.getActiveViewLayer().getViewController();
        var currentPosition = controller.getCurrentPosition();
        if (sliceNb <= currentPosition.k) {
          controller.setCurrentPosition({
            i: currentPosition.i,
            j: currentPosition.j,
            k: currentPosition.k + 1
          }, true);
        }
      }

      // render if flag allows
      if (isFirstLoadItem && options.viewOnFirstLoadItem) {
        self.render();
      }
    }

    // reset flag
    isFirstLoadItem = false;
  }

  /**
   * Data load callback.
   *
   * @param {object} event The load event.
   * @private
   */
  function onload(event) {
    /**
     * Load event: fired when a load finishes successfully.
     *
     * @event dwv.App#load
     * @type {object}
     * @property {string} type The event type: load.
     * @property {string} loadType The load type: image or state.
     */
    event.type = 'load';
    fireEvent(event);
  }

  /**
   * Data load end callback.
   *
   * @param {object} event The load end event.
   * @private
   */
  function onloadend(event) {
    isFirstLoadItem = null;
    /**
     * Main load end event: fired when the load finishes,
     *   successfully or not.
     *
     * @event dwv.App#loadend
     * @type {object}
     * @property {string} type The event type: loadend.
     * @property {string} loadType The load type: image or state.
     * @property {*} source The load source: string for an url,
     *   File for a file.
     */
    event.type = 'loadend';
    fireEvent(event);
  }

  /**
   * Data load error callback.
   *
   * @param {object} event The error event.
   * @private
   */
  function onerror(event) {
    /**
     * Load error event.
     *
     * @event dwv.App#error
     * @type {object}
     * @property {string} type The event type: error.
     * @property {string} loadType The load type: image or state.
     * @property {*} source The load source: string for an url,
     *   File for a file.
     * @property {object} error The error.
     * @property {object} target The event target.
     */
    event.type = 'error';
    fireEvent(event);
  }

  /**
   * Data load abort callback.
   *
   * @param {object} event The abort event.
   * @private
   */
  function onabort(event) {
    /**
     * Load abort event.
     *
     * @event dwv.App#abort
     * @type {object}
     * @property {string} type The event type: abort.
     * @property {string} loadType The load type: image or state.
     * @property {*} source The load source: string for an url,
     *   File for a file.
     */
    event.type = 'abort';
    fireEvent(event);
  }

  /**
   * Bind view layer events to app.
   *
   * @param {object} viewLayer The view layer.
   * @private
   */
  function bindViewLayer(viewLayer) {
    // propagate view events
    viewLayer.propagateViewEvents(true);
    for (var j = 0; j < dwv.image.viewEventNames.length; ++j) {
      viewLayer.addEventListener(dwv.image.viewEventNames[j], fireEvent);
    }
    // propagate viewLayer events
    viewLayer.addEventListener('renderstart', fireEvent);
    viewLayer.addEventListener('renderend', fireEvent);
  }

  /**
   * Un-Bind view layer events from app.
   *
   * @param {object} viewLayer The view layer.
   * @private
   */
  function unbindViewLayer(viewLayer) {
    // stop propagating view events
    viewLayer.propagateViewEvents(false);
    for (var j = 0; j < dwv.image.viewEventNames.length; ++j) {
      viewLayer.removeEventListener(dwv.image.viewEventNames[j], fireEvent);
    }
    // stop propagating viewLayer events
    viewLayer.removeEventListener('renderstart', fireEvent);
    viewLayer.removeEventListener('renderend', fireEvent);
  }

  /**
   * Initialise the layers.
   * To be called once the DICOM data has been loaded.
   *
   * @param {object} image The image to view.
   * @param {object} meta The image meta data.
   * @param {number} dataIndex The data index.
   * @private
   */
  function initialiseBaseLayers(image, meta, dataIndex) {
    // view layer
    var viewLayer = layerController.addViewLayer();
    // optional draw layer
    if (toolboxController && toolboxController.hasTool('Draw')) {
      layerController.addDrawLayer();
    }
    // initialise layers
    layerController.initialise(image, meta, dataIndex);

    // update style
    style.setBaseScale(layerController.getBaseScale());
    // bind view to app
    bindViewLayer(viewLayer);

    // propagate layer events
    layerController.addEventListener('zoomchange', fireEvent);
    layerController.addEventListener('offsetchange', fireEvent);

    // listen to image changes
    dataController.addEventListener('imagechange', viewLayer.onimagechange);

    // initialise the toolbox
    if (toolboxController) {
      toolboxController.init(layerController.displayToIndex);
    }
  }

  /**
   * Add a view layer.
   *
   * @param {object} image The image to view.
   * @param {object} meta The image meta data.
   * @param {number} dataIndex The data index.
   */
  function addViewLayer(image, meta, dataIndex) {
    // un-bind previous
    unbindViewLayer(layerController.getActiveViewLayer());

    var viewLayer = layerController.addViewLayer();
    // initialise
    viewLayer.initialise(image, meta, dataIndex);
    // apply layer scale
    viewLayer.resize(layerController.getScale());
    // listen to image changes
    dataController.addEventListener('imagechange', viewLayer.onimagechange);

    // bind new
    bindViewLayer(viewLayer);
  }

};
