class WordGame {
    constructor() {
        this.words = [];
        this.currentIndex = -1;
        this.wordHistory = [];
        this.synth = window.speechSynthesis;
        this.isRevealed = false;
        this.successWords = new Set();
        this.errorWords = new Set();
        this.canvas = new DrawingCanvas();
        
        this.parseWords();
        this.initializeEventListeners();
    }

    parseWords() {
        this.words = wordsText
            .split('\n')
            .filter(line => line.trim() && !line.match(/^[A-Z]$/))
            .join(' ')
            .split(/\s+/)
            .filter(word => word && !word.match(/^[A-Z]$/))
            .map(word => word.trim())
            .filter(word => word);
    }

    initializeEventListeners() {
        document.getElementById('prevBtn').addEventListener('click', () => this.previousWord());
        document.getElementById('playBtn').addEventListener('click', () => this.playWord());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextWord());
        document.getElementById('revealBtn').addEventListener('click', () => this.toggleReveal());
        document.getElementById('successBtn').addEventListener('click', () => this.markSuccess());
        document.getElementById('errorBtn').addEventListener('click', () => this.markError());
        document.getElementById('checkWritingBtn').addEventListener('click', () => this.checkWriting());
        document.getElementById('clearCanvasBtn').addEventListener('click', () => this.canvas.clear());
    }

    getRandomWord() {
        const index = Math.floor(Math.random() * this.words.length);
        this.currentIndex = index;
        this.wordHistory.push(index);
        return this.words[index];
    }

    updateWordDisplay(word) {
        const wordDisplay = document.getElementById('wordDisplay');
        wordDisplay.textContent = word;
        wordDisplay.classList.add('active-word');
        wordDisplay.classList.remove('revealed');
        this.isRevealed = false;
        document.getElementById('revealBtn').textContent = 'Zeigen';
        document.getElementById('feedbackButtons').classList.remove('visible');
        document.getElementById('accuracyDisplay').textContent = '';
    }

    toggleReveal() {
        const wordDisplay = document.getElementById('wordDisplay');
        const revealBtn = document.getElementById('revealBtn');
        const feedbackButtons = document.getElementById('feedbackButtons');
        this.isRevealed = !this.isRevealed;
        
        if (this.isRevealed) {
            wordDisplay.classList.add('revealed');
            revealBtn.textContent = 'Verstecken';
            if (this.currentIndex !== -1) {
                feedbackButtons.classList.add('visible');
            }
        } else {
            wordDisplay.classList.remove('revealed');
            revealBtn.textContent = 'Zeigen';
            feedbackButtons.classList.remove('visible');
        }
    }

    previousWord() {
        if (this.wordHistory.length > 1) {
            this.wordHistory.pop();
            this.currentIndex = this.wordHistory[this.wordHistory.length - 1];
            this.updateWordDisplay(this.words[this.currentIndex]);
            this.speakWord(this.words[this.currentIndex]);
            this.canvas.clear();
        }
    }

    nextWord() {
        this.updateWordDisplay(this.getRandomWord());
        this.speakWord(this.words[this.currentIndex]);
        this.canvas.clear();
    }

    speakWord(word) {
        this.synth.cancel();
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'de-DE';
        this.synth.speak(utterance);
    }

    playWord() {
        const playBtn = document.getElementById('playBtn');
        if (this.currentIndex === -1) {
            playBtn.textContent = 'Nochmal';
            this.nextWord();
        } else {
            this.speakWord(this.words[this.currentIndex]);
        }
    }

    async checkWriting() {
        const currentWord = this.words[this.currentIndex].toLowerCase();
        const accuracy = await this.canvas.checkWriting(currentWord);

        if (accuracy >= 80) {
            setTimeout(() => {
                alert('Sehr gut geschrieben! 👍');
                if (accuracy === 100) {
                    this.markSuccess();
                }
            }, 500);
        } else {
            setTimeout(() => {
                alert('Versuche es noch einmal! 🤔');
            }, 500);
        }
    }

    markSuccess() {
        if (this.currentIndex !== -1) {
            this.successWords.add(this.currentIndex);
            this.errorWords.delete(this.currentIndex);
            this.nextWord();
        }
    }

    markError() {
        if (this.currentIndex !== -1) {
            this.errorWords.add(this.currentIndex);
            this.successWords.delete(this.currentIndex);
            this.nextWord();
        }
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new WordGame();
});
