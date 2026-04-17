class RectangleEditor {
  constructor(containerOrId, options = {}) {
    if (typeof containerOrId === "string") {
      this.container = document.getElementById(containerOrId);
    } else {
      this.container = containerOrId;
    }
    if (!this.container) {
      throw new Error("Container element not found");
    }

    // Create canvas element
    this.canvas = document.createElement("canvas");
    this.canvas.style.border = "1px solid var(--BORDER, #44475a)";
    this.canvas.style.borderRadius = "4px";
    this.canvas.style.cursor = "crosshair";
    this.canvas.style.display = "block";
    this.canvas.style.maxWidth = "100%";
    this.canvas.style.height = "auto";
    this.canvas.style.imageRendering = "pixelated";
    this.container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext("2d");

    // Options with defaults
    this.options = {
      width: options.width || 800,
      height: options.height || 600,
      snapEnabled:
        options.snapEnabled !== undefined ? options.snapEnabled : true,
      autoFitEnabled:
        options.autoFitEnabled !== undefined ? options.autoFitEnabled : false,
      showNumbers:
        options.showNumbers !== undefined ? options.showNumbers : true,
      onStateChange: options.onStateChange || null,
      onRectanglesChanged: options.onRectanglesChanged || null,
    };

    // State
    this.rectangles = [];
    this.selectedRects = new Set();
    this.dragHandle = null;
    this.isDragging = false;
    this.isSelecting = false;
    this.selectStart = null;
    this.selectEnd = null;
    this.image = null;
    this.video = null;
    this.videoElement = null;
    this.mousePos = { x: 0, y: 0 };
    this.dragOffset = { x: 0, y: 0 };
    this.dragStartPositions = new Map();

    this._destroyed = false;
    this.handleSize = 8;
    this.edgeHandleWidth = 6;
    this.snapDistance = 15;
    this.edgeSnapDistance = 50;
    this.snapEnabled = this.options.snapEnabled;
    this.autoFitEnabled = this.options.autoFitEnabled;
    this.showNumbers = this.options.showNumbers;
    this.nextNumber = 1;

    this.nearestEdge = null;
    this.edgeHighlight = 0;
    this.snappedEdge = null;
    this.groupResizeMode = false;

    // Undo/Redo history
    this.history = [];
    this.historyIndex = -1;
    this.maxHistorySize = 50;

    // Notifications
    this.notifications = [];
    this.notificationDuration = 2000;

    this.init();
  }

  init() {
    this.setupCanvas();
    this.setupEventListeners();
    this.saveState();
    this.animate();
  }

  setupCanvas() {
    this.canvas.width = this.options.width;
    this.canvas.height = this.options.height;
  }


  setupEventListeners() {
    this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this));
    this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this));
    this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this));
    this.canvas.addEventListener(
      "mouseleave",
      this.handleMouseLeave.bind(this),
    );
    this.canvas.addEventListener(
      "contextmenu",
      this.handleRightClick.bind(this),
    );
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
  }

  // Public API Methods
  generateRectangles(count) {
    this.saveState();
    this.rectangles = [];
    this.selectedRects.clear();
    this.nextNumber = 1;

    const maxRectSize = 60;
    const minRectSize = 20;
    const padding = 10;
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;

    // Calculate optimal size based on count
    // Start with max size and decrease if needed to fit all rectangles
    let rectSize = maxRectSize;
    let cols, rows;

    // Find the optimal size that fits all rectangles
    while (rectSize >= minRectSize) {
      cols = Math.floor((canvasWidth - padding * 2) / (rectSize + padding));
      rows = Math.ceil(count / cols);

      // Check if all rectangles fit with current size
      const totalHeight = rows * (rectSize + padding) - padding;
      const totalWidth = cols * (rectSize + padding) - padding;

      if (
        totalHeight <= canvasHeight - padding * 2 &&
        totalWidth <= canvasWidth - padding * 2
      ) {
        break; // Found a size that fits
      }

      rectSize -= 5; // Decrease size and try again
    }

    // If we still can't fit, use minimum size and accept that some might not fit
    if (rectSize < minRectSize) {
      rectSize = minRectSize;
      cols = Math.floor((canvasWidth - padding * 2) / (rectSize + padding));
      rows = Math.ceil(count / cols);
    }

    // Recalculate with final size
    cols = Math.floor((canvasWidth - padding * 2) / (rectSize + padding));
    rows = Math.ceil(count / cols);

    const totalWidth = Math.min(
      cols * (rectSize + padding) - padding,
      canvasWidth - padding * 2,
    );
    const totalHeight = Math.min(
      rows * (rectSize + padding) - padding,
      canvasHeight - padding * 2,
    );

    const startX = (canvasWidth - totalWidth) / 2;
    const startY = (canvasHeight - totalHeight) / 2;

    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;

      const x = startX + col * (rectSize + padding);
      const y = startY + row * (rectSize + padding);

      // Only add rectangles that fit in the canvas
      if (
        x + rectSize <= canvasWidth - padding &&
        y + rectSize <= canvasHeight - padding
      ) {
        const rect = {
          x: x,
          y: y,
          width: rectSize,
          height: rectSize,
          color: `hsla(${((i * 360) / count) % 360}, 70%, 60%, 0.3)`,
          strokeColor: `hsl(${((i * 360) / count) % 360}, 70%, 60%)`,
          id: i,
          number: this.nextNumber++,
        };

        this.rectangles.push(rect);
      }
    }

    // Show notification if not all rectangles could be placed
    if (this.rectangles.length < count) {
      this.showNotification(
        `${this.rectangles.length}/${count} Rechtecke platziert`,
      );
      setTimeout(() => {
        this.showNotification(`Größe: ${rectSize}px`);
      }, 150);
    } else {
      this.showNotification(`${count} Rechtecke generiert`);
      setTimeout(() => {
        this.showNotification(`Größe: ${rectSize}px`);
      }, 150);
    }

    this.updateState();
    this.draw();
  }

  loadMedia(file) {
    const fileType = file.type.split("/")[0];

    if (fileType === "image") {
      this.loadImage(file);
    } else if (fileType === "video") {
      this.loadVideo(file);
    } else {
      this.showNotification("Nicht unterstütztes Format");
    }
  }

  loadImage(imageFile) {
    // Clear video if exists
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement = null;
      this.video = null;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        this.image = img;
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.showNotification(`Bild geladen: ${img.width}x${img.height}px`);
        this.draw();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(imageFile);
  }

  loadVideo(videoFile) {
    // Clear image if exists
    this.image = null;

    const reader = new FileReader();
    reader.onload = (event) => {
      // Create video element if it doesn't exist
      if (!this.videoElement) {
        this.videoElement = document.createElement("video");
        this.videoElement.loop = true;
        this.videoElement.muted = true;
        this.videoElement.style.display = "none";
        document.body.appendChild(this.videoElement);
      }

      this.videoElement.src = event.target.result;

      this.videoElement.onloadedmetadata = () => {
        this.video = this.videoElement;
        this.canvas.width = this.videoElement.videoWidth;
        this.canvas.height = this.videoElement.videoHeight;
        this.videoElement.play();
        this.showNotification(
          `Video geladen: ${this.videoElement.videoWidth}x${this.videoElement.videoHeight}px`,
        );
        this.draw();
      };

      this.videoElement.onerror = () => {
        this.showNotification("Fehler beim Laden des Videos");
      };
    };
    reader.readAsDataURL(videoFile);
  }

  clearBackground() {
    this.image = null;
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.src = "";
      this.videoElement = null;
      this.video = null;
    }
    this.showNotification("Hintergrund entfernt");
    this.draw();
  }

  clearAll() {
    this.saveState();
    this.rectangles = [];
    this.selectedRects.clear();
    this.nextNumber = 1;
    this.updateState();
    this.draw();
  }

  deleteSelected() {
    if (this.selectedRects.size > 0) {
      this.saveState();
      this.rectangles = this.rectangles.filter(
        (rect) => !this.selectedRects.has(rect),
      );
      this.selectedRects.clear();
      this.updateState();
      this.draw();
    }
  }

  selectAll() {
    this.selectedRects.clear();
    this.rectangles.forEach((rect) => this.selectedRects.add(rect));
    this.updateState();
    this.draw();
  }

  exportData() {
    return {
      rectangles: this.rectangles.map((r) => ({
        number: r.number,
        x: Math.round(r.x),
        y: Math.round(r.y),
        width: Math.round(r.width),
        height: Math.round(r.height),
      })),
      canvasWidth: this.canvas.width,
      canvasHeight: this.canvas.height,
    };
  }

  // Settings
  setSnapEnabled(enabled) {
    this.snapEnabled = enabled;
    this.showNotification(`Snapping: ${enabled ? "EIN" : "AUS"}`);
  }

  setAutoFitEnabled(enabled) {
    this.autoFitEnabled = enabled;
    this.showNotification(`Lückenlos: ${enabled ? "EIN" : "AUS"}`);
  }

  setShowNumbers(enabled) {
    this.showNumbers = enabled;
    this.showNotification(`Nummern: ${enabled ? "EIN" : "AUS"}`);
    this.draw();
  }

  // State management
  getState() {
    return {
      rectangleCount: this.rectangles.length,
      selectedCount: this.selectedRects.size,
      snapEnabled: this.snapEnabled,
      autoFitEnabled: this.autoFitEnabled,
      showNumbers: this.showNumbers,
    };
  }

  updateState() {
    if (this.options.onStateChange) {
      this.options.onStateChange(this.getState());
    }
  }

  handleKeyDown(e) {
    // Ignore if focus is on an input element
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
      return;
    }

    if (e.key === "Delete" || e.key === "Backspace") {
      this.deleteSelected();
    } else if ((e.ctrlKey || e.metaKey) && e.key === "a") {
      e.preventDefault();
      this.selectAll();
    } else if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      e.preventDefault();
      if (e.shiftKey) {
        this.redo();
      } else {
        this.undo();
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
      e.preventDefault();
      this.redo();
    } else if (e.key === "Escape") {
      this.selectedRects.clear();
      this.updateState();
      this.draw();
    } else if (e.key === "s" && !e.ctrlKey && !e.metaKey) {
      this.setSnapEnabled(!this.snapEnabled);
    } else if (e.key === "l" && !e.ctrlKey && !e.metaKey) {
      this.setAutoFitEnabled(!this.autoFitEnabled);
    } else if (e.key === "n" && !e.ctrlKey && !e.metaKey) {
      this.setShowNumbers(!this.showNumbers);
    } else if (e.key === "i" && !e.ctrlKey && !e.metaKey) {
      // Show info/status
      this.showStatus();
    } else if (e.key === " " && !e.ctrlKey && !e.metaKey) {
      // Space key - toggle video playback if video is loaded
      e.preventDefault();
      this.toggleVideoPlayback();
    } else if (e.key === "b" && !e.ctrlKey && !e.metaKey) {
      // B key - clear background
      this.clearBackground();
    }
  }

  toggleVideoPlayback() {
    if (this.videoElement) {
      if (this.videoElement.paused) {
        this.videoElement.play();
        this.showNotification("Video: Play");
      } else {
        this.videoElement.pause();
        this.showNotification("Video: Pause");
      }
    }
  }

  showStatus() {
    // Show multiple status notifications
    this.showNotification(`Rechtecke: ${this.rectangles.length}`);
    setTimeout(() => {
      this.showNotification(`Ausgewählt: ${this.selectedRects.size}`);
    }, 100);
    setTimeout(() => {
      this.showNotification(`Snapping: ${this.snapEnabled ? "EIN" : "AUS"}`);
    }, 200);
    setTimeout(() => {
      this.showNotification(
        `Lückenlos: ${this.autoFitEnabled ? "EIN" : "AUS"}`,
      );
    }, 300);
    setTimeout(() => {
      this.showNotification(`Nummern: ${this.showNumbers ? "EIN" : "AUS"}`);
    }, 400);
  }

  saveState() {
    const state = {
      rectangles: this.rectangles.map((r) => ({ ...r })),
      nextNumber: this.nextNumber,
    };

    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(state);

    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.restoreState(this.history[this.historyIndex]);
      this.showNotification("Rückgängig");
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.restoreState(this.history[this.historyIndex]);
      this.showNotification("Wiederherstellen");
    }
  }

  restoreState(state) {
    this.rectangles = state.rectangles.map((r) => ({ ...r }));
    this.nextNumber = state.nextNumber;
    this.selectedRects.clear();
    this.updateState();
    this.draw();
  }

  showNotification(message) {
    // Check if same message already exists and is recent
    const existingIndex = this.notifications.findIndex(
      (n) => n.message === message && Date.now() - n.timestamp < 300,
    );

    if (existingIndex >= 0) {
      // Update existing notification timestamp
      this.notifications[existingIndex].timestamp = Date.now();
      this.notifications[existingIndex].opacity = 1;
    } else {
      // Add new notification
      const notification = {
        message: message,
        timestamp: Date.now(),
        opacity: 1,
      };

      this.notifications.push(notification);

      // Keep only last 5 notifications
      if (this.notifications.length > 5) {
        this.notifications = this.notifications.slice(-5);
      }
    }
  }

  autoFitRectangles(rects, edge) {
    if (!this.autoFitEnabled || rects.length === 0) return;

    const sortedRects = [...rects];

    if (edge === "top" || edge === "bottom") {
      sortedRects.sort((a, b) => a.x - b.x);
      const totalWidth = this.canvas.width;
      const rectWidth = Math.floor(totalWidth / sortedRects.length);
      const uniformHeight = Math.max(...sortedRects.map((r) => r.height));

      sortedRects.forEach((rect, index) => {
        rect.x = index * rectWidth;
        rect.width =
          index === sortedRects.length - 1
            ? totalWidth - index * rectWidth
            : rectWidth;
        rect.height = uniformHeight;

        if (edge === "top") {
          rect.y = 0;
        } else {
          rect.y = this.canvas.height - rect.height;
        }
      });
    } else if (edge === "left" || edge === "right") {
      sortedRects.sort((a, b) => a.y - b.y);
      const totalHeight = this.canvas.height;
      const rectHeight = Math.floor(totalHeight / sortedRects.length);
      const uniformWidth = Math.max(...sortedRects.map((r) => r.width));

      sortedRects.forEach((rect, index) => {
        rect.y = index * rectHeight;
        rect.height =
          index === sortedRects.length - 1
            ? totalHeight - index * rectHeight
            : rectHeight;
        rect.width = uniformWidth;

        if (edge === "left") {
          rect.x = 0;
        } else {
          rect.x = this.canvas.width - rect.width;
        }
      });
    }
  }

  distributeOnSingleEdge(rects, edge, margin) {
    const sortedRects = [...rects].sort((a, b) => a.number - b.number);
    const count = sortedRects.length;

    if (edge === "top" || edge === "bottom") {
      const totalWidth = sortedRects.reduce((sum, r) => sum + r.width, 0);
      const spacing =
        (this.canvas.width - totalWidth - 2 * margin) / (count + 1);
      let currentX = margin + spacing;

      sortedRects.forEach((rect) => {
        rect.x = currentX;
        rect.y =
          edge === "top" ? margin : this.canvas.height - margin - rect.height;
        currentX += rect.width + spacing;
      });
    } else {
      const totalHeight = sortedRects.reduce((sum, r) => sum + r.height, 0);
      const spacing =
        (this.canvas.height - totalHeight - 2 * margin) / (count + 1);
      let currentY = margin + spacing;

      sortedRects.forEach((rect) => {
        rect.y = currentY;
        rect.x =
          edge === "left" ? margin : this.canvas.width - margin - rect.width;
        currentY += rect.height + spacing;
      });
    }
  }

  detectNearestEdgeFromMouse(mouseX, mouseY) {
    const distances = {
      top: mouseY,
      bottom: this.canvas.height - mouseY,
      left: mouseX,
      right: this.canvas.width - mouseX,
    };

    let nearestEdge = null;
    let minDistance = this.edgeSnapDistance;

    for (let edge in distances) {
      if (distances[edge] < minDistance) {
        minDistance = distances[edge];
        nearestEdge = edge;
      }
    }

    return nearestEdge;
  }

  handleMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    // Calculate scale factor in case canvas is displayed smaller
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    this.mousePos = { x, y };

    const clickedRect = this.getRectAtPoint(x, y);

    if (clickedRect) {
      if (e.shiftKey) {
        if (this.selectedRects.has(clickedRect)) {
          this.selectedRects.delete(clickedRect);
        } else {
          this.selectedRects.add(clickedRect);
        }
      } else if (!this.selectedRects.has(clickedRect)) {
        this.selectedRects.clear();
        this.selectedRects.add(clickedRect);
      }

      this.dragHandle = this.getHandleAtPoint(clickedRect, x, y);

      if (this.dragHandle) {
        this.saveState();
        this.isDragging = true;
        this.dragOffset = { x: x - clickedRect.x, y: y - clickedRect.y };

        this.dragStartPositions.clear();
        this.selectedRects.forEach((r) => {
          this.dragStartPositions.set(r, {
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
          });
        });
      }
    } else {
      if (!e.shiftKey) {
        this.selectedRects.clear();
      }
      this.isSelecting = true;
      this.selectStart = { x, y };
      this.selectEnd = { x, y };
    }

    this.updateState();
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    // Calculate scale factor in case canvas is displayed smaller
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const prevX = this.mousePos.x;
    const prevY = this.mousePos.y;
    this.mousePos = { x, y };

    if (this.isSelecting) {
      this.selectEnd = { x, y };
      this.updateSelection(e);
      this.draw();
    } else if (
      this.isDragging &&
      this.selectedRects.size > 0 &&
      this.dragHandle
    ) {
      if (this.selectedRects.size === 1) {
        const selectedRect = Array.from(this.selectedRects)[0];
        this.handleDrag(x, y, selectedRect);
      } else if (this.dragHandle && this.dragHandle !== "center") {
        const selectedRect = Array.from(this.selectedRects)[0];
        this.handleDrag(x, y, selectedRect);
      } else {
        const deltaX = x - prevX;
        const deltaY = y - prevY;

        this.selectedRects.forEach((rect) => {
          rect.x += deltaX;
          rect.y += deltaY;
        });

        if (this.snapEnabled) {
          this.nearestEdge = this.detectNearestEdgeFromMouse(x, y);
          if (this.nearestEdge) {
            this.edgeHighlight = Math.min(1, this.edgeHighlight + 0.1);
          } else {
            this.edgeHighlight = Math.max(0, this.edgeHighlight - 0.1);
          }
        }
      }
      this.draw();
    } else {
      const hoverRect = this.getRectAtPoint(x, y);
      if (hoverRect && this.selectedRects.has(hoverRect)) {
        const handle = this.getHandleAtPoint(hoverRect, x, y);
        this.setCursor(handle);
      } else if (hoverRect) {
        this.canvas.style.cursor = "move";
      } else {
        this.canvas.style.cursor = "crosshair";
      }
    }

    this.updateState();
  }

  updateSelection(e) {
    if (!this.isSelecting || !this.selectStart || !this.selectEnd) return;

    const selectionBox = {
      x: Math.min(this.selectStart.x, this.selectEnd.x),
      y: Math.min(this.selectStart.y, this.selectEnd.y),
      width: Math.abs(this.selectEnd.x - this.selectStart.x),
      height: Math.abs(this.selectEnd.y - this.selectStart.y),
    };

    if (!e || !e.shiftKey) {
      this.selectedRects.clear();
    }

    this.rectangles.forEach((rect) => {
      const rectInSelection = this.isRectInSelection(rect, selectionBox);
      if (rectInSelection) {
        this.selectedRects.add(rect);
      }
    });

    this.updateState();
  }

  isRectInSelection(rect, selectionBox) {
    return (
      rect.x < selectionBox.x + selectionBox.width &&
      rect.x + rect.width > selectionBox.x &&
      rect.y < selectionBox.y + selectionBox.height &&
      rect.y + rect.height > selectionBox.y
    );
  }

  handleMouseUp() {
    if (this.isSelecting) {
      this.isSelecting = false;
      this.selectStart = null;
      this.selectEnd = null;
    }

    const wasDragging = this.isDragging;

    if (this.isDragging && this.selectedRects.size > 1 && this.nearestEdge) {
      const rects = Array.from(this.selectedRects);
      this.distributeOnSingleEdge(rects, this.nearestEdge, 10);

      if (this.autoFitEnabled) {
        this.autoFitRectangles(rects, this.nearestEdge);
      }

      this.snappedEdge = this.nearestEdge;
      this.groupResizeMode = true;
    } else if (this.selectedRects.size <= 1) {
      this.snappedEdge = null;
      this.groupResizeMode = false;
    }

    this.isDragging = false;
    this.dragHandle = null;
    this.dragStartPositions.clear();
    this.nearestEdge = null;
    this.edgeHighlight = 0;
    this.draw();

    if (wasDragging && this.options.onRectanglesChanged) {
      this.options.onRectanglesChanged(this.exportData());
    }
  }

  handleMouseLeave() {
    if (this.isDragging || this.isSelecting) {
      this.handleMouseUp();
    }
  }

  handleRightClick(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    // Calculate scale factor in case canvas is displayed smaller
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const clickedRect = this.getRectAtPoint(x, y);
    if (clickedRect) {
      const index = this.rectangles.indexOf(clickedRect);
      if (index > -1) {
        this.saveState();
        this.rectangles.splice(index, 1);
        this.selectedRects.delete(clickedRect);
        this.updateState();
        this.draw();
      }
    }
  }

  handleDrag(x, y, rect) {
    let newX = x;
    let newY = y;

    if (
      this.selectedRects.size > 1 &&
      this.dragHandle &&
      this.dragHandle !== "center"
    ) {
      this.handleMultiResize(x, y, rect);
      return;
    }

    if (this.snapEnabled && this.dragHandle !== "center") {
      const snapResult = this.getSnapPosition(rect, x, y, this.dragHandle);
      if (snapResult) {
        newX = snapResult.x;
        newY = snapResult.y;
      }
    }

    switch (this.dragHandle) {
      case "tl":
        const newWidth1 = rect.x + rect.width - newX;
        const newHeight1 = rect.y + rect.height - newY;
        rect.x = newX;
        rect.y = newY;
        rect.width = newWidth1;
        rect.height = newHeight1;
        break;
      case "tr":
        const newHeight2 = rect.y + rect.height - newY;
        rect.y = newY;
        rect.width = newX - rect.x;
        rect.height = newHeight2;
        break;
      case "bl":
        const newWidth3 = rect.x + rect.width - newX;
        rect.x = newX;
        rect.width = newWidth3;
        rect.height = newY - rect.y;
        break;
      case "br":
        rect.width = newX - rect.x;
        rect.height = newY - rect.y;
        break;
      case "top":
        const newHeight5 = rect.y + rect.height - newY;
        rect.y = newY;
        rect.height = newHeight5;
        break;
      case "right":
        rect.width = newX - rect.x;
        break;
      case "bottom":
        rect.height = newY - rect.y;
        break;
      case "left":
        const newWidth8 = rect.x + rect.width - newX;
        rect.x = newX;
        rect.width = newWidth8;
        break;
      case "center":
        rect.x = x - this.dragOffset.x;
        rect.y = y - this.dragOffset.y;
        if (this.snapEnabled) {
          const snapX = this.snapToValue(rect.x, [
            0,
            this.canvas.width - rect.width,
          ]);
          const snapY = this.snapToValue(rect.y, [
            0,
            this.canvas.height - rect.height,
          ]);
          if (snapX !== null) rect.x = snapX;
          if (snapY !== null) rect.y = snapY;
        }
        break;
    }

    rect.width = Math.max(20, rect.width);
    rect.height = Math.max(20, rect.height);
  }

  handleMultiResize(x, y, baseRect) {
    let widthRatio = 1;
    let heightRatio = 1;

    const startPos = this.dragStartPositions.get(baseRect);
    const originalWidth = startPos.width || baseRect.width;
    const originalHeight = startPos.height || baseRect.height;
    const originalX = startPos.x;
    const originalY = startPos.y;

    if (this.groupResizeMode && this.snappedEdge) {
      switch (this.snappedEdge) {
        case "top":
          heightRatio = Math.max(0.1, (y - originalY) / originalHeight);
          break;
        case "bottom":
          const bottomY = this.canvas.height;
          heightRatio = Math.max(0.1, (bottomY - y) / originalHeight);
          break;
        case "left":
          widthRatio = Math.max(0.1, (x - originalX) / originalWidth);
          break;
        case "right":
          const rightX = this.canvas.width;
          widthRatio = Math.max(0.1, (rightX - x) / originalWidth);
          break;
      }
    } else {
      switch (this.dragHandle) {
        case "br":
          widthRatio = (x - baseRect.x) / originalWidth;
          heightRatio = (y - baseRect.y) / originalHeight;
          break;
        case "bl":
          widthRatio = (baseRect.x + originalWidth - x) / originalWidth;
          heightRatio = (y - baseRect.y) / originalHeight;
          break;
        case "tr":
          widthRatio = (x - baseRect.x) / originalWidth;
          heightRatio = (baseRect.y + originalHeight - y) / originalHeight;
          break;
        case "tl":
          widthRatio = (baseRect.x + originalWidth - x) / originalWidth;
          heightRatio = (baseRect.y + originalHeight - y) / originalHeight;
          break;
        case "right":
          widthRatio = (x - baseRect.x) / originalWidth;
          break;
        case "left":
          widthRatio = (baseRect.x + originalWidth - x) / originalWidth;
          break;
        case "bottom":
          heightRatio = (y - baseRect.y) / originalHeight;
          break;
        case "top":
          heightRatio = (baseRect.y + originalHeight - y) / originalHeight;
          break;
      }
    }

    this.selectedRects.forEach((rect) => {
      const startPos = this.dragStartPositions.get(rect);
      if (!startPos.width) {
        startPos.width = rect.width;
        startPos.height = rect.height;
      }

      if (this.dragHandle.includes("r") || this.dragHandle === "right") {
        rect.width = Math.max(20, startPos.width * widthRatio);
      }
      if (this.dragHandle.includes("l") || this.dragHandle === "left") {
        const newWidth = Math.max(20, startPos.width * widthRatio);
        rect.x = startPos.x + (startPos.width - newWidth);
        rect.width = newWidth;
      }

      if (this.groupResizeMode && this.snappedEdge) {
        if (this.snappedEdge === "top" || this.snappedEdge === "bottom") {
          const newHeight = Math.max(20, startPos.height * heightRatio);
          if (this.snappedEdge === "bottom") {
            rect.y = this.canvas.height - newHeight;
            rect.height = newHeight;
          } else {
            rect.height = newHeight;
          }
        } else if (
          this.snappedEdge === "left" ||
          this.snappedEdge === "right"
        ) {
          const newWidth = Math.max(20, startPos.width * widthRatio);
          if (this.snappedEdge === "right") {
            rect.x = this.canvas.width - newWidth;
            rect.width = newWidth;
          } else {
            rect.width = newWidth;
          }
        }
      } else {
        if (this.dragHandle.includes("b") || this.dragHandle === "bottom") {
          rect.height = Math.max(20, startPos.height * heightRatio);
        }
        if (this.dragHandle.includes("t") || this.dragHandle === "top") {
          const newHeight = Math.max(20, startPos.height * heightRatio);
          rect.y = startPos.y + (startPos.height - newHeight);
          rect.height = newHeight;
        }
      }
    });
  }

  getSnapPosition(rect, x, y, handle) {
    const snapPoints = this.getSnapPoints();
    let snappedX = x;
    let snappedY = y;

    if (handle.includes("l") || handle === "left") {
      const snapX = this.snapToValue(x, snapPoints.x);
      if (snapX !== null) snappedX = snapX;
    }
    if (handle.includes("r") || handle === "right") {
      const snapX = this.snapToValue(x, snapPoints.x);
      if (snapX !== null) snappedX = snapX;
    }
    if (handle.includes("t") || handle === "top") {
      const snapY = this.snapToValue(y, snapPoints.y);
      if (snapY !== null) snappedY = snapY;
    }
    if (handle.includes("b") || handle === "bottom") {
      const snapY = this.snapToValue(y, snapPoints.y);
      if (snapY !== null) snappedY = snapY;
    }

    return { x: snappedX, y: snappedY };
  }

  getSnapPoints() {
    const points = {
      x: [0, this.canvas.width],
      y: [0, this.canvas.height],
    };

    this.rectangles.forEach((rect) => {
      if (!this.selectedRects.has(rect)) {
        points.x.push(rect.x, rect.x + rect.width);
        points.y.push(rect.y, rect.y + rect.height);
      }
    });

    return points;
  }

  snapToValue(value, snapPoints) {
    for (let point of snapPoints) {
      if (Math.abs(value - point) < this.snapDistance) {
        return point;
      }
    }
    return null;
  }

  getHandleAtPoint(rect, x, y) {
    const handles = this.getHandles(rect);

    if (
      this.groupResizeMode &&
      this.selectedRects.size > 1 &&
      this.snappedEdge
    ) {
      let allowedEdge = null;

      switch (this.snappedEdge) {
        case "left":
          allowedEdge = "right";
          break;
        case "right":
          allowedEdge = "left";
          break;
        case "top":
          allowedEdge = "bottom";
          break;
        case "bottom":
          allowedEdge = "top";
          break;
      }

      if (allowedEdge && handles.edges[allowedEdge]) {
        const edge = handles.edges[allowedEdge];
        if (this.isPointInEdge(x, y, edge)) {
          return allowedEdge;
        }
      }

      if (this.isPointInRect(x, y, rect)) {
        return "center";
      }

      return null;
    }

    for (let key in handles.corners) {
      const handle = handles.corners[key];
      if (this.isPointInHandle(x, y, handle)) {
        return key;
      }
    }

    for (let key in handles.edges) {
      const edge = handles.edges[key];
      if (this.isPointInEdge(x, y, edge)) {
        return key;
      }
    }

    if (this.isPointInRect(x, y, rect)) {
      return "center";
    }

    return null;
  }

  getHandles(rect) {
    const halfSize = this.handleSize / 2;
    return {
      corners: {
        tl: { x: rect.x - halfSize, y: rect.y - halfSize },
        tr: { x: rect.x + rect.width - halfSize, y: rect.y - halfSize },
        bl: { x: rect.x - halfSize, y: rect.y + rect.height - halfSize },
        br: {
          x: rect.x + rect.width - halfSize,
          y: rect.y + rect.height - halfSize,
        },
      },
      edges: {
        top: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: this.edgeHandleWidth,
        },
        right: {
          x: rect.x + rect.width - this.edgeHandleWidth,
          y: rect.y,
          width: this.edgeHandleWidth,
          height: rect.height,
        },
        bottom: {
          x: rect.x,
          y: rect.y + rect.height - this.edgeHandleWidth,
          width: rect.width,
          height: this.edgeHandleWidth,
        },
        left: {
          x: rect.x,
          y: rect.y,
          width: this.edgeHandleWidth,
          height: rect.height,
        },
      },
    };
  }

  isPointInHandle(x, y, handle) {
    return (
      x >= handle.x &&
      x <= handle.x + this.handleSize &&
      y >= handle.y &&
      y <= handle.y + this.handleSize
    );
  }

  isPointInEdge(x, y, edge) {
    return (
      x >= edge.x &&
      x <= edge.x + edge.width &&
      y >= edge.y &&
      y <= edge.y + edge.height
    );
  }

  isPointInRect(x, y, rect) {
    return (
      x >= rect.x &&
      x <= rect.x + rect.width &&
      y >= rect.y &&
      y <= rect.y + rect.height
    );
  }

  getRectAtPoint(x, y) {
    for (let i = this.rectangles.length - 1; i >= 0; i--) {
      if (this.isPointInRect(x, y, this.rectangles[i])) {
        return this.rectangles[i];
      }
    }
    return null;
  }

  setCursor(handle) {
    const cursors = {
      tl: "nw-resize",
      tr: "ne-resize",
      bl: "sw-resize",
      br: "se-resize",
      top: "n-resize",
      right: "e-resize",
      bottom: "s-resize",
      left: "w-resize",
      center: "move",
    };

    this.canvas.style.cursor = cursors[handle] || "default";
  }

  animate() {
    if (this._destroyed) return;
    this.draw();
    requestAnimationFrame(() => this.animate());
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw background (image or video)
    if (this.image) {
      this.ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);
    } else if (this.video && this.videoElement && !this.videoElement.paused) {
      this.ctx.drawImage(this.videoElement, 0, 0);
    }

    if (this.nearestEdge && this.edgeHighlight > 0) {
      this.drawEdgeIndicator(this.nearestEdge);
    }

    if (this.isSelecting && this.selectStart && this.selectEnd) {
      this.drawSelectionBox();
    }

    this.rectangles.forEach((rect) => {
      const isSelected = this.selectedRects.has(rect);
      this.drawRectangle(rect, isSelected);
    });

    if (this.snapEnabled && this.isDragging && this.selectedRects.size === 1) {
      this.drawSnapLines();
    }

    // Draw notifications
    this.drawNotifications();
  }

  drawNotifications() {
    const now = Date.now();
    let y = 30;

    // Filter out expired notifications
    this.notifications = this.notifications.filter((notification) => {
      const age = now - notification.timestamp;
      return age < this.notificationDuration + 500;
    });

    this.notifications.forEach((notification) => {
      const age = now - notification.timestamp;

      // Calculate opacity for fade out animation
      if (age > this.notificationDuration) {
        notification.opacity = Math.max(
          0,
          1 - (age - this.notificationDuration) / 500,
        );
      } else {
        notification.opacity = 1;
      }

      if (notification.opacity > 0) {
        // Save context state
        this.ctx.save();

        // Draw notification background
        this.ctx.fillStyle = `rgba(189, 147, 249, ${notification.opacity * 0.9})`;
        this.ctx.beginPath();
        this.ctx.roundRect(this.canvas.width - 220, y, 200, 35, 5);
        this.ctx.fill();

        // Draw notification text
        this.ctx.fillStyle = `rgba(255, 255, 255, ${notification.opacity})`;
        this.ctx.font =
          "14px 'CascadiaCode', monospace";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(
          notification.message,
          this.canvas.width - 120,
          y + 17,
        );

        // Restore context state
        this.ctx.restore();

        y += 40;
      }
    });
  }

  drawSelectionBox() {
    this.ctx.strokeStyle = "rgba(189, 147, 249, 0.8)";
    this.ctx.fillStyle = "rgba(189, 147, 249, 0.1)";
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([5, 5]);

    const x = Math.min(this.selectStart.x, this.selectEnd.x);
    const y = Math.min(this.selectStart.y, this.selectEnd.y);
    const width = Math.abs(this.selectEnd.x - this.selectStart.x);
    const height = Math.abs(this.selectEnd.y - this.selectStart.y);

    this.ctx.fillRect(x, y, width, height);
    this.ctx.strokeRect(x, y, width, height);
    this.ctx.setLineDash([]);
  }

  drawRectangle(rect, isSelected) {
    this.ctx.fillStyle = rect.color;
    this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

    this.ctx.strokeStyle = isSelected ? "#bd93f9" : rect.strokeColor;
    this.ctx.lineWidth = isSelected ? 2 : 1;
    this.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

    if (this.showNumbers) {
      this.ctx.fillStyle = isSelected ? "#bd93f9" : "#ffffff";
      this.ctx.font = "bold 14px Arial";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";

      const centerX = rect.x + rect.width / 2;
      const centerY = rect.y + rect.height / 2;

      this.ctx.strokeStyle = "#000000";
      this.ctx.lineWidth = 3;
      this.ctx.strokeText(rect.number.toString(), centerX, centerY);
      this.ctx.fillText(rect.number.toString(), centerX, centerY);
    }

    if (isSelected) {
      if (
        this.groupResizeMode &&
        this.selectedRects.size > 1 &&
        this.snappedEdge
      ) {
        this.drawGroupResizeHandle(rect);
      } else if (this.selectedRects.size === 1) {
        this.drawHandles(rect);
      }
    }
  }

  drawHandles(rect) {
    const handles = this.getHandles(rect);

    this.ctx.fillStyle = "#bd93f9";

    for (let key in handles.corners) {
      const handle = handles.corners[key];
      this.ctx.fillRect(handle.x, handle.y, this.handleSize, this.handleSize);
    }

    this.ctx.fillStyle = "rgba(189, 147, 249, 0.3)";
    for (let key in handles.edges) {
      const edge = handles.edges[key];
      this.ctx.fillRect(edge.x, edge.y, edge.width, edge.height);
    }
  }

  drawGroupResizeHandle(rect) {
    const handles = this.getHandles(rect);

    this.ctx.fillStyle = "#bd93f9";
    this.ctx.strokeStyle = "#bd93f9";
    this.ctx.lineWidth = 2;

    switch (this.snappedEdge) {
      case "left":
        const rightEdge = handles.edges.right;
        this.ctx.fillStyle = "rgba(189, 147, 249, 0.5)";
        this.ctx.fillRect(
          rightEdge.x,
          rightEdge.y,
          rightEdge.width,
          rightEdge.height,
        );
        this.ctx.strokeRect(
          rightEdge.x,
          rightEdge.y,
          rightEdge.width,
          rightEdge.height,
        );
        break;
      case "right":
        const leftEdge = handles.edges.left;
        this.ctx.fillStyle = "rgba(189, 147, 249, 0.5)";
        this.ctx.fillRect(
          leftEdge.x,
          leftEdge.y,
          leftEdge.width,
          leftEdge.height,
        );
        this.ctx.strokeRect(
          leftEdge.x,
          leftEdge.y,
          leftEdge.width,
          leftEdge.height,
        );
        break;
      case "top":
        const bottomEdge = handles.edges.bottom;
        this.ctx.fillStyle = "rgba(189, 147, 249, 0.5)";
        this.ctx.fillRect(
          bottomEdge.x,
          bottomEdge.y,
          bottomEdge.width,
          bottomEdge.height,
        );
        this.ctx.strokeRect(
          bottomEdge.x,
          bottomEdge.y,
          bottomEdge.width,
          bottomEdge.height,
        );
        break;
      case "bottom":
        const topEdge = handles.edges.top;
        this.ctx.fillStyle = "rgba(189, 147, 249, 0.5)";
        this.ctx.fillRect(topEdge.x, topEdge.y, topEdge.width, topEdge.height);
        this.ctx.strokeRect(
          topEdge.x,
          topEdge.y,
          topEdge.width,
          topEdge.height,
        );
        break;
    }
  }

  drawSnapLines() {
    if (!this.selectedRects.size) return;

    this.ctx.strokeStyle = "rgba(255, 85, 85, 0.5)";
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([5, 5]);

    const selectedRect = Array.from(this.selectedRects)[0];
    const snapPoints = this.getSnapPoints();

    snapPoints.x.forEach((x) => {
      if (
        Math.abs(selectedRect.x - x) < this.snapDistance ||
        Math.abs(selectedRect.x + selectedRect.width - x) < this.snapDistance
      ) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.canvas.height);
        this.ctx.stroke();
      }
    });

    snapPoints.y.forEach((y) => {
      if (
        Math.abs(selectedRect.y - y) < this.snapDistance ||
        Math.abs(selectedRect.y + selectedRect.height - y) < this.snapDistance
      ) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.canvas.width, y);
        this.ctx.stroke();
      }
    });

    this.ctx.setLineDash([]);
  }

  drawEdgeIndicator(edge) {
    const opacity = this.edgeHighlight;
    const pulseTime = Date.now() / 150;
    const pulseOffset = Math.sin(pulseTime) * 5 + 5;
    const glowSize = 30 + Math.sin(pulseTime) * 10;
    const margin = 10;

    let gradient;
    switch (edge) {
      case "top":
        gradient = this.ctx.createLinearGradient(0, 0, 0, glowSize);
        gradient.addColorStop(0, `rgba(80, 250, 123, ${opacity * 0.6})`);
        gradient.addColorStop(0.5, `rgba(105, 255, 148, ${opacity * 0.3})`);
        gradient.addColorStop(1, `rgba(105, 255, 148, 0)`);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, glowSize);

        this.ctx.strokeStyle = `rgba(80, 250, 123, ${opacity})`;
        this.ctx.lineWidth = 4 + pulseOffset * 0.3;
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = `rgba(80, 250, 123, ${opacity})`;
        this.ctx.beginPath();
        this.ctx.moveTo(0, margin);
        this.ctx.lineTo(this.canvas.width, margin);
        this.ctx.stroke();

        this.ctx.strokeStyle = `rgba(105, 255, 148, ${opacity * 0.5})`;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, margin + pulseOffset);
        this.ctx.lineTo(this.canvas.width, margin + pulseOffset);
        this.ctx.stroke();
        break;

      case "bottom":
        gradient = this.ctx.createLinearGradient(
          0,
          this.canvas.height,
          0,
          this.canvas.height - glowSize,
        );
        gradient.addColorStop(0, `rgba(80, 250, 123, ${opacity * 0.6})`);
        gradient.addColorStop(0.5, `rgba(105, 255, 148, ${opacity * 0.3})`);
        gradient.addColorStop(1, `rgba(105, 255, 148, 0)`);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(
          0,
          this.canvas.height - glowSize,
          this.canvas.width,
          glowSize,
        );

        this.ctx.strokeStyle = `rgba(80, 250, 123, ${opacity})`;
        this.ctx.lineWidth = 4 + pulseOffset * 0.3;
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = `rgba(80, 250, 123, ${opacity})`;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height - margin);
        this.ctx.lineTo(this.canvas.width, this.canvas.height - margin);
        this.ctx.stroke();

        this.ctx.strokeStyle = `rgba(105, 255, 148, ${opacity * 0.5})`;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height - margin - pulseOffset);
        this.ctx.lineTo(
          this.canvas.width,
          this.canvas.height - margin - pulseOffset,
        );
        this.ctx.stroke();
        break;

      case "left":
        gradient = this.ctx.createLinearGradient(0, 0, glowSize, 0);
        gradient.addColorStop(0, `rgba(80, 250, 123, ${opacity * 0.6})`);
        gradient.addColorStop(0.5, `rgba(105, 255, 148, ${opacity * 0.3})`);
        gradient.addColorStop(1, `rgba(105, 255, 148, 0)`);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, glowSize, this.canvas.height);

        this.ctx.strokeStyle = `rgba(80, 250, 123, ${opacity})`;
        this.ctx.lineWidth = 4 + pulseOffset * 0.3;
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = `rgba(80, 250, 123, ${opacity})`;
        this.ctx.beginPath();
        this.ctx.moveTo(margin, 0);
        this.ctx.lineTo(margin, this.canvas.height);
        this.ctx.stroke();

        this.ctx.strokeStyle = `rgba(105, 255, 148, ${opacity * 0.5})`;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(margin + pulseOffset, 0);
        this.ctx.lineTo(margin + pulseOffset, this.canvas.height);
        this.ctx.stroke();
        break;

      case "right":
        gradient = this.ctx.createLinearGradient(
          this.canvas.width,
          0,
          this.canvas.width - glowSize,
          0,
        );
        gradient.addColorStop(0, `rgba(80, 250, 123, ${opacity * 0.6})`);
        gradient.addColorStop(0.5, `rgba(105, 255, 148, ${opacity * 0.3})`);
        gradient.addColorStop(1, `rgba(105, 255, 148, 0)`);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(
          this.canvas.width - glowSize,
          0,
          glowSize,
          this.canvas.height,
        );

        this.ctx.strokeStyle = `rgba(80, 250, 123, ${opacity})`;
        this.ctx.lineWidth = 4 + pulseOffset * 0.3;
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = `rgba(80, 250, 123, ${opacity})`;
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width - margin, 0);
        this.ctx.lineTo(this.canvas.width - margin, this.canvas.height);
        this.ctx.stroke();

        this.ctx.strokeStyle = `rgba(105, 255, 148, ${opacity * 0.5})`;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width - margin - pulseOffset, 0);
        this.ctx.lineTo(
          this.canvas.width - margin - pulseOffset,
          this.canvas.height,
        );
        this.ctx.stroke();
        break;
    }

    this.ctx.shadowBlur = 0;
  }

  importData(data) {
    if (!data || !data.rectangles) return;
    this.rectangles = data.rectangles.map((r, i) => ({
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
      color: `hsla(${((i * 360) / data.rectangles.length) % 360}, 70%, 60%, 0.3)`,
      strokeColor: `hsl(${((i * 360) / data.rectangles.length) % 360}, 70%, 60%)`,
      id: i,
      number: r.number !== undefined ? r.number : i + 1,
    }));
    this.nextNumber = this.rectangles.length + 1;
    this.selectedRects.clear();
    if (data.canvasWidth) this.canvas.width = data.canvasWidth;
    if (data.canvasHeight) this.canvas.height = data.canvasHeight;
    this.draw();
  }

  destroy() {
    this._destroyed = true;
    document.removeEventListener("keydown", this.handleKeyDown.bind(this));
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.src = "";
      if (this.videoElement.parentNode) {
        this.videoElement.parentNode.removeChild(this.videoElement);
      }
      this.videoElement = null;
    }
  }
}

// Polyfill for roundRect if not available
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (
    x,
    y,
    width,
    height,
    radius,
  ) {
    this.beginPath();
    this.moveTo(x + radius, y);
    this.lineTo(x + width - radius, y);
    this.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.lineTo(x + width, y + height - radius);
    this.quadraticCurveTo(
      x + width,
      y + height,
      x + width - radius,
      y + height,
    );
    this.lineTo(x + radius, y + height);
    this.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.lineTo(x, y + radius);
    this.quadraticCurveTo(x, y, x + radius, y);
    this.closePath();
  };
}

export default RectangleEditor;
