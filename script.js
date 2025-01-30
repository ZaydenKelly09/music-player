// Get all necessary DOM elements
const playPauseButton = document.getElementById("play-pause-btn");
const fileInput = document.getElementById("file-input");
const playlist = document.getElementById("playlist");
const skipButton = document.getElementById("skip-btn");
const loopButton = document.getElementById("loop-btn");
const shuffleButton = document.getElementById("shuffle-btn");
const progressBar = document.getElementById("progress-bar");
const previousButton = document.getElementById("previous-btn");
const themeToggleButton = document.getElementById("mode-switcher"); // Updated button ID
const searchBar = document.getElementById("search-bar");

// Variables for song and player state
let audio = new Audio();
let isPlaying = false;
let currentSongIndex = 0;
let songs = [];
let isShuffleEnabled = false;
let isRepeatEnabled = false;
let currentPlayingItem = null;

// Dark/Light mode toggle functionality
themeToggleButton.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    if (!document.body.classList.contains("dark-mode")) {
        document.body.classList.add("light-mode");
    } else {
        document.body.classList.remove("light-mode");
    }
    const icon = themeToggleButton.querySelector("i");
    icon.classList.toggle("fa-sun");
    icon.classList.toggle("fa-moon");
});

// Handle song file selection and playlist display
fileInput.addEventListener("change", handleFileSelection);

// Play/Pause button functionality
playPauseButton.addEventListener("click", togglePlayPause);

// Skip button functionality
skipButton.addEventListener("click", skipSong);

// Previous button functionality
previousButton.addEventListener("click", previousSong);

// Shuffle button functionality
shuffleButton.addEventListener("click", toggleShuffle);

// Loop button functionality
loopButton.addEventListener("click", toggleLoop);

// Event listeners for progress bar and time update
progressBar.addEventListener("input", updateProgressBar);
audio.addEventListener("ended", handleSongEnd);
audio.addEventListener("loadedmetadata", updateDuration);
audio.addEventListener("timeupdate", updateCurrentTime);

// Search functionality
searchBar.addEventListener("input", handleSearch);

// Functions for song controls and player actions
function handleFileSelection(event) {
    const files = event.target.files;
    songs = [];
    playlist.innerHTML = ""; // Clear previous list
    Array.from(files).forEach((file, index) => {
        if (file.type.startsWith("audio/")) {
            const songPath = URL.createObjectURL(file);
            songs.push(songPath);
            const songItem = document.createElement("li");
            songItem.textContent = file.name.replace(/\.[^/.]+$/, ""); // Remove file extension

            // Add event listener to play song on click
            songItem.addEventListener("click", () => {
                currentSongIndex = index;
                playSong();
            });

            // Add right-click (contextmenu) listener to remove song
            songItem.addEventListener("contextmenu", (e) => {
                e.preventDefault(); // Prevent default context menu
                removeSong(index, songItem); // Call removeSong function to remove the song
            });

            playlist.appendChild(songItem);
        }
    });

    if (songs.length > 0) {
        currentSongIndex = 0;
        playSong();
    }
}

// Function to remove a song from the playlist
function removeSong(index, songItem) {
    // Remove from the songs array
    songs.splice(index, 1);
    
    // Remove the song item from the playlist DOM
    songItem.remove();
    
    // Adjust the currentSongIndex if necessary
    if (index === currentSongIndex) {
        // If we are removing the current song, go to the next song
        if (songs.length > 0) {
            currentSongIndex = (currentSongIndex + 1) % songs.length;
            playSong();
        } else {
            // If no songs are left, reset everything
            playPauseButton.innerHTML = '<i class="fas fa-play"></i>';
            currentSongIndex = 0;
        }
    } else if (index < currentSongIndex) {
        // If a song before the current song is removed, adjust the index
        currentSongIndex--;
    }
}

function togglePlayPause() {
    if (isPlaying) {
        audio.pause();
        playPauseButton.innerHTML = '<i class="fas fa-play"></i>';
    } else {
        audio.play();
        playPauseButton.innerHTML = '<i class="fas fa-pause"></i>';
    }
    isPlaying = !isPlaying;
}

function skipSong() {
    if (isShuffleEnabled) {
        currentSongIndex = Math.floor(Math.random() * songs.length); // Random index for shuffle
    } else {
        currentSongIndex = (currentSongIndex + 1) % songs.length; // Normal skip
    }
    playSong();
}

function previousSong() {
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    playSong();
}

function toggleShuffle() {
    isShuffleEnabled = !isShuffleEnabled;
    shuffleButton.classList.toggle("active", isShuffleEnabled);

    if (isShuffleEnabled) {
        isRepeatEnabled = false;
        loopButton.classList.remove("active");
        audio.loop = false;
    }
}

function toggleLoop() {
    isRepeatEnabled = !isRepeatEnabled;
    loopButton.classList.toggle("active", isRepeatEnabled);

    if (isRepeatEnabled) {
        isShuffleEnabled = false;
        shuffleButton.classList.remove("active");
    }
    audio.loop = isRepeatEnabled;
}

function playSong() {
    if (songs.length === 0) {
        playPauseButton.innerHTML = '<i class="fas fa-play"></i>';
        return;
    }

    if (currentPlayingItem) {
        currentPlayingItem.classList.remove("playing");
    }

    const currentSong = songs[currentSongIndex];
    audio.src = currentSong;
    currentPlayingItem = playlist.children[currentSongIndex];

    if (currentPlayingItem) {
        currentPlayingItem.classList.add("playing");
    }

    audio.play();
    playPauseButton.innerHTML = '<i class="fas fa-pause"></i>';
    isPlaying = true;
    updateDuration();
}

function updateDuration() {
    const durationDisplay = document.getElementById("duration-time");
    durationDisplay.textContent = formatTime(audio.duration);
}

function updateCurrentTime() {
    const currentTimeDisplay = document.getElementById("current-time");
    currentTimeDisplay.textContent = formatTime(audio.currentTime);
    progressBar.value = (audio.currentTime / audio.duration) * 100;
}

function updateProgressBar() {
    const seekTime = (progressBar.value / 100) * audio.duration;
    audio.currentTime = seekTime;
}

function handleSongEnd() {
    if (isShuffleEnabled) {
        currentSongIndex = Math.floor(Math.random() * songs.length); // Random index for shuffle
    } else if (isRepeatEnabled) {
        playSong(); // Replay the same song if repeat is enabled
        return;
    } else {
        currentSongIndex = (currentSongIndex + 1) % songs.length; // Go to next song
    }

    playSong(); // Play the next song
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' + secs : secs}`;
}

function handleSearch() {
    const query = searchBar.value.toLowerCase();
    const songItems = document.querySelectorAll("#playlist li");
    let found = false;

    songItems.forEach(songItem => {
        const songName = songItem.textContent.toLowerCase();
        if (songName.includes(query)) {
            songItem.style.display = "block";
            found = true;
        } else {
            songItem.style.display = "none";
        }
    });

    const noResultsMessage = document.getElementById("no-results-message");

    // Ensure "No results" message is displayed when no matches found
    if (found) {
        noResultsMessage.style.display = "none";
    } else {
        noResultsMessage.style.display = "block";
    }
}
const muteButton = document.getElementById("mute-btn");

muteButton.addEventListener("click", () => {
    audio.muted = !audio.muted;
    muteButton.innerHTML = audio.muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
});
