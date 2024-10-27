class DrawingCanvas {
    constructor() {
        this.canvas = document.getElementById('drawingCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.strokes = [];
        this.currentStroke = [];
        this.initializeCanvas();
    }

    initializeCanvas() {
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = '#2c3e50';

        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));

        // Touch events
        this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
    }

    startDrawing(e) {
        this.isDrawing = true;
        this.ctx.beginPath();
        const pos = this.getPosition(e);
        this.ctx.moveTo(pos.x, pos.y);
        this.currentStroke = [pos];
        e.preventDefault();
    }

    draw(e) {
        if (!this.isDrawing) return;
        const pos = this.getPosition(e);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
        this.currentStroke.push(pos);
        e.preventDefault();
    }

    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            if (this.currentStroke.length > 0) {
                this.strokes.push([...this.currentStroke]);
                this.currentStroke = [];
            }
        }
    }

    getPosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    handleTouch(e) {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent(
            e.type === 'touchstart' ? 'mousedown' : 'mousemove',
            {
                clientX: touch.clientX,
                clientY: touch.clientY
            }
        );
        this.canvas.dispatchEvent(mouseEvent);
        e.preventDefault();
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.strokes = [];
        document.getElementById('accuracyDisplay').textContent = '';
    }

    // Simulated handwriting recognition
    async checkWriting(currentWord) {
        // Calculate complexity score based on strokes
        const complexity = this.calculateComplexity();
        
        // Calculate length score
        const lengthScore = this.calculateLengthScore(currentWord);
        
        // Calculate stroke count score
        const strokeScore = this.calculateStrokeScore(currentWord);
        
        // Combine scores with different weights
        const accuracy = Math.min(100, Math.round(
            (complexity * 0.3) +
            (lengthScore * 0.4) +
            (strokeScore * 0.3)
        ));

        const accuracyDisplay = document.getElementById('accuracyDisplay');
        accuracyDisplay.textContent = `Genauigkeit: ${accuracy}%`;

        return accuracy;
    }

    calculateComplexity() {
        if (this.strokes.length === 0) return 0;

        // Calculate total distance drawn
        let totalDistance = 0;
        this.strokes.forEach(stroke => {
            for (let i = 1; i < stroke.length; i++) {
                const dx = stroke[i].x - stroke[i-1].x;
                const dy = stroke[i].y - stroke[i-1].y;
                totalDistance += Math.sqrt(dx*dx + dy*dy);
            }
        });

        // Score based on minimum and maximum expected distances
        const minExpected = 100;
        const maxExpected = 1000;
        const complexityScore = Math.min(100, Math.max(0, 
            ((totalDistance - minExpected) / (maxExpected - minExpected)) * 100
        ));

        return complexityScore;
    }

    calculateLengthScore(word) {
        if (this.strokes.length === 0) return 0;

        // Calculate total horizontal span of writing
        let minX = Infinity;
        let maxX = -Infinity;
        this.strokes.forEach(stroke => {
            stroke.forEach(point => {
                minX = Math.min(minX, point.x);
                maxX = Math.max(maxX, point.x);
            });
        });

        const writingWidth = maxX - minX;
        
        // Expected width based on word length (roughly 30 pixels per character)
        const expectedWidth = word.length * 30;
        
        // Score based on how close the writing width is to expected width
        const widthDifference = Math.abs(writingWidth - expectedWidth);
        const lengthScore = Math.max(0, 100 - (widthDifference / expectedWidth) * 100);

        return lengthScore;
    }

    calculateStrokeScore(word) {
        if (this.strokes.length === 0) return 0;

        // Estimate expected strokes based on word complexity
        const expectedStrokes = Math.ceil(word.length * 0.8); // Assume about 0.8 strokes per letter
        
        // Score based on how close the stroke count is to expected
        const strokeDifference = Math.abs(this.strokes.length - expectedStrokes);
        const strokeScore = Math.max(0, 100 - (strokeDifference / expectedStrokes) * 100);

        return strokeScore;
    }
}
